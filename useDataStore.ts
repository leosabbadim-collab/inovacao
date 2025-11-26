
import { useState, useEffect } from 'react';
import { TeamMember, Project, GlobalState, KnowledgeDoc, TrelloConfig, SeniorityLevel, PDIItem, AIConfig } from '../types';

const STORAGE_KEY = 'nexus_manager_data_v5_ai';

const INITIAL_STATE: GlobalState = {
  team: [
    {
      id: '1',
      name: 'Alice Dev',
      role: 'Engenheira Backend',
      seniority: 'Especialista',
      jobDescription: 'Arquitetar APIs escaláveis e gerenciar interações com banco de dados.',
      responsibilities: ['Gateway de API', 'Otimização de Banco de Dados'],
      demands: ['Migração para PostgreSQL', 'Code Review'],
      strengths: ['Design de Sistemas', 'Node.js', 'Mentoria'],
      weaknesses: ['CSS Frontend', 'Falar em Público'],
      notes: 'Alta performance, interesse em ML.',
      pdi: [],
      studyPlan: []
    }
  ],
  projects: [
    {
      id: '1',
      name: 'Projeto Alpha (Automação IA)',
      description: 'Automatizar tickets de suporte ao cliente usando LLMs.',
      difficulties: '',
      blockers: [],
      goals: [
          { id: 'g1', text: 'Atingir 90% de precisão', isCompleted: false },
          { id: 'g2', text: 'Tempo de resposta < 2s', isCompleted: false }
      ],
      objectives: [
          { id: 'o1', text: 'Reduzir tempo de resposta em 50%', isCompleted: false }
      ],
      status: 'Em Andamento',
      tasks: [
          { id: 't1', title: 'Prova de Conceito', status: 'done', assigneeIds: ['1'] },
          { id: 't2', title: 'Integração de API', status: 'done', assigneeIds: ['1'] },
          { id: 't3', title: 'Deploy em Produção', status: 'todo', assigneeIds: ['1'] }
      ],
      techStack: ['Python', 'React', 'Gemini API'],
      assignedTeamMembers: ['1'],
      linkedDocIds: ['kb-1']
    }
  ],
  knowledgeBase: [
    {
      id: 'kb-1',
      title: 'Arquitetura DOCs IA',
      type: 'Interno',
      category: 'Arquitetura',
      content: 'A arquitetura principal baseia-se em um sistema multi-agente usando Gemini 2.5 Flash...',
      updatedAt: Date.now()
    }
  ],
  aiConfig: {
      provider: 'gemini',
      geminiModel: 'gemini-2.5-flash',
      gptModel: 'gpt-4o',
      temperature: 0.7,
      openAIKey: ''
  }
};

export const useDataStore = () => {
  const [state, setState] = useState<GlobalState>(INITIAL_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load and Migrate Data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // MIGRATION LOGIC
        // Ensure Projects use new Task/Goal structure
        const migratedProjects = parsed.projects?.map((p: any) => ({
            ...p,
            goals: typeof p.goals?.[0] === 'string' 
                ? p.goals.map((t: string) => ({ id: Math.random().toString(), text: t, isCompleted: false })) 
                : (p.goals || []),
            objectives: typeof p.objectives?.[0] === 'string'
                ? p.objectives.map((t: string) => ({ id: Math.random().toString(), text: t, isCompleted: false }))
                : (p.objectives || []),
            blockers: p.blockers || (p.difficulties ? [{ id: Math.random().toString(), text: p.difficulties, isResolved: false }] : []),
            tasks: p.tasks || [
                ...(p.todo || []).map((t: string) => ({ id: Math.random().toString(), title: t, status: 'todo', assigneeIds: [] })),
                ...(p.done || []).map((t: string) => ({ id: Math.random().toString(), title: t, status: 'done', assigneeIds: [] }))
            ]
        })) || INITIAL_STATE.projects;

        const migratedTeam = parsed.team?.map((t: any) => ({
            ...t,
            pdi: Array.isArray(t.pdi) ? t.pdi : (t.pdi ? [{ id: 'legacy', text: 'PDI Antigo (Texto): ' + t.pdi, isCompleted: false }] : []),
            studyPlan: t.studyPlan || [],
            seniority: t.seniority || 'Analista'
        })) || INITIAL_STATE.team;

        // Ensure AI Config exists
        const migratedAI = parsed.aiConfig || INITIAL_STATE.aiConfig;

        setState({
            ...INITIAL_STATE,
            ...parsed,
            projects: migratedProjects,
            team: migratedTeam,
            aiConfig: migratedAI
        });
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isLoaded]);

  // Team Actions
  const addTeamMember = (member: TeamMember) => {
    setState(prev => ({ ...prev, team: [...prev.team, member] }));
  };

  const updateTeamMember = (id: string, updates: Partial<TeamMember>) => {
    setState(prev => ({
      ...prev,
      team: prev.team.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  };

  const deleteTeamMember = (id: string) => {
    setState(prev => ({
      ...prev,
      team: prev.team.filter(t => t.id !== id)
    }));
  };

  // Project Actions
  const addProject = (project: Project) => {
    setState(prev => ({ ...prev, projects: [...prev.projects, project] }));
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  };

  const deleteProject = (id: string) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== id)
    }));
  };

  // Knowledge Base Actions
  const addDoc = (doc: KnowledgeDoc) => {
    setState(prev => ({ ...prev, knowledgeBase: [...prev.knowledgeBase, doc] }));
  };

  const updateDoc = (id: string, updates: Partial<KnowledgeDoc>) => {
    setState(prev => ({
      ...prev,
      knowledgeBase: prev.knowledgeBase.map(d => d.id === id ? { ...d, ...updates, updatedAt: Date.now() } : d)
    }));
  };

  const deleteDoc = (id: string) => {
    setState(prev => ({
      ...prev,
      knowledgeBase: prev.knowledgeBase.filter(d => d.id !== id)
    }));
  };

  // Settings Actions
  const updateTrelloConfig = (config: TrelloConfig) => {
    setState(prev => ({ ...prev, trelloConfig: config }));
  };

  const updateAIConfig = (config: AIConfig) => {
      setState(prev => ({ ...prev, aiConfig: config }));
  };

  const syncTrelloDemands = (demandsMap: Record<string, string[]>, statsMap?: Record<string, {aligned: number, misaligned: number}>) => {
    setState(prev => ({
      ...prev,
      team: prev.team.map(member => {
        const updates: any = {};
        if (demandsMap[member.id]) {
          updates.demands = demandsMap[member.id];
        }
        if (statsMap && statsMap[member.id]) {
            updates.alignedTaskCount = statsMap[member.id].aligned;
            updates.misalignedTaskCount = statsMap[member.id].misaligned;
        }
        return { ...member, ...updates };
      })
    }));
  };

  return {
    state,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
    addProject,
    updateProject,
    deleteProject,
    addDoc,
    updateDoc,
    deleteDoc,
    updateTrelloConfig,
    updateAIConfig,
    syncTrelloDemands
  };
};
