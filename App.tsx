
import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, Menu, Book, Settings, Globe } from 'lucide-react';
import { useDataStore } from './hooks/useDataStore';
import TeamView from './components/TeamView';
import ProjectView from './components/ProjectView';
import AIConsultant from './components/AIConsultant';
import KnowledgeBaseView from './components/KnowledgeBaseView';
import SettingsView from './components/SettingsView';

const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 border-r-4 transition-all ${
        isActive 
          ? 'bg-white/10 border-[#00AEEE] text-white' // Cyan border for active
          : 'border-transparent text-slate-300 hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon size={20} className={isActive ? 'text-[#00AEEE]' : ''} />
      <span className="font-medium">{label}</span>
    </Link>
  );
};

const Layout = () => {
  const { 
      state, 
      addTeamMember, updateTeamMember, deleteTeamMember, 
      addProject, updateProject, deleteProject,
      addDoc, updateDoc, deleteDoc,
      updateTrelloConfig, updateAIConfig, syncTrelloDemands
  } = useDataStore();
  
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <div className="flex h-screen bg-[#f3f4f6] overflow-hidden font-sans">
      {/* Sidebar - DMS Navy (#00386C) */}
      <aside className={`fixed inset-y-0 left-0 z-20 w-64 bg-[#00386C] shadow-xl transform transition-transform duration-300 md:relative md:translate-x-0 ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between">
            {/* Stylized DMS Logo based on Brand Book */}
            <div className="flex flex-col">
                <h1 className="text-3xl font-extrabold italic tracking-tight text-white leading-none">
                    DMS
                </h1>
                <span className="text-xs tracking-[0.2em] text-[#00AEEE] font-semibold mt-1">
                    LOGISTICS
                </span>
            </div>
             <button onClick={() => setShowMobileMenu(false)} className="md:hidden text-white">
                <Menu size={20} />
            </button>
        </div>
        
        {/* Decoration Line - Gradient */}
        <div className="h-1 w-full bg-gradient-to-r from-[#00AEEE] to-[#B0C934]"></div>

        <nav className="mt-6 space-y-1">
          <NavItem to="/" icon={LayoutDashboard} label="Projetos" />
          <NavItem to="/team" icon={Users} label="Time & PDI" />
          <NavItem to="/docs" icon={Book} label="Base de Conhecimento" />
          <NavItem to="/consultant" icon={MessageSquare} label="Consultor IA" />
          <NavItem to="/settings" icon={Settings} label="Configurações" />
        </nav>
        
        <div className="absolute bottom-0 w-full p-4">
             <div className="bg-[#005290] rounded-lg p-4 text-center shadow-lg border border-[#00AEEE]/30">
                 <p className="text-[10px] text-white uppercase tracking-widest mb-2 font-bold">Status do Sistema</p>
                 <div className="flex items-center justify-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-[#B0C934] animate-pulse"></span>
                     <span className="text-sm text-white font-medium">{state.aiConfig.provider === 'gpt' ? 'GPT Online' : 'Gemini Online'}</span>
                 </div>
             </div>
             <p className="text-center text-[10px] text-slate-400 mt-4">Design Logistics & Technology</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative bg-dms-grid">
        <header className="md:hidden p-4 border-b border-gray-200 flex justify-between bg-[#00386C] text-white shadow-md">
             <div className="flex flex-col">
                <h1 className="text-xl font-extrabold italic">DMS</h1>
             </div>
             <button onClick={() => setShowMobileMenu(true)} className="text-white">
                <Menu size={24}/>
             </button>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Content View */}
            <div className="flex-1 overflow-hidden h-full">
                <Routes>
                    <Route path="/" element={
                        <ProjectView 
                            projects={state.projects} 
                            onAdd={addProject} 
                            onUpdate={updateProject} 
                            onDelete={deleteProject}
                            fullState={state}
                        />
                    } />
                    <Route path="/team" element={
                        <TeamView 
                            team={state.team} 
                            onAdd={addTeamMember} 
                            onUpdate={updateTeamMember} 
                            onDelete={deleteTeamMember}
                            onSyncDemands={syncTrelloDemands}
                            fullState={state}
                        />
                    } />
                    <Route path="/docs" element={
                        <KnowledgeBaseView
                            docs={state.knowledgeBase}
                            onAdd={addDoc}
                            onUpdate={updateDoc}
                            onDelete={deleteDoc}
                            fullState={state}
                        />
                    } />
                    <Route path="/settings" element={
                        <SettingsView
                            config={state.trelloConfig}
                            aiConfig={state.aiConfig}
                            onSave={updateTrelloConfig}
                            onSaveAI={updateAIConfig}
                        />
                    } />
                    <Route path="/consultant" element={
                        <AIConsultant data={state} />
                    } />
                </Routes>
            </div>
            
            {/* Desktop Side Panel for AI - White background with border */}
            <div className="hidden lg:block w-96 border-l border-gray-200 h-full bg-white shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.1)]">
                 <Routes>
                    <Route path="/consultant" element={<div className="p-12 text-center text-[#656464] mt-20 font-medium">Visão maximizada ativa</div>} />
                    <Route path="*" element={<AIConsultant data={state} />} />
                 </Routes>
            </div>
        </div>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <HashRouter>
      <Layout />
    </HashRouter>
  );
};

export default App;
