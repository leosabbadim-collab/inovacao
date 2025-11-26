
import { GoogleGenAI, Chat } from "@google/genai";
import { GlobalState, TeamMember, Project, TrelloCard, KnowledgeDoc, PDIItem, AIConfig } from "../types";

const geminiApiKey = process.env.API_KEY || '';
const googleAI = new GoogleGenAI({ apiKey: geminiApiKey });

// --- Internal GPT Wrapper ---
class GPTChatSession {
    private history: {role: string, content: string}[] = [];
    private config: AIConfig;
    private systemInstruction: string;

    constructor(config: AIConfig, systemInstruction: string) {
        this.config = config;
        this.systemInstruction = systemInstruction;
    }

    async sendMessage(params: { message: string }) {
        this.history.push({ role: 'user', content: params.message });

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.openAIKey}`
                },
                body: JSON.stringify({
                    model: this.config.gptModel,
                    messages: [
                        { role: 'system', content: this.systemInstruction },
                        ...this.history
                    ],
                    temperature: this.config.temperature,
                    max_tokens: 2000
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API Error: ${response.statusText}`);
            }

            const data = await response.json();
            const text = data.choices?.[0]?.message?.content || "Sem resposta.";

            this.history.push({ role: 'assistant', content: text });
            return { text }; // Mimic GoogleGenAI response structure
        } catch (e: any) {
            console.error(e);
            return { text: `Erro GPT: ${e.message}` };
        }
    }
}

// --- Shared Logic ---

const createContextPrompt = (state: GlobalState) => {
  const kbContext = state.knowledgeBase.map(doc => 
    `-- DOCUMENTO (${doc.type}): ${doc.title} (${doc.category}) --\n${doc.content}\n`
  ).join('\n');

  return `
Você é o Nexus, um consultor avançado de gestão técnica e inteligência artificial.
Você auxilia um Gestor a supervisionar um time de engenharia e múltiplos projetos.
O idioma obrigatório é PORTUGUÊS (PT-BR).

CONTEXTO DE DADOS ATUAL (JSON):
${JSON.stringify({ time: state.team, projetos: state.projects }, null, 2)}

BASE DE CONHECIMENTO INTERNA (DOCs IA & Referências):
${kbContext}

SEU OBJETIVO:
- Analisar pontos fortes, fracos e carga de trabalho do time para sugerir alocações.
- Revisar status de projetos para identificar riscos, passos faltantes ou oportunidades de automação.
- Sugerir novas ideias baseadas nas capacidades do time e tendências de mercado (especialmente IA/Automação).
- Fornecer feedback construtivo para desenvolvimento pessoal (PDI).
- Responder perguntas sobre a arquitetura e lógica encontrada na Base de Conhecimento.

DIRETRIZES:
- Seja conciso, estratégico e acionável.
- Ao se referir a uma pessoa ou projeto, use os dados específicos do contexto.
- Sempre responda em Português do Brasil.
`;
};

// Unified Generator Function
const generateContentUnified = async (config: AIConfig, prompt: string, jsonMode: boolean = false): Promise<string> => {
    if (config.provider === 'gpt') {
        if (!config.openAIKey) return "Erro: Chave API do GPT não configurada.";
        
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.openAIKey}`
                },
                body: JSON.stringify({
                    model: config.gptModel,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: config.temperature,
                    response_format: jsonMode ? { type: "json_object" } : undefined
                })
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            return data.choices?.[0]?.message?.content || "";
        } catch (e: any) {
            console.error("GPT Error", e);
            return `Erro GPT: ${e.message}`;
        }
    } else {
        // Gemini Default
        try {
            const response = await googleAI.models.generateContent({
                model: config.geminiModel || 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    temperature: config.temperature,
                    responseMimeType: jsonMode ? 'application/json' : 'text/plain'
                }
            });
            return response.text || "";
        } catch (e: any) {
            console.error("Gemini Error", e);
            return `Erro Gemini: ${e.message}`;
        }
    }
};

export const createChatSession = (state: GlobalState): any => {
  const systemInstruction = createContextPrompt(state);
  const config = state.aiConfig;

  if (config.provider === 'gpt') {
      if (!config.openAIKey) {
          // Return a dummy that complains
          return {
              sendMessage: async () => ({ text: "Erro: Chave API do OpenAI não configurada. Vá em Configurações > IA." })
          };
      }
      return new GPTChatSession(config, systemInstruction);
  }

  // Gemini Default
  return googleAI.chats.create({
    model: config.geminiModel || 'gemini-2.5-flash',
    config: {
      systemInstruction,
      temperature: config.temperature,
      maxOutputTokens: 8000,
    },
  });
};

export const generateQuickAnalysis = async (state: GlobalState, prompt: string): Promise<string> => {
    const fullPrompt = `${createContextPrompt(state)}\n\nPERGUNTA DO USUÁRIO: ${prompt}`;
    return generateContentUnified(state.aiConfig, fullPrompt);
};

export const generateAlignmentAnalysis = async (
    member: TeamMember, 
    cards: TrelloCard[], 
    projects: Project[],
    config: AIConfig
): Promise<{ text: string, scoredCards: {id: string, score: number, reason: string}[] }> => {
    
    const prompt = `
    PAPEL: Você é um Gerente de Engenharia especialista fazendo uma auditoria de alinhamento.
    
    MEMBRO DO TIME:
    Nome: ${member.name}
    Cargo: ${member.role} (${member.seniority})
    Descrição: ${member.jobDescription}
    
    TAREFAS DO TRELLO (Dados Reais):
    ${JSON.stringify(cards.map(c => ({ id: c.id, name: c.name, list: c.listName, desc: c.desc })))}

    OBJETIVOS DOS PROJETOS (Todos ativos):
    ${projects.map(p => `- ${p.name}: ${p.objectives.map(o => o.text).join('; ')}`).join('\n')}

    TAREFA:
    1. Para CADA tarefa, dê uma nota de 0 a 100 de alinhamento com os Objetivos dos Projetos e o Cargo da pessoa.
       - >80: Altamente Alinhado (Crítico para o projeto ou função core).
       - <50: Suspeito (Desvio de escopo, busy work ou desalinhado).
    2. Gere um resumo executivo HTML em PT-BR.

    FORMATO DE SAÍDA OBRIGATÓRIO (JSON):
    {
       "summaryHtml": "Seu resumo em <b>HTML</b> aqui...",
       "cardScores": [
          { "id": "id_da_tarefa", "score": 95, "reason": "Curta justificativa" }
       ]
    }
    `;

    try {
        const jsonStr = await generateContentUnified(config, prompt, true);
        const result = JSON.parse(jsonStr);
        return {
            text: result.summaryHtml || "Análise falhou.",
            scoredCards: result.cardScores || []
        };
    } catch (error) {
        console.error(error);
        return { text: "Erro ao conectar com IA.", scoredCards: [] };
    }
};

export const generatePDI = async (member: TeamMember, state: GlobalState): Promise<PDIItem[]> => {
    const prompt = `
    Crie um Plano de Desenvolvimento Individual (PDI) ESTRUTURADO para:
    Nome: ${member.name}
    Senioridade Atual: ${member.seniority}
    Pontos Fortes: ${member.strengths.join(', ')}
    Pontos Fracos: ${member.weaknesses.join(', ')}
    Demandas Atuais: ${member.demands.join(', ')}
    
    Considere os projetos atuais da empresa e a stack tecnológica (${state.projects.map(p => p.techStack.join(', ')).join(', ')}).
    
    Retorne uma lista JSON de ações concretas.
    Categorias aceitas: 'Curto Prazo', 'Médio Prazo', 'Ação', 'Mentoria'.
    
    FORMATO JSON ARRAY:
    [
      { "text": "Estudar a documentação X", "category": "Curto Prazo" },
      { "text": "Realizar Code Review do Projeto Y", "category": "Ação" }
    ]
    `;
    
    try {
        const jsonStr = await generateContentUnified(state.aiConfig, prompt, true);
        const items = JSON.parse(jsonStr);
        return items.map((item: any) => ({
            id: Math.random().toString(),
            text: item.text,
            category: item.category,
            isCompleted: false
        }));
    } catch (error) {
        console.error(error);
        return [];
    }
};

export const assessProjectRisk = async (project: Project, teamMembers: TeamMember[], config: AIConfig): Promise<any> => {
    const prompt = `
    Realize uma Análise de Risco detalhada para o projeto: "${project.name}".
    
    DADOS DO PROJETO:
    Status: ${project.status}
    Objetivos: ${project.objectives.map(o => o.text).join(', ')}
    Bloqueios: ${project.blockers.map(b => b.text).join(', ')}
    Stack: ${project.techStack.join(', ')}
    Tarefas Pendentes: ${project.tasks.filter(t => t.status === 'todo').map(t => t.title).join(', ')}
    
    TIME ALOCADO:
    ${teamMembers.map(m => `- ${m.name} (${m.seniority}): ${m.strengths.join(', ')}`).join('\n')}
    
    Avalie o risco (0 a 100, onde 100 é Risco Crítico/Falha Iminente) nos vetores:
    1. Prazo (DeadlineRisk)
    2. Complexidade Técnica (ComplexityRisk)
    3. Quantidade de Pessoas (HeadcountRisk - falta gente?)
    4. Competência Técnica (CompetencyRisk - o time sabe a stack?)
    
    Retorne APENAS um JSON:
    {
      "overallScore": number,
      "deadlineRisk": number,
      "complexityRisk": number,
      "headcountRisk": number,
      "competencyRisk": number,
      "analysis": "Texto explicativo curto em PT-BR"
    }
    `;

    try {
        const jsonStr = await generateContentUnified(config, prompt, true);
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error(e);
        return null;
    }
};

export const analyzeExternalResource = async (doc: KnowledgeDoc, state: GlobalState): Promise<string> => {
    const prompt = `
    Analise este Recurso Externo (Link, Artigo ou Texto) para a empresa:
    Título: ${doc.title}
    Conteúdo: ${doc.content}
    
    Compare com os Projetos Atuais e Metodologias do time (Stack: ${state.projects.map(p => p.techStack).flat().join(', ')}).
    
    1. Isso está alinhado com o que estamos fazendo? (Apoia ou Contradiz?)
    2. Sugira qual membro do time (${state.team.map(m => m.name).join(', ')}) deveria estudar isso com base em seus pontos fortes/fracos.
    
    Responda em texto corrido (Markdown).
    `;
    return await generateContentUnified(state.aiConfig, prompt);
};
