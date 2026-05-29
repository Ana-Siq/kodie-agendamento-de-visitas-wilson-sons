/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Anchor, ShieldCheck, CalendarRange, LayoutDashboard, Anchor as AnchorIcon, AlertCircle, HelpCircle } from 'lucide-react';
import { VisitRequest, IntegrationSettings } from './types';

// Importing custom section components
import HomeSection from './components/HomeSection';
import SafetySection from './components/SafetySection';
import SchedulingSection from './components/SchedulingSection';
import DashboardSection from './components/DashboardSection';

// Unique ID generator helper
const generateIdx = () => 'WS-' + Math.floor(100000 + Math.random() * 900000);

// Pre-seeded initial data for an active and beautiful starting dashboard
const PRE_SEEDED_REQUESTS: VisitRequest[] = [
  {
    id: "WS-810231",
    name: "Carolina Ribeiro Lins",
    email: "carol.lins@unisantos.edu.br",
    phone: "(13) 98124-5512",
    profile: "estudante",
    institution: "Universidade Católica de Santos (Eng. Portuária)",
    date: "2026-06-15",
    time: "manha",
    visitorsCount: 18,
    purpose: "Visita de campo para observar a descarga integrada de navios Panamax e logística da ferrovia portuária.",
    status: "aprovado",
    createdAt: "2026-05-28T14:20:00Z"
  },
  {
    id: "WS-401294",
    name: "Comte. Roberto Guimarães",
    email: "roberto.guimaraes@praticagemrj.com.br",
    phone: "(21) 99014-4123",
    profile: "profissional",
    institution: "Associação de Praticagem Marina Rio",
    date: "2026-06-22",
    time: "tarde",
    visitorsCount: 4,
    purpose: "Visita técnica de alinhamento operacional para novos rebocadores de propulsão azimutal (ASD).",
    status: "pendente",
    createdAt: "2026-05-29T10:15:30Z"
  },
  {
    id: "WS-773194",
    name: "Felipe Macedo Neto",
    email: "felipe.macedo.neto@gmail.com",
    phone: "(11) 97412-0056",
    profile: "entusiasta",
    institution: "N/A (Entusiasta)",
    date: "2026-07-03",
    time: "manha",
    visitorsCount: 2,
    purpose: "Pesquisa pessoal sobre a história do terminal Tecon e acompanhamento das operações de guindastes STS em escala reduzida.",
    status: "rejeitado",
    createdAt: "2026-05-29T15:34:11Z"
  }
];

export default function App() {
  // Navigation active tab index: 0 = Home, 1 = Safety, 2 = Scheduling, 3 = Dashboard
  const [activeTab, setActiveTab] = useState(0);

  // Core schedules state
  const [requests, setRequests] = useState<VisitRequest[]>([]);

  // Integration variables state
  const [integration, setIntegration] = useState<IntegrationSettings>({
    appScriptUrl: '',
    googleSheetUrl: '',
    syncEnabled: false
  });

  // Pull records from Local Storage if present during initial loading
  useEffect(() => {
    const cachedRequests = localStorage.getItem('WS_VISITS_DATA');
    if (cachedRequests) {
      try {
        setRequests(JSON.parse(cachedRequests));
      } catch (err) {
        setRequests(PRE_SEEDED_REQUESTS);
      }
    } else {
      setRequests(PRE_SEEDED_REQUESTS);
      localStorage.setItem('WS_VISITS_DATA', JSON.stringify(PRE_SEEDED_REQUESTS));
    }

    const cachedSettings = localStorage.getItem('WS_INTEGRATION_SETTINGS');
    if (cachedSettings) {
      try {
        setIntegration(JSON.parse(cachedSettings));
      } catch (err) {
        // use default empty
      }
    }
  }, []);

  // Sync state modifications to Local Storage
  const handlePersistRequests = (updatedList: VisitRequest[]) => {
    setRequests(updatedList);
    localStorage.setItem('WS_VISITS_DATA', JSON.stringify(updatedList));
  };

  // Create a new request in State (+ options background AppScript transmission)
  const handleAddRequest = async (newRequest: Omit<VisitRequest, 'id' | 'createdAt' | 'status'>): Promise<boolean> => {
    const freshRecord: VisitRequest = {
      ...newRequest,
      id: generateIdx(),
      status: 'pendente',
      createdAt: new Date().toISOString()
    };

    const updated = [freshRecord, ...requests];
    handlePersistRequests(updated);

    // If direct sync is set up, fire standard fetch POST to AppScript
    if (integration.appScriptUrl) {
      try {
        await fetch(integration.appScriptUrl, {
          method: 'POST',
          mode: 'no-cors', // standard workaround for Appscript redirect CORS in client apps
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(freshRecord)
        });
      } catch (e) {
        console.error("Direct Apps Script dispatch failed:", e);
      }
    }

    return true;
  };

  // Change request status (Approve / Reject)
  const handleUpdateStatus = (id: string, status: 'aprovado' | 'rejeitado') => {
    const updated = requests.map(req => {
      if (req.id === id) {
        return { ...req, status };
      }
      return req;
    });
    handlePersistRequests(updated);
  };

  // Dismiss a request
  const handleDeleteRequest = (id: string) => {
    const updated = requests.filter(req => req.id !== id);
    handlePersistRequests(updated);
  };

  // Update cloud connection coordinates
  const handleUpdateIntegration = (settings: Partial<IntegrationSettings>) => {
    const updated = { ...integration, ...settings };
    setIntegration(updated);
    localStorage.setItem('WS_INTEGRATION_SETTINGS', JSON.stringify(updated));
  };

  // Sequential push of all stored requests to Sheets API
  const handleSyncAllWithSheets = async (): Promise<boolean> => {
    if (!integration.appScriptUrl) return false;

    try {
      // Dispatch requests sequentially with CORS mode bypassed
      for (const req of requests) {
        await fetch(integration.appScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(req)
        });
      }
      return true;
    } catch (err) {
      console.error("Group Sync failed:", err);
      return false;
    }
  };

  // Tabs layout coordinate mappings
  const tabMetadata = [
    { label: "Apresentação", icon: <AnchorIcon className="w-4 h-4" /> },
    { label: "EPIs & Segurança", icon: <ShieldCheck className="w-4 h-4" /> },
    { label: "Agendar Online", icon: <CalendarRange className="w-4 h-4" /> },
    { label: "Painel do Gestor", icon: <LayoutDashboard className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between select-none font-sans antialiased text-slate-800">
      
      {/* Dynamic Global Topbar with Navigation and slider marker */}
      <header className="bg-navy-900 text-white shadow-xl sticky top-0 z-40 border-b border-navy-800/60">
        <div id="corporate-header" className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Logo Wilson Sons */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab(0)}>
            <div className="bg-white/10 p-2 rounded-xl border border-white/10 flex items-center justify-center animate-pulse">
              <Anchor className="w-5 h-5 text-sky-400" />
            </div>
            <div className="text-left">
              <div className="font-extrabold text-white text-base tracking-wider font-sans">WILSON SONS</div>
              <div className="text-[10px] font-mono tracking-widest text-sky-400 font-semibold uppercase">Portos & Logística Marítima</div>
            </div>
          </div>

          {/* Nav Links Tabs in pill shape with framer selection background */}
          <nav className="bg-navy-950 p-1.5 rounded-2xl flex items-center space-x-1 border border-navy-800">
            {tabMetadata.map((tab, idx) => (
              <button
                key={idx}
                id={`tab_nav_${idx}`}
                onClick={() => setActiveTab(idx)}
                className={`relative px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer z-10 ${activeTab === idx ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {activeTab === idx && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 bg-sky-500 rounded-xl -z-10"
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                  />
                )}
                <span>{tab.icon}</span>
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content Area with elegant fade transition */}
      <main className="flex-1 w-full flex flex-col py-6 bg-radial from-slate-100 to-slate-50">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="w-full h-full flex-1 flex flex-col"
            >
              {activeTab === 0 && (
                <HomeSection 
                  onNavigateToScheduling={() => setActiveTab(2)} 
                  onNavigateToSafety={() => setActiveTab(1)} 
                />
              )}
              {activeTab === 1 && (
                <SafetySection 
                  onNavigateToScheduling={() => setActiveTab(2)} 
                />
              )}
              {activeTab === 2 && (
                <SchedulingSection 
                  onSubmitRequest={handleAddRequest} 
                />
              )}
              {activeTab === 3 && (
                <DashboardSection 
                  requests={requests}
                  onUpdateRequestStatus={handleUpdateStatus}
                  onDeleteRequest={handleDeleteRequest}
                  integrationSettings={integration}
                  onUpdateIntegration={handleUpdateIntegration}
                  onSyncAllWithSheets={handleSyncAllWithSheets}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mandatory Corporate and Education Footer */}
      <footer className="bg-navy-900 border-t border-navy-800 text-slate-400 py-4 px-6 relative z-10 select-none">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center text-xs gap-2">
          
          <div className="flex items-center space-x-1">
            <span className="font-semibold text-slate-300">Wilson Sons Visitas</span>
            <span>© 2026</span>
          </div>

          {/* MANDATORY TEXT EXACTLY AS REQUESTED */}
          <div className="font-mono font-medium text-slate-300 text-center uppercase tracking-wider bg-navy-950/60 py-1 px-4 border border-navy-800 rounded-full">
            “Projeto desenvolvido para fins educativos na KODIE Academy”
          </div>

          <div className="text-[10px] text-slate-400 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Sistema Operacional</span>
          </div>

        </div>
      </footer>

    </div>
  );
}
