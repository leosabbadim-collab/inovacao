
import React, { useState } from 'react';
import { Save, Trello, Lock, ExternalLink, Wifi, CheckCircle2, AlertTriangle, Cpu, Key } from 'lucide-react';
import { TrelloConfig, AIConfig, AIProvider } from '../types';
import { verifyConnection } from '../services/trelloService';

interface Props {
  config?: TrelloConfig;
  onSave: (config: TrelloConfig) => void;
  onSaveAI?: (config: AIConfig) => void; // New prop
  aiConfig?: AIConfig; // New prop
}

const SettingsView: React.FC<Props & { onSaveAI: (c: AIConfig) => void, aiConfig: AIConfig }> = ({ config, onSave, onSaveAI, aiConfig }) => {
  const [activeTab, setActiveTab] = useState<'trello' | 'ai'>('trello');
  
  // Trello State
  const [trelloForm, setTrelloForm] = useState<TrelloConfig>(config || { apiKey: '', token: '', boardId: '' });
  const [trelloStatus, setTrelloStatus] = useState<'idle' | 'saved'>('idle');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');

  // AI State
  const [aiForm, setAiForm] = useState<AIConfig>(aiConfig || { provider: 'gemini', geminiModel: 'gemini-2.5-flash', gptModel: 'gpt-4o', temperature: 0.7, openAIKey: '' });
  const [aiStatus, setAiStatus] = useState<'idle' | 'saved'>('idle');

  // Handlers
  const handleSaveTrello = () => {
    onSave(trelloForm);
    setTrelloStatus('saved');
    setTimeout(() => setTrelloStatus('idle'), 2000);
  };

  const handleSaveAI = () => {
    onSaveAI(aiForm);
    setAiStatus('saved');
    setTimeout(() => setAiStatus('idle'), 2000);
  };

  const handleTestTrello = async () => {
    setTestStatus('testing');
    setTestMessage('');
    try {
      await verifyConnection(trelloForm);
      setTestStatus('success');
      setTestMessage('Conectado com sucesso ao Board Trello!');
    } catch (e: any) {
      setTestStatus('error');
      setTestMessage(e.message || "Falha na conexão");
    }
  };

  return (
    <div className="p-6 h-full overflow-y-auto max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[#00386C] flex items-center gap-3">
          {activeTab === 'trello' ? <Trello className="text-[#005290]" /> : <Cpu className="text-[#00AEEE]" />}
          Configurações do Sistema
        </h2>
        <p className="text-[#656464] mt-2">Gerencie integrações externas e o cérebro da Inteligência Artificial.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-6 border-b border-gray-200 mb-8">
          <button 
            onClick={() => setActiveTab('trello')}
            className={`pb-3 px-4 font-bold text-sm transition-colors border-b-4 flex items-center gap-2 ${activeTab === 'trello' ? 'text-[#005290] border-[#005290]' : 'text-gray-400 border-transparent hover:text-[#005290]'}`}
          >
              <Trello size={16}/> Integração Trello
          </button>
          <button 
            onClick={() => setActiveTab('ai')}
            className={`pb-3 px-4 font-bold text-sm transition-colors border-b-4 flex items-center gap-2 ${activeTab === 'ai' ? 'text-[#005290] border-[#00AEEE]' : 'text-gray-400 border-transparent hover:text-[#005290]'}`}
          >
              <Cpu size={16}/> Inteligência Artificial
          </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-md">
        
        {/* TRELLO TAB */}
        {activeTab === 'trello' && (
            <div className="space-y-8">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 text-sm text-[#005290]">
                    <p className="font-bold mb-2 text-lg">Como obter suas credenciais:</p>
                    <ol className="list-decimal list-inside space-y-2 text-[#333]">
                        <li>Faça login no Trello.</li>
                        <li>Vá para <a href="https://trello.com/power-ups/admin" target="_blank" className="text-[#00AEEE] hover:underline inline-flex items-center gap-1 font-semibold">Trello Power-Up Admin <ExternalLink size={12}/></a></li>
                        <li>Crie uma integração genérica para pegar sua <strong>API Key</strong>.</li>
                        <li>Na mesma página, clique em "Token" para gerar um <strong>Token</strong>.</li>
                        <li>Para achar o <strong>Board ID</strong>, abra seu board no navegador e adicione <code>.json</code> na URL. O ID é o primeiro campo "id".</li>
                    </ol>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm text-[#333] mb-2 font-bold">Trello API Key</label>
                        <div className="relative">
                            <Key className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input 
                                type="text"
                                className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-10 p-3 text-[#333] focus:border-[#00AEEE] focus:ring-1 focus:ring-[#00AEEE] outline-none transition-all font-mono text-sm"
                                value={trelloForm.apiKey}
                                onChange={e => setTrelloForm({...trelloForm, apiKey: e.target.value})}
                                placeholder="Ex: 384819..."
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-[#333] mb-2 font-bold">Trello Token</label>
                        <div className="relative">
                            <Key className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input 
                                type="password"
                                className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-10 p-3 text-[#333] focus:border-[#00AEEE] focus:ring-1 focus:ring-[#00AEEE] outline-none transition-all font-mono text-sm"
                                value={trelloForm.token}
                                onChange={e => setTrelloForm({...trelloForm, token: e.target.value})}
                                placeholder="Ex: ATTA..."
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-[#333] mb-2 font-bold">Board ID</label>
                        <input 
                            type="text"
                            className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-[#333] focus:border-[#00AEEE] focus:ring-1 focus:ring-[#00AEEE] outline-none transition-all font-mono text-sm"
                            value={trelloForm.boardId}
                            onChange={e => setTrelloForm({...trelloForm, boardId: e.target.value})}
                            placeholder="Ex: 5d2..."
                        />
                    </div>
                </div>

                {testStatus !== 'idle' && (
                    <div className={`p-4 rounded-lg border flex items-start gap-3 ${
                        testStatus === 'success' 
                        ? 'bg-green-50 border-green-200 text-green-700' 
                        : testStatus === 'error'
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}>
                        {testStatus === 'testing' && <Wifi className="animate-pulse mt-0.5" size={20} />}
                        {testStatus === 'success' && <CheckCircle2 className="mt-0.5" size={20} />}
                        {testStatus === 'error' && <AlertTriangle className="mt-0.5" size={20} />}
                        <span className="text-sm font-medium">{testStatus === 'testing' ? 'Testando conexão com API...' : testMessage}</span>
                    </div>
                )}

                <div className="pt-6 flex justify-end gap-4 border-t border-gray-100">
                    <button 
                        onClick={handleTestTrello}
                        className="flex items-center gap-2 px-5 py-3 rounded-lg font-bold transition-all bg-white border border-gray-300 text-[#656464] hover:bg-gray-50 hover:border-gray-400"
                        disabled={testStatus === 'testing'}
                    >
                        {testStatus === 'testing' ? <Wifi className="animate-spin" size={18} /> : <Wifi size={18} />}
                        Testar Conexão
                    </button>
                    <button 
                        onClick={handleSaveTrello}
                        className={`flex items-center gap-2 px-8 py-3 rounded-lg font-bold transition-all shadow-md ${trelloStatus === 'saved' ? 'bg-green-600 text-white' : 'bg-[#005290] hover:bg-[#00386C] text-white'}`}
                    >
                        <Save size={18} />
                        {trelloStatus === 'saved' ? 'Salvo!' : 'Salvar Integração'}
                    </button>
                </div>
            </div>
        )}

        {/* AI TAB */}
        {activeTab === 'ai' && (
            <div className="space-y-8">
                <div>
                    <label className="block text-sm text-[#333] mb-3 font-bold">Provedor de Inteligência Artificial</label>
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => setAiForm(prev => ({ ...prev, provider: 'gemini' }))}
                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${aiForm.provider === 'gemini' ? 'border-[#00AEEE] bg-blue-50 text-[#005290]' : 'border-gray-200 hover:border-gray-300 text-gray-500'}`}
                        >
                            <Cpu size={32} />
                            <span className="font-bold">Google Gemini</span>
                        </button>
                        <button 
                            onClick={() => setAiForm(prev => ({ ...prev, provider: 'gpt' }))}
                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${aiForm.provider === 'gpt' ? 'border-[#00AEEE] bg-blue-50 text-[#005290]' : 'border-gray-200 hover:border-gray-300 text-gray-500'}`}
                        >
                            <Cpu size={32} />
                            <span className="font-bold">OpenAI GPT</span>
                        </button>
                    </div>
                </div>

                {aiForm.provider === 'gemini' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                        <div className="bg-[#E6F4FA] p-4 rounded-lg border border-[#00AEEE]/20 text-sm text-[#005290]">
                            <p><strong>Nota:</strong> O NexusManager usa a Chave de API do Gemini definida nas variáveis de ambiente do servidor para máxima segurança. Você pode customizar o modelo abaixo.</p>
                        </div>
                        <div>
                            <label className="block text-sm text-[#333] mb-2 font-bold">Modelo Gemini</label>
                            <select 
                                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-[#333] focus:border-[#00AEEE] outline-none"
                                value={aiForm.geminiModel}
                                onChange={e => setAiForm({...aiForm, geminiModel: e.target.value})}
                            >
                                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recomendado)</option>
                                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Mais raciocínio)</option>
                                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Rápido)</option>
                            </select>
                        </div>
                    </div>
                )}

                {aiForm.provider === 'gpt' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-sm text-yellow-800 flex items-start gap-2">
                            <AlertTriangle size={16} className="mt-0.5 shrink-0"/>
                            <p>A integração com OpenAI é feita diretamente do seu navegador. Sua chave é salva apenas no seu dispositivo (LocalStorage).</p>
                        </div>
                        <div>
                            <label className="block text-sm text-[#333] mb-2 font-bold">OpenAI API Key</label>
                            <div className="relative">
                                <Key className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    type="password"
                                    className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-10 p-3 text-[#333] focus:border-[#00AEEE] focus:ring-1 focus:ring-[#00AEEE] outline-none transition-all font-mono text-sm"
                                    value={aiForm.openAIKey || ''}
                                    onChange={e => setAiForm({...aiForm, openAIKey: e.target.value})}
                                    placeholder="sk-..."
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-[#333] mb-2 font-bold">Modelo GPT</label>
                            <select 
                                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-[#333] focus:border-[#00AEEE] outline-none"
                                value={aiForm.gptModel}
                                onChange={e => setAiForm({...aiForm, gptModel: e.target.value})}
                            >
                                <option value="gpt-4o">GPT-4o (Recomendado)</option>
                                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                            </select>
                        </div>
                    </div>
                )}

                <div>
                    <label className="block text-sm text-[#333] mb-2 font-bold flex justify-between">
                        Criatividade (Temperatura) 
                        <span className="text-[#00AEEE]">{aiForm.temperature}</span>
                    </label>
                    <input 
                        type="range" 
                        min="0" max="1" step="0.1"
                        className="w-full accent-[#00AEEE]"
                        value={aiForm.temperature}
                        onChange={e => setAiForm({...aiForm, temperature: parseFloat(e.target.value)})}
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Preciso (0.0)</span>
                        <span>Criativo (1.0)</span>
                    </div>
                </div>

                <div className="pt-6 flex justify-end gap-4 border-t border-gray-100">
                    <button 
                        onClick={handleSaveAI}
                        className={`flex items-center gap-2 px-8 py-3 rounded-lg font-bold transition-all shadow-md ${aiStatus === 'saved' ? 'bg-green-600 text-white' : 'bg-[#005290] hover:bg-[#00386C] text-white'}`}
                    >
                        <Save size={18} />
                        {aiStatus === 'saved' ? 'Configuração Salva!' : 'Salvar Configuração IA'}
                    </button>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default SettingsView;
