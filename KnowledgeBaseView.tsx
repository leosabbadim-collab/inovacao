import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, Book, FileText, Cpu, Globe, Link as LinkIcon, ExternalLink, Sparkles, RefreshCw, BrainCircuit } from 'lucide-react';
import { KnowledgeDoc, GlobalState, DocType } from '../types';
import { analyzeExternalResource } from '../services/geminiService';

interface Props {
  docs: KnowledgeDoc[];
  onAdd: (doc: KnowledgeDoc) => void;
  onUpdate: (id: string, updates: Partial<KnowledgeDoc>) => void;
  onDelete: (id: string) => void;
  fullState: GlobalState;
}

const KnowledgeBaseView: React.FC<Props> = ({ docs, onAdd, onUpdate, onDelete, fullState }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DocType>('Interno');
  const [formData, setFormData] = useState<Partial<KnowledgeDoc>>({});
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const startEdit = (doc?: KnowledgeDoc) => {
    if (doc) {
      setEditingId(doc.id);
      setFormData(doc);
    } else {
      setEditingId('new');
      setFormData({
        title: '',
        type: activeTab,
        category: activeTab === 'Interno' ? 'Arquitetura' : 'Artigo',
        content: ''
      });
    }
  };

  const handleSave = () => {
    if (editingId === 'new') {
      const newDoc: KnowledgeDoc = {
        id: Date.now().toString(),
        title: formData.title || 'Novo Documento',
        type: formData.type as DocType || 'Interno',
        category: formData.category as any || 'Geral',
        content: formData.content || '',
        updatedAt: Date.now()
      };
      onAdd(newDoc);
    } else if (editingId) {
      onUpdate(editingId, formData);
    }
    setEditingId(null);
  };

  const handleAnalysis = async (doc: KnowledgeDoc) => {
      setAnalyzingId(doc.id);
      const result = await analyzeExternalResource(doc, fullState);
      onUpdate(doc.id, { analysis: result });
      setAnalyzingId(null);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Arquitetura': return <Cpu size={16} className="text-[#005290]"/>;
      case 'Agentes': return <Cpu size={16} className="text-[#00386C]"/>;
      case 'Lógica': return <FileText size={16} className="text-[#B0C934]"/>;
      case 'Artigo': return <FileText size={16} className="text-[#00AEEE]"/>;
      case 'Benchmark': return <Globe size={16} className="text-purple-500"/>;
      default: return <Book size={16} className="text-gray-400"/>;
    }
  };

  const filteredDocs = docs.filter(d => d.type === activeTab);

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#00386C]">Base de Conhecimento</h2>
          <p className="text-[#656464]">DOCs Internos (Arquitetura) e Referências Externas (Melhoria Contínua).</p>
        </div>
        <button
          onClick={() => startEdit()}
          className="flex items-center gap-2 px-4 py-2 bg-[#005290] hover:bg-[#00386C] text-white rounded-lg transition-colors shadow-md"
        >
          <Plus size={18} />
          Adicionar {activeTab === 'Interno' ? 'DOC' : 'Referência'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-8">
          <button 
            onClick={() => setActiveTab('Interno')}
            className={`pb-3 px-2 font-bold text-sm transition-colors border-b-4 ${activeTab === 'Interno' ? 'text-[#005290] border-[#00AEEE]' : 'text-gray-400 border-transparent hover:text-[#005290]'}`}
          >
              DOCs IA (Interno)
          </button>
          <button 
            onClick={() => setActiveTab('Externo')}
            className={`pb-3 px-2 font-bold text-sm transition-colors border-b-4 ${activeTab === 'Externo' ? 'text-[#005290] border-[#00AEEE]' : 'text-gray-400 border-transparent hover:text-[#005290]'}`}
          >
              Referências & Melhoria Contínua
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocs.map(doc => (
          <div key={doc.id} className="bg-white border border-gray-200 rounded-xl flex flex-col shadow-md hover:shadow-xl transition-all min-h-[250px] group">
            <div className="p-4 border-b border-gray-100 flex justify-between items-start bg-gray-50/50 rounded-t-xl">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                    {getCategoryIcon(doc.category)}
                 </div>
                 <div>
                    <h3 className="font-bold text-[#00386C] line-clamp-1" title={doc.title}>{doc.title}</h3>
                    <span className="text-xs text-gray-400">{new Date(doc.updatedAt).toLocaleDateString()}</span>
                 </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => startEdit(doc)} className="p-1.5 hover:bg-gray-200 rounded text-gray-500"><Edit2 size={14}/></button>
                 <button onClick={() => onDelete(doc.id)} className="p-1.5 hover:bg-red-50 text-red-400 rounded"><Trash2 size={14}/></button>
              </div>
            </div>
            
            <div className="p-5 flex-1 overflow-hidden relative flex flex-col">
                <p className="text-[#656464] text-sm whitespace-pre-wrap line-clamp-6 mb-4 font-medium leading-relaxed">{doc.content}</p>
                
                {doc.type === 'Externo' && (
                    <div className="mt-auto">
                        {doc.analysis ? (
                             <div className="bg-[#00AEEE]/10 border border-[#00AEEE]/30 p-3 rounded-lg text-xs text-[#005290]">
                                 <strong className="block mb-1 flex items-center gap-1"><Sparkles size={10} className="text-[#00AEEE]"/> Análise IA:</strong>
                                 <p className="line-clamp-3">{doc.analysis}</p>
                             </div>
                        ) : (
                            <button 
                                onClick={() => handleAnalysis(doc)}
                                disabled={analyzingId === doc.id}
                                className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-xs text-[#005290] rounded-lg flex items-center justify-center gap-2 font-bold transition-colors"
                            >
                                {analyzingId === doc.id ? <RefreshCw className="animate-spin" size={12}/> : <BrainCircuit size={12}/>}
                                Analisar Relevância
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="px-5 py-3 bg-gray-50/80 rounded-b-xl border-t border-gray-100 flex justify-between items-center text-xs">
                <span className="text-[#005290] uppercase tracking-wider font-bold">{doc.category}</span>
                {doc.content.startsWith('http') && <ExternalLink size={12} className="text-gray-400"/>}
            </div>
          </div>
        ))}
        
        {filteredDocs.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-16 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 bg-white/50">
                <Book size={48} className="mb-4 opacity-30"/>
                <p className="font-medium text-lg text-gray-500">Nenhum documento encontrado.</p>
                <p className="text-sm">Adicione itens para criar a base de conhecimento.</p>
            </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-[#00386C]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col h-[80vh]">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-[#00386C]">{editingId === 'new' ? 'Novo Documento' : 'Editar Documento'}</h3>
              <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-[#00386C]"><X /></button>
            </div>
            
            <div className="p-8 flex-1 overflow-y-auto space-y-6 flex flex-col">
                <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2">
                        <label className="block text-sm font-bold text-[#656464] mb-2">Título</label>
                        <input 
                            className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-[#333] focus:border-[#00AEEE] outline-none"
                            value={formData.title}
                            onChange={e => setFormData({...formData, title: e.target.value})}
                            placeholder={activeTab === 'Interno' ? "Ex: Workflow Agente Auth" : "Ex: Artigo sobre LLM Agents"}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-[#656464] mb-2">Categoria</label>
                        <select 
                            className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-[#333] focus:border-[#00AEEE] outline-none"
                            value={formData.category}
                            onChange={e => setFormData({...formData, category: e.target.value as any})}
                        >
                            {activeTab === 'Interno' ? (
                                <>
                                    <option value="Arquitetura">Arquitetura</option>
                                    <option value="Agentes">Agentes</option>
                                    <option value="Lógica">Lógica</option>
                                    <option value="Geral">Geral</option>
                                </>
                            ) : (
                                <>
                                    <option value="Artigo">Artigo</option>
                                    <option value="Notícia">Notícia</option>
                                    <option value="Benchmark">Benchmark</option>
                                    <option value="Geral">Geral</option>
                                </>
                            )}
                        </select>
                    </div>
                </div>

                <div className="flex-1 flex flex-col">
                    <label className="block text-sm font-bold text-[#656464] mb-2">Conteúdo (Markdown ou URL)</label>
                    <textarea 
                        className="w-full flex-1 bg-gray-50 border border-gray-300 rounded-lg p-4 text-[#333] font-mono text-sm leading-relaxed resize-none focus:border-[#00AEEE] outline-none"
                        value={formData.content}
                        onChange={e => setFormData({...formData, content: e.target.value})}
                        placeholder={activeTab === 'Interno' ? "Descreva a lógica, prompts ou arquitetura..." : "Cole a URL ou o resumo do texto aqui..."}
                    />
                </div>
                
                {activeTab === 'Externo' && (
                    <div className="bg-blue-50 p-4 rounded-lg text-xs text-[#005290] border border-blue-100 flex gap-2">
                        <Sparkles size={14}/>
                        <p>Dica: Cole o texto completo ou um resumo detalhado para que a IA possa analisar corretamente quem deve estudar este material.</p>
                    </div>
                )}
            </div>

            <div className="p-5 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setEditingId(null)} className="px-5 py-2 hover:bg-gray-100 rounded-lg text-[#656464] font-medium">Cancelar</button>
              <button onClick={handleSave} className="px-5 py-2 bg-[#005290] hover:bg-[#00386C] rounded-lg text-white flex items-center gap-2 font-bold shadow-md transition-colors">
                <Save size={18}/> Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBaseView;