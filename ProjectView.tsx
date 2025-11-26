
import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Layers, ListTodo, CheckCircle2, Lightbulb, Target, AlertOctagon, FileText, BarChart3, Activity, Calendar, User, ArrowRight, LayoutList, ChevronRight } from 'lucide-react';
import { Project, GlobalState, ProjectRisk, ProjectTask, TaskStatus, ProjectGoal, ProjectBlocker, TeamMember } from '../types';
import { generateQuickAnalysis, assessProjectRisk } from '../services/geminiService';

interface Props {
  projects: Project[];
  onAdd: (project: Project) => void;
  onUpdate: (id: string, updates: Partial<Project>) => void;
  onDelete: (id: string) => void;
  fullState: GlobalState;
}

const ProjectView: React.FC<Props> = ({ projects, onAdd, onUpdate, onDelete, fullState }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [aiIdea, setAiIdea] = useState<string | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [assessingRiskId, setAssessingRiskId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Project>>({});

  const startEdit = (project?: Project) => {
    if (project) {
      setEditingId(project.id);
      setFormData(project);
    } else {
      setEditingId('new');
      setFormData({
        name: '',
        description: '',
        difficulties: '',
        blockers: [],
        status: 'Planejamento',
        objectives: [],
        goals: [],
        tasks: [],
        techStack: [],
        assignedTeamMembers: [],
        linkedDocIds: []
      });
    }
  };

  const handleSave = () => {
    if (editingId === 'new') {
      const newProject: Project = {
        id: Date.now().toString(),
        name: formData.name || 'Novo Projeto',
        description: formData.description || '',
        difficulties: formData.difficulties || '',
        blockers: [],
        status: (formData.status as any) || 'Planejamento',
        objectives: [],
        goals: [],
        tasks: [],
        techStack: formData.techStack || [],
        assignedTeamMembers: [],
        linkedDocIds: []
      };
      onAdd(newProject);
    } else if (editingId) {
      onUpdate(editingId, formData);
    }
    setEditingId(null);
  };

  const handleArrayInput = (key: keyof Project, value: string) => {
    const list = value.split(',').map(item => item.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, [key]: list }));
  };

  const generateProjectIdeas = async () => {
    setIsAnalysing(true);
    setAiIdea(null);
    const prompt = `Baseado nos projetos atuais e capacidades do time (especialmente IA/Automação), sugira 3 inovações ou novos projetos de alto impacto. Também sugira uma melhoria para um projeto existente. Responda em Português.`;
    const result = await generateQuickAnalysis(fullState, prompt);
    setAiIdea(result);
    setIsAnalysing(false);
  };

  const handleRiskAssessment = async (project: Project) => {
      setAssessingRiskId(project.id);
      const teamMembers = fullState.team.filter(m => project.assignedTeamMembers.includes(m.id));
      const riskData: ProjectRisk = await assessProjectRisk(project, teamMembers, fullState.aiConfig);
      
      if (riskData) {
          onUpdate(project.id, { riskAssessment: { ...riskData, lastUpdated: Date.now() } });
      }
      setAssessingRiskId(null);
  };

  const activeProject = projects.find(p => p.id === workspaceId);

  // Tasks
  const addTask = (title: string, status: TaskStatus = 'todo') => {
      if (!activeProject || !title.trim()) return;
      const newTask: ProjectTask = {
          id: Date.now().toString(),
          title,
          status,
          assigneeIds: []
      };
      onUpdate(activeProject.id, { tasks: [...activeProject.tasks, newTask] });
  };

  const updateTask = (taskId: string, updates: Partial<ProjectTask>) => {
      if (!activeProject) return;
      const newTasks = activeProject.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
      onUpdate(activeProject.id, { tasks: newTasks });
  };

  const deleteTask = (taskId: string) => {
      if (!activeProject) return;
      const newTasks = activeProject.tasks.filter(t => t.id !== taskId);
      onUpdate(activeProject.id, { tasks: newTasks });
  };

  // Goals
  const addGoal = (type: 'goals' | 'objectives', text: string) => {
       if (!activeProject || !text.trim()) return;
       const newGoal: ProjectGoal = { id: Date.now().toString(), text, isCompleted: false };
       onUpdate(activeProject.id, { [type]: [...activeProject[type], newGoal] });
  };

  const toggleGoal = (type: 'goals' | 'objectives', id: string) => {
      if (!activeProject) return;
      const updated = activeProject[type].map(g => g.id === id ? { ...g, isCompleted: !g.isCompleted } : g);
      onUpdate(activeProject.id, { [type]: updated });
  };

  const deleteGoal = (type: 'goals' | 'objectives', id: string) => {
      if (!activeProject) return;
      const updated = activeProject[type].filter(g => g.id !== id);
      onUpdate(activeProject.id, { [type]: updated });
  };

  // Blockers
  const addBlocker = (text: string) => {
      if (!activeProject || !text.trim()) return;
      const newBlocker: ProjectBlocker = { id: Date.now().toString(), text, isResolved: false };
      onUpdate(activeProject.id, { blockers: [...activeProject.blockers, newBlocker] });
  };

  const convertBlockerToAction = (blockerId: string) => {
      if (!activeProject) return;
      const blocker = activeProject.blockers.find(b => b.id === blockerId);
      if (!blocker) return;

      const newTask: ProjectTask = {
          id: Date.now().toString(),
          title: `Resolver: ${blocker.text}`,
          status: 'todo',
          assigneeIds: []
      };

      const updatedBlockers = activeProject.blockers.filter(b => b.id !== blockerId);
      
      onUpdate(activeProject.id, { 
          tasks: [...activeProject.tasks, newTask],
          blockers: updatedBlockers
      });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído': return 'bg-green-100 text-green-800 border-green-200';
      case 'Em Andamento': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Pausado': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#00386C]">Projetos Ativos</h2>
          <p className="text-[#656464]">Objetivos, metas, documentos e análise de risco.</p>
        </div>
         <div className="flex gap-2">
             <button 
                onClick={generateProjectIdeas}
                className="flex items-center gap-2 px-4 py-2 bg-[#B0C934] hover:bg-[#9db32e] text-white rounded-lg transition-colors shadow-md"
                disabled={isAnalysing}
            >
                <Lightbulb size={18} />
                {isAnalysing ? 'Pensando...' : 'Brainstorm IA'}
            </button>
            <button
            onClick={() => startEdit()}
            className="flex items-center gap-2 px-4 py-2 bg-[#005290] hover:bg-[#00386C] text-white rounded-lg transition-colors shadow-md"
            >
            <Plus size={18} />
            Novo Projeto
            </button>
        </div>
      </div>

       {aiIdea && (
          <div className="mb-6 bg-white border border-[#B0C934] p-6 rounded-xl relative shadow-lg animate-in fade-in slide-in-from-top-4">
              <button onClick={() => setAiIdea(null)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"><X size={16}/></button>
              <h3 className="font-bold text-[#00386C] flex items-center gap-2 mb-2"><Lightbulb size={16} className="text-[#B0C934]"/> Ideias & Melhorias IA</h3>
              <p className="text-[#656464] text-sm whitespace-pre-wrap leading-relaxed">{aiIdea}</p>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {projects.map(project => (
          <div key={project.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-md group hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3 cursor-pointer w-full" onClick={() => setWorkspaceId(project.id)}>
                 <div className="p-3 bg-[#00386C] rounded-lg text-white">
                    <Layers size={20} />
                 </div>
                 <div className="flex-1">
                    <h3 className="text-lg font-bold text-[#00386C] group-hover:text-[#00AEEE] transition-colors flex items-center gap-2">
                        {project.name} <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 text-[#00AEEE]"/>
                    </h3>
                    <div className="flex gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${getStatusColor(project.status)}`}>
                            {project.status}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                            <ListTodo size={12}/> {project.tasks.filter(t => t.status === 'done').length}/{project.tasks.length}
                        </span>
                    </div>
                 </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(project)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                    <Edit2 size={16} />
                </button>
                <button onClick={() => onDelete(project.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-400">
                    <Trash2 size={16} />
                </button>
              </div>
            </div>

            <p className="text-[#656464] mb-4 line-clamp-2 text-sm h-10">{project.description}</p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="bg-gray-50 p-2 rounded border border-gray-100 text-center">
                    <span className="block text-lg font-bold text-[#005290]">{project.objectives.length}</span>
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Objetivos</span>
                </div>
                <div className="bg-gray-50 p-2 rounded border border-gray-100 text-center">
                    <span className="block text-lg font-bold text-[#005290]">{project.goals.length}</span>
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Metas</span>
                </div>
                 <div className="bg-gray-50 p-2 rounded border border-gray-100 text-center">
                    <span className={`block text-lg font-bold ${project.blockers.length > 0 ? 'text-red-500' : 'text-green-500'}`}>{project.blockers.length}</span>
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Bloqueios</span>
                </div>
            </div>

             <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                {project.techStack.map((tech, i) => (
                    <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200 font-medium">{tech}</span>
                ))}
             </div>
          </div>
        ))}
      </div>

      {/* PROJECT WORKSPACE MODAL */}
      {activeProject && (
        <div className="fixed inset-0 bg-[#00386C]/80 backdrop-blur-sm z-50 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-md">
                <div className="flex items-center gap-4">
                    <button onClick={() => setWorkspaceId(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                        <X size={24}/>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-[#00386C] flex items-center gap-3">
                            {activeProject.name} 
                            <span className={`text-xs px-2 py-0.5 rounded border font-normal ${getStatusColor(activeProject.status)}`}>
                                {activeProject.status}
                            </span>
                        </h1>
                        <p className="text-sm text-[#656464] line-clamp-1">{activeProject.description}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => handleRiskAssessment(activeProject)} disabled={assessingRiskId === activeProject.id} className="px-3 py-1.5 bg-white hover:bg-gray-50 text-[#005290] rounded border border-gray-300 flex items-center gap-2 text-sm font-medium shadow-sm">
                        {assessingRiskId === activeProject.id ? <Activity className="animate-spin" size={16}/> : <BarChart3 size={16}/>}
                        Análise de Risco (IA)
                    </button>
                    <div className="h-8 w-px bg-gray-300 mx-2"></div>
                    {fullState.team.map(m => (
                        activeProject.assignedTeamMembers.includes(m.id) && (
                            <div key={m.id} className="w-8 h-8 bg-[#005290] rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-white shadow-sm" title={m.name}>
                                {m.name.charAt(0)}
                            </div>
                        )
                    ))}
                    <button onClick={() => startEdit(activeProject)} className="w-8 h-8 rounded-full border border-dashed border-gray-400 flex items-center justify-center text-gray-400 hover:text-[#005290] hover:border-[#005290]">
                        <Plus size={16}/>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-[#f3f4f6]">
                
                {/* Left Panel: Goals & Blockers */}
                <div className="lg:w-1/3 bg-white border-r border-gray-200 overflow-y-auto p-6 space-y-8">
                    
                    {/* Objectives & Goals */}
                    <div className="space-y-6">
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm">
                             <h3 className="font-bold text-[#00386C] mb-3 flex items-center gap-2 uppercase text-xs tracking-wider">
                                <Target size={16} className="text-[#00AEEE]"/> Objetivos Macro
                            </h3>
                            <div className="space-y-2">
                                {activeProject.objectives.map(obj => (
                                    <div key={obj.id} className="flex gap-2 items-start group p-2 bg-white rounded border border-gray-100">
                                        <input type="checkbox" checked={obj.isCompleted} onChange={() => toggleGoal('objectives', obj.id)} className="mt-1 rounded text-[#005290] focus:ring-[#005290]"/>
                                        <span className={`text-sm flex-1 ${obj.isCompleted ? 'text-gray-400 line-through' : 'text-[#333]'}`}>{obj.text}</span>
                                        <button onClick={() => deleteGoal('objectives', obj.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><X size={14}/></button>
                                    </div>
                                ))}
                                <div className="flex gap-2 mt-3">
                                    <input id="newObj" className="bg-white border border-gray-300 rounded px-3 py-2 text-xs w-full focus:border-[#00AEEE] outline-none" placeholder="Novo objetivo..." onKeyDown={(e) => { if (e.key === 'Enter') { addGoal('objectives', e.currentTarget.value); e.currentTarget.value = ''; }}}/>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm">
                             <h3 className="font-bold text-[#00386C] mb-3 flex items-center gap-2 uppercase text-xs tracking-wider">
                                <CheckCircle2 size={16} className="text-[#B0C934]"/> Metas & KPIs
                            </h3>
                             <div className="space-y-2">
                                {activeProject.goals.map(goal => (
                                    <div key={goal.id} className="flex gap-2 items-start group p-2 bg-white rounded border border-gray-100">
                                        <input type="checkbox" checked={goal.isCompleted} onChange={() => toggleGoal('goals', goal.id)} className="mt-1 rounded text-[#005290] focus:ring-[#005290]"/>
                                        <div className="flex-1">
                                            <span className={`text-sm block font-medium ${goal.isCompleted ? 'text-gray-400 line-through' : 'text-[#333]'}`}>{goal.text}</span>
                                            {goal.dueDate && <span className="text-[10px] text-gray-500 flex items-center gap-1"><Calendar size={10}/> {new Date(goal.dueDate).toLocaleDateString()}</span>}
                                        </div>
                                        <button onClick={() => deleteGoal('goals', goal.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><X size={14}/></button>
                                    </div>
                                ))}
                                <div className="flex gap-2 mt-3">
                                    <input id="newGoal" className="bg-white border border-gray-300 rounded px-3 py-2 text-xs w-full focus:border-[#00AEEE] outline-none" placeholder="Nova meta..." onKeyDown={(e) => { if (e.key === 'Enter') { addGoal('goals', e.currentTarget.value); e.currentTarget.value = ''; }}}/>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Blockers */}
                    <div className="bg-red-50 rounded-xl p-5 border border-red-100 shadow-sm">
                         <h3 className="font-bold text-red-700 mb-3 flex items-center gap-2 uppercase text-xs tracking-wider">
                            <AlertOctagon size={16}/> Dificuldades & Bloqueios
                        </h3>
                        {activeProject.blockers.length === 0 && <p className="text-xs text-red-400 italic">Nenhum bloqueio reportado.</p>}
                        <div className="space-y-3">
                            {activeProject.blockers.map(blocker => (
                                <div key={blocker.id} className="bg-white p-3 rounded border border-red-100 text-sm text-[#333] group shadow-sm">
                                    <p className="mb-2 font-medium">{blocker.text}</p>
                                    <button 
                                        onClick={() => convertBlockerToAction(blocker.id)}
                                        className="w-full py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs rounded flex items-center justify-center gap-1 transition-colors font-bold"
                                    >
                                        <ArrowRight size={12}/> Converter em Ação
                                    </button>
                                </div>
                            ))}
                             <div className="flex gap-2 mt-3">
                                <input id="newBlocker" className="bg-white border border-red-200 rounded px-3 py-2 text-xs w-full text-red-800 placeholder-red-300 focus:border-red-400 outline-none" placeholder="Reportar bloqueio..." onKeyDown={(e) => { if (e.key === 'Enter') { addBlocker(e.currentTarget.value); e.currentTarget.value = ''; }}}/>
                            </div>
                        </div>
                    </div>

                    {/* Risk Analysis Output */}
                    {activeProject.riskAssessment && (
                        <div className="bg-blue-50 rounded-xl p-5 border border-blue-100 shadow-sm">
                            <h3 className="font-bold text-[#005290] mb-2 uppercase text-xs tracking-wider">Análise de Risco (IA)</h3>
                            <div className="text-sm text-[#656464] italic mb-3">{activeProject.riskAssessment.analysis}</div>
                            <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden shadow-inner">
                                <div className={`h-full rounded-full ${activeProject.riskAssessment.overallScore > 70 ? 'bg-red-500' : activeProject.riskAssessment.overallScore > 40 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${activeProject.riskAssessment.overallScore}%` }}></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1 font-medium">
                                <span>Score de Risco: {activeProject.riskAssessment.overallScore}/100</span>
                                <span>{new Date(activeProject.riskAssessment.lastUpdated).toLocaleDateString()}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Panel: Kanban Board */}
                <div className="flex-1 p-6 overflow-hidden flex flex-col bg-[#f3f4f6] bg-dms-grid">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-[#00386C] flex items-center gap-2"><LayoutList size={20}/> Quadro de Ações</h2>
                         <button 
                            onClick={() => {
                                const title = prompt("Nova Tarefa:");
                                if (title) addTask(title, 'todo');
                            }}
                            className="px-4 py-2 bg-[#005290] hover:bg-[#00386C] text-white text-sm rounded-lg flex items-center gap-2 shadow-md transition-colors"
                        >
                            <Plus size={16}/> Nova Tarefa
                        </button>
                    </div>

                    <div className="flex-1 grid grid-cols-3 gap-6 overflow-hidden h-full">
                        {/* Column: Backlog */}
                        <div className="flex flex-col bg-gray-100 rounded-xl border border-gray-200 shadow-inner">
                            <div className="p-3 border-b border-gray-200 bg-gray-200/50 rounded-t-xl sticky top-0">
                                <h3 className="text-xs font-bold text-[#656464] uppercase tracking-wider flex justify-between">
                                    Backlog
                                    <span className="bg-white px-2 py-0.5 rounded-full text-[#00386C] shadow-sm">{activeProject.tasks.filter(t => t.status === 'backlog').length}</span>
                                </h3>
                            </div>
                            <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                                {activeProject.tasks.filter(t => t.status === 'backlog').map(task => (
                                    <TaskCard key={task.id} task={task} project={activeProject} onUpdate={updateTask} onDelete={deleteTask} team={fullState.team}/>
                                ))}
                            </div>
                        </div>

                         {/* Column: To Do */}
                         <div className="flex flex-col bg-blue-50/50 rounded-xl border border-blue-100 shadow-inner">
                            <div className="p-3 border-b border-blue-100 bg-blue-100/50 rounded-t-xl sticky top-0">
                                <h3 className="text-xs font-bold text-[#005290] uppercase tracking-wider flex justify-between">
                                    Em Andamento
                                    <span className="bg-white px-2 py-0.5 rounded-full text-[#005290] shadow-sm">{activeProject.tasks.filter(t => t.status === 'todo').length}</span>
                                </h3>
                            </div>
                            <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                                {activeProject.tasks.filter(t => t.status === 'todo').map(task => (
                                    <TaskCard key={task.id} task={task} project={activeProject} onUpdate={updateTask} onDelete={deleteTask} team={fullState.team}/>
                                ))}
                            </div>
                        </div>

                         {/* Column: Done */}
                         <div className="flex flex-col bg-green-50/50 rounded-xl border border-green-100 shadow-inner">
                            <div className="p-3 border-b border-green-100 bg-green-100/50 rounded-t-xl sticky top-0">
                                <h3 className="text-xs font-bold text-green-700 uppercase tracking-wider flex justify-between">
                                    Concluído
                                    <span className="bg-white px-2 py-0.5 rounded-full text-green-700 shadow-sm">{activeProject.tasks.filter(t => t.status === 'done').length}</span>
                                </h3>
                            </div>
                            <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                                {activeProject.tasks.filter(t => t.status === 'done').map(task => (
                                    <TaskCard key={task.id} task={task} project={activeProject} onUpdate={updateTask} onDelete={deleteTask} team={fullState.team}/>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Basic Edit Modal (Only for setup) */}
      {editingId && (
        <div className="fixed inset-0 bg-[#00386C]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-[#00386C]">{editingId === 'new' ? 'Novo Projeto' : 'Editar Configuração'}</h3>
              <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-[#00386C]"><X /></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-[#656464] mb-1">Nome do Projeto</label>
                        <input 
                            className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-[#333] focus:border-[#00AEEE] outline-none"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[#656464] mb-1">Status</label>
                        <select 
                             className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-[#333] focus:border-[#00AEEE] outline-none"
                             value={formData.status}
                             onChange={e => setFormData({...formData, status: e.target.value as any})}
                        >
                            <option value="Planejamento">Planejamento</option>
                            <option value="Em Andamento">Em Andamento</option>
                            <option value="Pausado">Pausado</option>
                            <option value="Concluído">Concluído</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[#656464] mb-1">Descrição</label>
                    <textarea 
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-[#333] h-20 focus:border-[#00AEEE] outline-none"
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                </div>
                
                 <div>
                    <label className="block text-sm font-medium text-[#656464] mb-1">Tech Stack (separado por vírgula)</label>
                    <input 
                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-[#333] focus:border-[#00AEEE] outline-none"
                        value={formData.techStack?.join(', ')}
                        onChange={e => handleArrayInput('techStack', e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-[#656464] mb-2">Atribuir Membros</label>
                    <div className="flex flex-wrap gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                        {fullState.team.map(member => (
                             <label key={member.id} className="flex items-center gap-2 text-sm bg-white px-3 py-1.5 rounded border border-gray-300 cursor-pointer hover:border-[#00AEEE] transition-colors">
                                <input 
                                    type="checkbox"
                                    checked={formData.assignedTeamMembers?.includes(member.id)}
                                    onChange={(e) => {
                                        const current = formData.assignedTeamMembers || [];
                                        if (e.target.checked) setFormData({ ...formData, assignedTeamMembers: [...current, member.id] });
                                        else setFormData({ ...formData, assignedTeamMembers: current.filter(id => id !== member.id) });
                                    }}
                                    className="rounded text-[#005290] focus:ring-[#005290]"
                                />
                                {member.name}
                            </label>
                        ))}
                    </div>
                </div>

                {editingId === 'new' && (
                    <div className="bg-blue-50 p-3 rounded text-xs text-[#005290] border border-blue-100">
                        Nota: Tarefas, Metas e Bloqueios são gerenciados no Workspace do projeto após a criação.
                    </div>
                )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setEditingId(null)} className="px-4 py-2 hover:bg-gray-100 rounded text-[#656464]">Cancelar</button>
              <button onClick={handleSave} className="px-4 py-2 bg-[#005290] hover:bg-[#00386C] rounded text-white flex items-center gap-2 shadow-md">
                <Check size={18}/> Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface TaskCardProps {
    task: ProjectTask;
    project: Project;
    onUpdate: (id: string, u: Partial<ProjectTask>) => void;
    onDelete: (id: string) => void;
    team: TeamMember[];
}

const TaskCard: React.FC<TaskCardProps> = ({ 
    task, project, onUpdate, onDelete, team 
}) => {
    return (
        <div className="bg-white p-3 rounded-lg border border-gray-200 hover:border-[#00AEEE] transition-all shadow-sm group relative hover:shadow-md">
            <button onClick={() => onDelete(task.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"><X size={14}/></button>
            
            <textarea 
                className="bg-transparent text-sm text-[#333] w-full resize-none focus:outline-none mb-2 font-medium"
                value={task.title}
                onChange={(e) => onUpdate(task.id, { title: e.target.value })}
                rows={2}
            />

            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                 <div className="flex -space-x-1.5 overflow-hidden">
                    {team.filter(m => task.assigneeIds.includes(m.id)).map(m => (
                        <div key={m.id} className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-[#00386C] text-[9px] flex items-center justify-center font-bold text-white uppercase shadow-sm" title={m.name}>
                            {m.name.charAt(0)}
                        </div>
                    ))}
                    <select 
                        className="w-6 h-6 bg-gray-200 rounded-full text-[0px] focus:outline-none opacity-50 hover:opacity-100 cursor-pointer border-none"
                        onChange={(e) => {
                             if(e.target.value) {
                                 const current = task.assigneeIds;
                                 if (current.includes(e.target.value)) onUpdate(task.id, { assigneeIds: current.filter(id => id !== e.target.value) });
                                 else onUpdate(task.id, { assigneeIds: [...current, e.target.value] });
                                 e.target.value = '';
                             }
                        }}
                        value=""
                    >
                        <option value="">+</option>
                        {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
                
                <div className="flex gap-1">
                    {task.status !== 'backlog' && (
                        <button onClick={() => onUpdate(task.id, { status: 'backlog' })} className="p-1 rounded hover:bg-gray-200 text-gray-500" title="Mover para Backlog">
                            <Layers size={14}/>
                        </button>
                    )}
                    {task.status !== 'todo' && (
                        <button onClick={() => onUpdate(task.id, { status: 'todo' })} className="p-1 rounded hover:bg-blue-100 text-blue-600" title="Mover para To-Do">
                            <ArrowRight size={14}/>
                        </button>
                    )}
                    {task.status !== 'done' && (
                        <button onClick={() => onUpdate(task.id, { status: 'done' })} className="p-1 rounded hover:bg-green-100 text-green-600" title="Mover para Concluído">
                            <Check size={14}/>
                        </button>
                    )}
                </div>
            </div>
            {task.dueDate && (
                <div className="text-[10px] text-gray-500 mt-2 flex items-center gap-1 font-medium">
                    <Calendar size={10}/> {new Date(task.dueDate).toLocaleDateString()}
                </div>
            )}
        </div>
    );
};

export default ProjectView;
