
import React, { useEffect, useState } from 'react';
import { RefreshCw, Check, AlertTriangle, BrainCircuit, ArrowRight, ExternalLink, ShieldCheck, AlertOctagon } from 'lucide-react';
import { GlobalState, TeamMember, TrelloCard, TrelloList } from '../types';
import { fetchTrelloCards, fetchTrelloLists, fetchTrelloMembers, organizeCardsByMember } from '../services/trelloService';
import { generateAlignmentAnalysis } from '../services/geminiService';

interface Props {
  fullState: GlobalState;
  onClose: () => void;
  onSyncDemands: (map: Record<string, string[]>, stats: Record<string, {aligned: number, misaligned: number}>) => void;
}

const TrelloAudit: React.FC<Props> = ({ fullState, onClose, onSyncDemands }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [lists, setLists] = useState<TrelloList[]>([]);
  const [memberCards, setMemberCards] = useState<Record<string, TrelloCard[]>>({});
  const [unassignedCards, setUnassignedCards] = useState<TrelloCard[]>([]);
  const [trelloMembers, setTrelloMembers] = useState<any[]>([]);

  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const [analyses, setAnalyses] = useState<Record<string, string>>({});
  const [cardScores, setCardScores] = useState<Record<string, {score: number, reason: string}>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!fullState.trelloConfig?.apiKey) {
        setError("Trello não configurado.");
        setLoading(false);
        return;
    }

    try {
        setLoading(true);
        const [fetchedCards, fetchedLists, fetchedMembers] = await Promise.all([
            fetchTrelloCards(fullState.trelloConfig),
            fetchTrelloLists(fullState.trelloConfig),
            fetchTrelloMembers(fullState.trelloConfig)
        ]);

        setLists(fetchedLists);
        setTrelloMembers(fetchedMembers);

        const { memberCards: mapped, unassignedCards: unmapped } = organizeCardsByMember(
            fetchedCards, 
            fetchedLists, 
            fetchedMembers, 
            fullState.team
        );

        setMemberCards(mapped);
        setUnassignedCards(unmapped);
    } catch (err: any) {
        setError(err.message || "Falha ao carregar dados do Trello");
    } finally {
        setLoading(false);
    }
  };

  const runAIAnalysis = async (memberId: string) => {
    setAnalyzingIds(prev => new Set(prev).add(memberId));
    const member = fullState.team.find(m => m.id === memberId);
    const cards = memberCards[memberId];
    
    if (member && cards) {
        const { text, scoredCards } = await generateAlignmentAnalysis(member, cards, fullState.projects, fullState.aiConfig);
        setAnalyses(prev => ({ ...prev, [memberId]: text }));
        
        const newScores = { ...cardScores };
        scoredCards.forEach(sc => {
            newScores[sc.id] = { score: sc.score, reason: sc.reason };
        });
        setCardScores(newScores);
    }
    setAnalyzingIds(prev => {
        const next = new Set(prev);
        next.delete(memberId);
        return next;
    });
  };

  const handleSyncAll = () => {
      const demandsMap: Record<string, string[]> = {};
      const statsMap: Record<string, {aligned: number, misaligned: number}> = {};

      Object.keys(memberCards).forEach(id => {
          demandsMap[id] = memberCards[id].map(c => c.name);
          
          let aligned = 0;
          let misaligned = 0;
          memberCards[id].forEach(c => {
              const s = cardScores[c.id]?.score;
              if (s !== undefined) {
                  if (s >= 80) aligned++;
                  if (s < 50) misaligned++;
              }
          });
          statsMap[id] = { aligned, misaligned };
      });

      onSyncDemands(demandsMap, statsMap);
      onClose();
  };

  const getListNameColor = (name: string = '') => {
      const n = name.toLowerCase();
      if (n.includes('done') || n.includes('concluído')) return 'text-green-600 bg-green-50';
      if (n.includes('doing') || n.includes('andamento')) return 'text-blue-600 bg-blue-50';
      return 'text-gray-500 bg-gray-100';
  };

  const getScoreBadge = (cardId: string) => {
      const data = cardScores[cardId];
      if (!data) return null;
      
      if (data.score >= 80) {
          return <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-200 flex items-center gap-1 font-bold" title={data.reason}><ShieldCheck size={12}/> {data.score}% Alinhado</span>;
      }
      if (data.score < 50) {
          return <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-200 flex items-center gap-1 font-bold" title={data.reason}><AlertOctagon size={12}/> {data.score}% Suspeito</span>;
      }
      return <span className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded border border-gray-200 font-medium" title={data.reason}>{data.score}%</span>;
  };

  if (loading) {
      return (
          <div className="fixed inset-0 bg-white z-50 flex items-center justify-center flex-col gap-4">
              <RefreshCw className="animate-spin text-[#005290]" size={48} />
              <p className="text-[#656464] font-medium">Conectando ao Trello & Organizando Cards...</p>
          </div>
      );
  }

  return (
    <div className="fixed inset-0 bg-[#00386C]/80 backdrop-blur-md z-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-gray-200 bg-white flex justify-between items-center shadow-lg">
        <div>
            <h2 className="text-2xl font-bold text-[#00386C] flex items-center gap-3">
                <BrainCircuit className="text-[#00AEEE]" size={28}/>
                Auditoria de Alinhamento (Trello)
            </h2>
            <p className="text-[#656464] mt-1 font-medium">Revise tarefas ativas e verifique o alinhamento estratégico com IA.</p>
        </div>
        <div className="flex gap-4">
             <button onClick={onClose} className="px-5 py-2 hover:bg-gray-100 rounded-lg text-[#656464] font-bold">Fechar</button>
             <button 
                onClick={handleSyncAll}
                className="px-6 py-2 bg-[#005290] hover:bg-[#00386C] text-white rounded-lg flex items-center gap-2 font-bold shadow-md transition-colors"
            >
                <Check size={20}/> Sincronizar Tudo
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-100">
        
        {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3 shadow-sm">
                <AlertTriangle /> {error}
            </div>
        )}

        {/* Unassigned Warning */}
        {unassignedCards.length > 0 && (
             <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 shadow-sm">
                 <h3 className="text-yellow-800 font-bold mb-3 flex items-center gap-2">
                     <AlertTriangle size={20}/> {unassignedCards.length} Cards Não Atribuídos / Não Correspondidos
                 </h3>
                 <p className="text-sm text-yellow-700 mb-4">Estes cards têm membros no Trello que não correspondem aos nomes no NexusManager.</p>
                 <div className="flex gap-3 overflow-x-auto pb-2">
                     {unassignedCards.slice(0, 10).map(c => (
                         <div key={c.id} className="min-w-[220px] bg-white p-3 rounded-lg text-xs border border-yellow-200 shadow-sm">
                             <div className="text-[#333] truncate font-bold mb-1">{c.name}</div>
                             <div className="text-gray-500">{c.listName}</div>
                         </div>
                     ))}
                     {unassignedCards.length > 10 && <div className="min-w-[50px] flex items-center justify-center text-gray-500 text-xs font-medium">+{unassignedCards.length - 10} mais</div>}
                 </div>
             </div>
        )}

        {/* Team Rows */}
        <div className="grid grid-cols-1 gap-8">
            {fullState.team.map(member => {
                const cards = memberCards[member.id] || [];
                const analysis = analyses[member.id];
                const isAnalyzing = analyzingIds.has(member.id);

                return (
                    <div key={member.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col lg:flex-row shadow-md">
                        
                        {/* Member Info */}
                        <div className="p-6 lg:w-1/4 bg-gray-50 border-b lg:border-b-0 lg:border-r border-gray-200">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-[#00386C] flex items-center justify-center font-bold text-xl text-white border-2 border-white shadow-sm">
                                    {member.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-[#00386C]">{member.name}</h3>
                                    <p className="text-xs text-[#005290] font-medium uppercase">{member.role}</p>
                                </div>
                            </div>
                            <div className="text-xs text-[#656464] space-y-2">
                                <p><span className="font-bold text-[#333]">Senioridade:</span> {member.seniority}</p>
                                <p className="bg-white p-2 rounded border border-gray-200 italic">"{member.jobDescription.substring(0,60)}..."</p>
                            </div>
                            
                            <button 
                                onClick={() => runAIAnalysis(member.id)}
                                disabled={isAnalyzing || cards.length === 0}
                                className="mt-6 w-full py-2.5 bg-[#00AEEE] hover:bg-[#005290] text-white rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:bg-gray-300 shadow-md font-bold text-sm"
                            >
                                {isAnalyzing ? <RefreshCw className="animate-spin" size={16}/> : <BrainCircuit size={16}/>}
                                {analysis ? 'Re-Analisar' : 'Auditar com IA'}
                            </button>
                        </div>

                        {/* Cards List - Expanded View */}
                        <div className="p-6 lg:w-1/3 border-b lg:border-b-0 lg:border-r border-gray-200 bg-white">
                            <h4 className="text-xs uppercase text-[#656464] font-bold mb-4 flex justify-between border-b border-gray-100 pb-2">
                                Tarefas Ativas
                                <span className="bg-[#00386C] text-white px-2 py-0.5 rounded-full text-[10px]">{cards.length}</span>
                            </h4>
                            
                            {cards.length === 0 ? (
                                <div className="h-32 flex items-center justify-center text-gray-400 text-sm italic bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                    Nenhum card atribuído
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {cards.map(card => (
                                        <div key={card.id} className="bg-white p-3 rounded-lg border border-gray-200 text-sm group hover:border-[#00AEEE] transition-colors shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="text-[#333] font-semibold leading-tight">{card.name}</p>
                                                <a href={card.url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#00AEEE] ml-2"><ExternalLink size={14}/></a>
                                            </div>
                                            
                                            {card.desc && <p className="text-gray-500 text-xs line-clamp-2 mb-3 border-l-2 border-gray-200 pl-2">{card.desc}</p>}
                                            
                                            <div className="flex items-center justify-between mt-2">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${getListNameColor(card.listName)}`}>
                                                    {card.listName}
                                                </span>
                                                {getScoreBadge(card.id)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* AI Analysis Result */}
                        <div className="p-6 lg:flex-1 bg-gray-50 relative">
                             <h4 className="text-xs uppercase text-[#656464] font-bold mb-4 border-b border-gray-200 pb-2">Relatório Estratégico</h4>
                             
                             {!analysis && !isAnalyzing && (
                                 <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm min-h-[150px]">
                                     <BrainCircuit size={40} className="mb-3 opacity-20 text-[#00386C]"/>
                                     <p>Clique em "Auditar com IA" para classificar as tarefas.</p>
                                 </div>
                             )}

                             {isAnalyzing && (
                                  <div className="h-full flex flex-col items-center justify-center min-h-[150px]">
                                     <div className="flex flex-col items-center gap-3 text-[#005290]">
                                         <RefreshCw className="animate-spin" size={32}/> 
                                         <span className="font-medium">Analisando alinhamento estratégico...</span>
                                     </div>
                                  </div>
                             )}

                             {analysis && !isAnalyzing && (
                                 <div className="prose prose-sm max-w-none h-full overflow-y-auto custom-scrollbar bg-white p-4 rounded-lg border border-gray-200 shadow-inner text-[#333]">
                                     <div dangerouslySetInnerHTML={{__html: analysis}} />
                                 </div>
                             )}
                        </div>

                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default TrelloAudit;
