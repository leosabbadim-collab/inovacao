
import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, TrendingUp, AlertCircle, BrainCircuit, Sparkles, RefreshCw, Trello, GraduationCap, AlertTriangle, ShieldCheck, User, BookOpen, ExternalLink } from 'lucide-react';
import { TeamMember, GlobalState, SeniorityLevel, PDIItem } from '../types';
import { generateQuickAnalysis, generatePDI } from '../services/geminiService';
import TrelloAudit from './TrelloAudit';

interface Props {
  team: TeamMember[];
  onAdd: (member: TeamMember) => void;
  onUpdate: (id: string, updates: Partial<TeamMember>) => void;
  onDelete: (id: string) => void;
  fullState: GlobalState;
  onSyncDemands: (map: Record<string, string[]>, stats: Record<string, any>) => void;
}

const TeamView: React.FC<Props> = ({ team, onAdd, onUpdate, onDelete, fullState, onSyncDemands }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [showAudit, setShowAudit] = useState(false);

  const [formData, setFormData] = useState<Partial<TeamMember>>({});

  const startEdit = (member?: TeamMember) => {
    if (member) {
      setEditingId(member.id);
      setFormData(member);
    } else {
      setEditingId('new');
      setFormData({
        name: '',
        role: '',
        seniority: 'Analista',
        jobDescription: '',
        responsibilities: [],
        demands: [],
        strengths: [],
        weaknesses: [],
        notes: '',
        pdi: [],
        studyPlan: []
      });
    }
  };

  const handleSave = () => {
    if (editingId === 'new') {
      const newMember: TeamMember = {
        id: Date.now().toString(),
        name: formData.name || 'Novo Membro',
        role: formData.role || 'Cargo',
        seniority: formData.seniority || 'Analista',
        jobDescription: formData.jobDescription || '',
        responsibilities: formData.responsibilities || [],
        demands: formData.demands || [],
        strengths: formData.strengths || [],
        weaknesses: formData.weaknesses || [],
        notes: formData.notes || '',
        pdi: [],
        studyPlan: []
      };
      onAdd(newMember);
    } else if (editingId) {
      onUpdate(editingId, formData);
    }
    setEditingId(null);
  };

  const handleArrayInput = (key: keyof TeamMember, value: string) => {
    const list = value.split(',').map(item => item.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, [key]: list }));
  };

  const generateTeamGrowthPlan = async () => {
    setIsAnalysing(true);
    setAiInsight(null);
    const prompt = `Baseado nos dados atuais, identifique as maiores lacunas de habilidade relativas aos projetos e sugira um plano de crescimento rápido para o time aumentar a eficiência.`;
    const result = await generateQuickAnalysis(fullState, prompt);
    setAiInsight(result);
    setIsAnalysing(false);
  };

  const selectedProfile = team.find(m => m.id === profileId);

  const handlePDIUpdate = (pdiId: string, updates: Partial<PDIItem>) => {
      if (!selectedProfile) return;
      const newPDI = selectedProfile.pdi.map(item => item.id === pdiId ? { ...item, ...updates } : item);
      onUpdate(selectedProfile.id, { pdi: newPDI });
  };

  const handlePDIAdd = (text: string, category: any) => {
      if (!selectedProfile || !text.trim()) return;
      const newItem: PDIItem = { id: Date.now().toString(), text, category, isCompleted: false };
      onUpdate(selectedProfile.id, { pdi: [...selectedProfile.pdi, newItem] });
  };

  const handlePDIDelete = (pdiId: string) => {
      if (!selectedProfile) return;
      onUpdate(selectedProfile.id, { pdi: selectedProfile.pdi.filter(i => i.id !== pdiId) });
  };

  const generateAI_PDI = async () => {
      if (!selectedProfile) return;
      setIsAnalysing(true);
      const items = await generatePDI(selectedProfile, fullState);
      onUpdate(selectedProfile.id, { pdi: [...selectedProfile.pdi, ...items] });
      setIsAnalysing(false);
  };

  const handleTraitAdd = (type: 'strengths' | 'weaknesses', text: string) => {
      if (!selectedProfile || !text.trim()) return;
      onUpdate(selectedProfile.id, { [type]: [...selectedProfile[type], text] });
  };

  const handleTraitDelete = (type: 'strengths' | 'weaknesses', text: string) => {
      if (!selectedProfile) return;
      onUpdate(selectedProfile.id, { [type]: selectedProfile[type].filter(t => t !== text) });
  };

  const handleStudyToggle = (docId: string) => {
      if (!selectedProfile) return;
      const current = selectedProfile.studyPlan || [];
      if (current.includes(docId)) {
          onUpdate(selectedProfile.id, { studyPlan: current.filter(id => id !== docId) });
      } else {
          onUpdate(selectedProfile.id, { studyPlan: [...current, docId] });
      }
  };

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#00386C]">Gestão do Time</h2>
          <p className="text-[#656464]">Gerencie responsabilidades, senioridade e evolução (PDI).</p>
        </div>
        <div className="flex gap-2">
             <button 
                onClick={() => setShowAudit(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#005290] hover:bg-[#00386C] text-white rounded-lg transition-colors shadow-md"
                title="Auditar Tarefas Trello & Alinhamento"
            >
                <Trello size={18} />
                Sync Trello
            </button>
            <button 
                onClick={generateTeamGrowthPlan}
                className="flex items-center gap-2 px-4 py-2 bg-[#00AEEE] hover:bg-blue-400 text-white rounded-lg transition-colors shadow-md"
                disabled={isAnalysing}
            >
                <BrainCircuit size={18} />
                {isAnalysing ? 'Analisando...' : 'Análise IA'}
            </button>
            <button
            onClick={() => startEdit()}
            className="flex items-center gap-2 px-4 py-2 bg-[#B0C934] hover:bg-[#9db32e] text-white rounded-lg transition-colors shadow-md"
            >
            <Plus size={18} />
            Novo Membro
            </button>
        </div>
      </div>

      {showAudit && (
          <TrelloAudit 
            fullState={fullState} 
            onClose={() => setShowAudit(false)} 
            onSyncDemands={onSyncDemands}
          />
      )}

      {aiInsight && (
          <div className="mb-6 bg-white border border-[#00AEEE] p-6 rounded-xl relative shadow-lg animate-in fade-in slide-in-from-top-4">
              <button onClick={() => setAiInsight(null)} className="absolute top-2 right-2 text-[#656464] hover:text-[#00386C]"><X size={16}/></button>
              <h3 className="font-bold text-[#00386C] flex items-center gap-2 mb-2"><Sparkles size={16} className="text-[#00AEEE]"/> Insight de Crescimento (IA)</h3>
              <p className="text-[#656464] text-sm whitespace-pre-wrap leading-relaxed">{aiInsight}</p>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {team.map(member => (
          <div 
             key={member.id} 
             onClick={() => setProfileId(member.id)}
             className="bg-white border border-gray-200 rounded-xl p-5 shadow-md hover:shadow-xl relative group flex flex-col cursor-pointer transition-all hover:-translate-y-1"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-[#00386C] rounded-full flex items-center justify-center font-bold text-2xl text-white border-4 border-gray-50">
                {member.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-lg text-[#00386C] group-hover:text-[#00AEEE] transition-colors">{member.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                    <p className="text-[#656464] text-xs font-semibold uppercase">{member.role}</p>
                    <span className="text-[10px] px-2 py-0.5 bg-[#B0C934]/20 text-[#9db32e] font-bold rounded-full border border-[#B0C934]/30">{member.seniority}</span>
                </div>
              </div>
            </div>

            {/* Alignment Counters */}
            <div className="flex gap-2 mb-4">
                <div className="flex-1 bg-green-50 border border-green-100 p-2 rounded flex items-center justify-between">
                    <div className="flex items-center gap-1 text-green-600 text-xs font-bold">
                        <ShieldCheck size={14}/> Alinhadas
                    </div>
                    <span className="text-lg font-bold text-green-700">{member.alignedTaskCount || 0}</span>
                </div>
                 <div className="flex-1 bg-red-50 border border-red-100 p-2 rounded flex items-center justify-between">
                    <div className="flex items-center gap-1 text-red-600 text-xs font-bold">
                        <AlertTriangle size={14}/> Suspeitas
                    </div>
                    <span className="text-lg font-bold text-red-700">{member.misalignedTaskCount || 0}</span>
                </div>
            </div>

            <div className="space-y-4 text-sm flex-1">
               <div>
                <p className="text-[#005290] text-xs uppercase tracking-wider mb-2 font-bold flex justify-between border-b border-gray-100 pb-1">
                    Demandas Atuais ({member.demands.length})
                </p>
                <ul className="list-disc list-inside text-[#656464] marker:text-[#00AEEE]">
                  {member.demands.length > 0 
                    ? member.demands.slice(0, 3).map((d, i) => <li key={i} className="truncate">{d}</li>)
                    : <li className="text-gray-400 italic">Sem demandas ativas</li>
                  }
                  {member.demands.length > 3 && <li className="text-xs text-gray-400">+{member.demands.length - 3} mais...</li>}
                </ul>
              </div>
              
              <div className="flex justify-between items-center text-xs text-[#656464] bg-gray-50 p-2 rounded mt-auto">
                  <span className="flex items-center gap-1 font-medium"><GraduationCap size={12} className="text-[#00386C]"/> PDI: {member.pdi?.filter(i => !i.isCompleted).length} a fazer</span>
                  <span className="flex items-center gap-1 font-medium"><BookOpen size={12} className="text-[#00386C]"/> Estudo: {member.studyPlan?.length || 0} docs</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* DETAILED PROFILE MODAL */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-[#00386C]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl flex flex-col h-[90vh] overflow-hidden">
                
                {/* Header */}
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-[#00386C] rounded-full flex items-center justify-center font-bold text-3xl text-white shadow-md">
                            {selectedProfile.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-[#00386C]">{selectedProfile.name}</h2>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[#005290] font-medium">{selectedProfile.role}</span>
                                <span className="px-2 py-0.5 bg-[#B0C934] text-white rounded text-xs font-bold">{selectedProfile.seniority}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => startEdit(selectedProfile)} className="p-2 hover:bg-gray-200 rounded text-[#656464]" title="Editar Info Básica">
                            <Edit2 size={20}/>
                        </button>
                         <button onClick={() => { onDelete(selectedProfile.id); setProfileId(null); }} className="p-2 hover:bg-red-50 rounded text-[#656464] hover:text-red-500" title="Excluir Membro">
                            <Trash2 size={20}/>
                        </button>
                        <button onClick={() => setProfileId(null)} className="p-2 hover:bg-gray-200 rounded text-[#656464]">
                            <X size={24}/>
                        </button>
                    </div>
                </div>

                {/* Profile Content */}
                <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 bg-white">
                    
                    {/* Column 1: Demands & Traits */}
                    <div className="space-y-8">
                        {/* Trello Demands List */}
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 shadow-sm">
                            <h3 className="font-bold text-[#00386C] mb-4 flex items-center gap-2">
                                <Trello className="text-[#005290]" size={18}/> Demandas Trello
                                <span className="text-xs bg-[#00AEEE] text-white px-2 rounded-full">{selectedProfile.demands.length}</span>
                            </h3>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {selectedProfile.demands.length > 0 ? selectedProfile.demands.map((demand, i) => (
                                    <div key={i} className="p-3 bg-white rounded border border-gray-200 text-sm text-[#656464] shadow-sm">
                                        {demand}
                                    </div>
                                )) : <p className="text-gray-400 italic text-sm">Nenhuma demanda ativa.</p>}
                            </div>
                        </div>

                         {/* Strengths */}
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 shadow-sm">
                            <h3 className="font-bold text-[#00386C] mb-4 flex items-center gap-2">
                                <TrendingUp className="text-green-600" size={18}/> Pontos Fortes
                            </h3>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {selectedProfile.strengths.map((s, i) => (
                                    <span key={i} className="px-3 py-1 bg-white text-green-700 border border-green-200 rounded-full text-sm flex items-center gap-1 group shadow-sm font-medium">
                                        {s}
                                        <button onClick={() => handleTraitDelete('strengths', s)} className="opacity-0 group-hover:opacity-100 hover:text-red-500"><X size={12}/></button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input id="newStrength" className="bg-white border border-gray-300 rounded px-3 py-2 text-sm w-full focus:border-[#00AEEE] outline-none" placeholder="Adicionar..." 
                                    onKeyDown={(e) => {
                                        if(e.key === 'Enter') {
                                            handleTraitAdd('strengths', e.currentTarget.value);
                                            e.currentTarget.value = '';
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Weaknesses */}
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 shadow-sm">
                            <h3 className="font-bold text-[#00386C] mb-4 flex items-center gap-2">
                                <AlertCircle className="text-red-500" size={18}/> Pontos Fracos
                            </h3>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {selectedProfile.weaknesses.map((w, i) => (
                                    <span key={i} className="px-3 py-1 bg-white text-red-700 border border-red-200 rounded-full text-sm flex items-center gap-1 group shadow-sm font-medium">
                                        {w}
                                        <button onClick={() => handleTraitDelete('weaknesses', w)} className="opacity-0 group-hover:opacity-100 hover:text-red-500"><X size={12}/></button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input id="newWeakness" className="bg-white border border-gray-300 rounded px-3 py-2 text-sm w-full focus:border-[#00AEEE] outline-none" placeholder="Adicionar..." 
                                    onKeyDown={(e) => {
                                        if(e.key === 'Enter') {
                                            handleTraitAdd('weaknesses', e.currentTarget.value);
                                            e.currentTarget.value = '';
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Column 2: PDI */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md h-full flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-[#00386C] text-lg flex items-center gap-2">
                                    <GraduationCap className="text-[#00AEEE]" size={24}/> Plano de Desenvolvimento Individual (PDI)
                                </h3>
                                <button 
                                    onClick={generateAI_PDI}
                                    disabled={isAnalysing}
                                    className="text-sm bg-[#00AEEE] hover:bg-[#005290] text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-colors"
                                >
                                    {isAnalysing ? <RefreshCw className="animate-spin" size={16}/> : <BrainCircuit size={16}/>}
                                    Gerar com IA
                                </button>
                            </div>

                            <div className="flex-1 bg-gray-50 rounded-xl p-4 space-y-3 overflow-y-auto max-h-[450px] custom-scrollbar border border-gray-100">
                                {selectedProfile.pdi && selectedProfile.pdi.length > 0 ? (
                                    selectedProfile.pdi.map(item => (
                                        <div key={item.id} className="group flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-[#00AEEE] transition-colors shadow-sm">
                                            <input 
                                                type="checkbox" 
                                                checked={item.isCompleted}
                                                onChange={() => handlePDIUpdate(item.id, { isCompleted: !item.isCompleted })}
                                                className="mt-1 w-5 h-5 rounded border-gray-300 text-[#005290] focus:ring-[#005290] cursor-pointer"
                                            />
                                            <div className="flex-1">
                                                <p className={`text-sm font-medium ${item.isCompleted ? 'text-gray-400 line-through' : 'text-[#333]'}`}>
                                                    {item.text}
                                                </p>
                                                {item.category && (
                                                    <span className="text-[10px] uppercase tracking-wide text-[#005290] bg-blue-50 px-2 py-1 rounded mt-2 inline-block border border-blue-100 font-semibold">
                                                        {item.category}
                                                    </span>
                                                )}
                                            </div>
                                            <button onClick={() => handlePDIDelete(item.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 size={18}/>
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-gray-400">
                                        <GraduationCap size={48} className="mx-auto mb-3 opacity-20"/>
                                        <p>Nenhum item de desenvolvimento registrado.</p>
                                        <p className="text-sm">Adicione manualmente abaixo ou peça ajuda à IA.</p>
                                    </div>
                                )}
                            </div>

                            {/* Add PDI Item Manual */}
                            <div className="mt-6 flex gap-2">
                                <input 
                                    id="newPDI"
                                    className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-sm text-[#333] focus:ring-2 focus:ring-[#00AEEE] focus:border-transparent outline-none" 
                                    placeholder="Adicionar nova meta de desenvolvimento..."
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handlePDIAdd(e.currentTarget.value, 'Ação');
                                            e.currentTarget.value = '';
                                        }
                                    }}
                                />
                                <button 
                                    onClick={() => {
                                        const el = document.getElementById('newPDI') as HTMLInputElement;
                                        handlePDIAdd(el.value, 'Ação');
                                        el.value = '';
                                    }}
                                    className="px-4 py-2 bg-[#00386C] hover:bg-[#005290] text-white rounded-lg shadow-md transition-colors"
                                >
                                    <Plus size={20}/>
                                </button>
                            </div>
                        </div>

                        {/* Study Plan */}
                         <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
                            <h3 className="font-bold text-[#00386C] mb-4 flex items-center gap-2">
                                <BookOpen className="text-[#005290]" size={18}/> Plano de Estudos (Base de Conhecimento)
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <p className="text-xs text-[#656464] uppercase font-bold mb-2">Docs Vinculados</p>
                                    {selectedProfile.studyPlan && selectedProfile.studyPlan.length > 0 ? (
                                        selectedProfile.studyPlan.map(docId => {
                                            const doc = fullState.knowledgeBase.find(d => d.id === docId);
                                            return doc ? (
                                                <div key={docId} className="flex justify-between items-center p-3 bg-blue-50 border border-blue-100 rounded-lg text-[#005290]">
                                                    <span className="text-sm truncate font-medium" title={doc.title}>{doc.title}</span>
                                                    <button onClick={() => handleStudyToggle(docId)} className="text-blue-400 hover:text-red-500"><X size={14}/></button>
                                                </div>
                                            ) : null;
                                        })
                                    ) : <p className="text-sm text-gray-400 italic">Nenhum doc atribuído.</p>}
                                </div>
                                
                                <div>
                                    <p className="text-xs text-[#656464] uppercase font-bold mb-2">Adicionar Doc</p>
                                    <select 
                                        className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-sm text-[#333] focus:border-[#00AEEE] outline-none"
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                handleStudyToggle(e.target.value);
                                                e.target.value = '';
                                            }
                                        }}
                                        value=""
                                    >
                                        <option value="">Selecione para adicionar...</option>
                                        {fullState.knowledgeBase.map(doc => (
                                            <option key={doc.id} value={doc.id} disabled={selectedProfile.studyPlan?.includes(doc.id)}>
                                                {doc.type === 'Interno' ? '📄' : '🔗'} {doc.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Basic Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-[#00386C]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-[#00386C]">{editingId === 'new' ? 'Novo Membro' : 'Editar Info Básica'}</h3>
              <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-[#00386C]"><X /></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#656464] mb-1">Nome</label>
                  <input 
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-[#333] focus:border-[#00AEEE] outline-none"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#656464] mb-1">Cargo</label>
                  <input 
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-[#333] focus:border-[#00AEEE] outline-none"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                  />
                </div>
              </div>

              <div>
                  <label className="block text-sm font-medium text-[#656464] mb-1">Nível de Senioridade</label>
                  <select 
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-[#333] focus:border-[#00AEEE] outline-none"
                    value={formData.seniority}
                    onChange={e => setFormData({...formData, seniority: e.target.value as SeniorityLevel})}
                  >
                      <option value="Estagiário">Estagiário</option>
                      <option value="Assistente">Assistente</option>
                      <option value="Analista">Analista</option>
                      <option value="Especialista">Especialista</option>
                  </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#656464] mb-1">Job Description</label>
                <textarea 
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-[#333] h-24 focus:border-[#00AEEE] outline-none"
                  value={formData.jobDescription}
                  onChange={e => setFormData({...formData, jobDescription: e.target.value})}
                  placeholder="Descreva as responsabilidades principais..."
                />
              </div>

              {editingId === 'new' && (
                  <div className="bg-blue-50 p-3 rounded text-xs text-[#005290] border border-blue-100">
                      Nota: Pontos fortes, fracos, PDI e Plano de Estudos podem ser configurados no Perfil detalhado após a criação.
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

export default TeamView;
