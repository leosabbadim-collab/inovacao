
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { GlobalState, ChatMessage } from '../types';
import { createChatSession } from '../services/geminiService';

interface Props {
  data: GlobalState;
}

const AIConsultant: React.FC<Props> = ({ data }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Olá. Sou o Nexus, seu consultor de gestão. Analisei os dados do seu time e projetos. Como posso ajudar hoje?",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const chatSessionRef = useRef<any>(null);

  useEffect(() => {
    chatSessionRef.current = createChatSession(data);
  }, [data]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      if (!chatSessionRef.current) {
         chatSessionRef.current = createChatSession(data);
      }
      
      const result = await chatSessionRef.current.sendMessage({ message: userMsg.text });
      const responseText = result.text || "Não entendi.";

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Encontrei um erro ao processar seu pedido. Verifique a configuração da IA.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200 flex items-center gap-2 bg-white sticky top-0 z-10 shadow-sm">
        <Sparkles className="w-5 h-5 text-[#00AEEE]" />
        <h2 className="font-bold text-lg text-[#00386C]">Consultor Nexus ({data.aiConfig.provider === 'gpt' ? 'GPT' : 'Gemini'})</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f9fafb]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm ${
              msg.role === 'model' ? 'bg-[#00386C] text-white' : 'bg-[#B0C934] text-white'
            }`}>
              {msg.role === 'model' ? <Bot size={20} /> : <User size={20} />}
            </div>
            <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
              msg.role === 'model' 
                ? 'bg-white text-[#656464] border border-gray-200 rounded-tl-none' 
                : 'bg-[#005290] text-white rounded-tr-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-4">
             <div className="w-10 h-10 rounded-full bg-[#00386C] flex items-center justify-center shrink-0 text-white border-2 border-white shadow-sm">
               <Loader2 size={20} className="animate-spin" />
             </div>
             <div className="bg-white text-gray-400 p-4 rounded-2xl rounded-tl-none border border-gray-200 text-sm italic shadow-sm">
               Analisando dados...
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="relative max-w-3xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua pergunta..."
            className="w-full bg-gray-50 text-[#333] border border-gray-300 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-[#00AEEE] focus:ring-1 focus:ring-[#00AEEE] resize-none h-14 transition-all shadow-inner"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 p-2 bg-[#005290] hover:bg-[#00386C] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIConsultant;
