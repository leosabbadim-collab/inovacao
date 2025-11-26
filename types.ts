
export type SeniorityLevel = 'Estagiário' | 'Assistente' | 'Analista' | 'Especialista';

export interface PDIItem {
  id: string;
  text: string;
  isCompleted: boolean;
  category?: 'Curto Prazo' | 'Médio Prazo' | 'Ação' | 'Mentoria';
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  seniority: SeniorityLevel;
  jobDescription: string;
  responsibilities: string[]; // Manter para compatibilidade
  demands: string[]; // Trello Cards mapped here
  strengths: string[];
  weaknesses: string[];
  notes: string;
  pdi: PDIItem[]; // Agora é uma lista estruturada
  studyPlan: string[]; // IDs dos Docs da KnowledgeBase
  trelloMemberId?: string;
  alignedTaskCount?: number; 
  misalignedTaskCount?: number;
}

export interface ProjectRisk {
  overallScore: number;
  deadlineRisk: number;
  complexityRisk: number;
  headcountRisk: number;
  competencyRisk: number;
  analysis: string;
  lastUpdated: number;
}

export type TaskStatus = 'backlog' | 'todo' | 'done';

export interface ProjectTask {
  id: string;
  title: string;
  assigneeIds: string[];
  dueDate?: number;
  status: TaskStatus;
}

export interface ProjectGoal {
  id: string;
  text: string;
  isCompleted: boolean;
  dueDate?: number;
}

export interface ProjectBlocker {
  id: string;
  text: string;
  isResolved: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  difficulties: string; // Manter texto legacy, mas usar blockers na UI nova
  blockers: ProjectBlocker[]; // Novo campo estruturado
  status: 'Planejamento' | 'Em Andamento' | 'Pausado' | 'Concluído';
  
  // Novos campos estruturados (substituem todo/done/goals strings antigos)
  goals: ProjectGoal[]; 
  objectives: ProjectGoal[]; // Objetivos macro
  tasks: ProjectTask[];

  techStack: string[];
  assignedTeamMembers: string[];
  linkedDocIds: string[];
  riskAssessment?: ProjectRisk;
}

export type DocType = 'Interno' | 'Externo';

export interface KnowledgeDoc {
  id: string;
  title: string;
  type: DocType;
  category: 'Arquitetura' | 'Lógica' | 'Agentes' | 'Geral' | 'Artigo' | 'Notícia' | 'Benchmark';
  content: string;
  analysis?: string;
  updatedAt: number;
}

export interface TrelloConfig {
  apiKey: string;
  token: string;
  boardId: string;
}

export interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  idList: string;
  listName?: string;
  url: string;
  idMembers: string[];
  alignmentScore?: number;
  alignmentReason?: string;
}

export interface TrelloList {
  id: string;
  name: string;
}

export type AIProvider = 'gemini' | 'gpt';

export interface AIConfig {
  provider: AIProvider;
  // OpenAI specific
  openAIKey?: string;
  gptModel: string; // e.g. 'gpt-4o', 'gpt-3.5-turbo'
  // Gemini specific
  geminiModel: string; // e.g. 'gemini-2.5-flash'
  // Shared
  temperature: number;
}

export interface GlobalState {
  team: TeamMember[];
  projects: Project[];
  knowledgeBase: KnowledgeDoc[];
  trelloConfig?: TrelloConfig;
  aiConfig: AIConfig;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
