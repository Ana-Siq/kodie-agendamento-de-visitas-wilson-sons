/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect, useRef } from 'react';
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

export default function App() {
  // Navigation active tab index: 0 = Home, 1 = Safety, 2 = Scheduling, 3 = Dashboard
  const [activeTab, setActiveTab] = useState(0);

  // Core schedules state
  const [requests, setRequests] = useState<VisitRequest[]>([]);
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);

  // Keep track of statuses edited in this session to bypass Google's slow CDN export caching delay
  const statusOverrides = useRef<Record<string, 'aprovado' | 'rejeitado'>>({});

  // Integration variables state - Fixed to the provided Apps Script and Sheets URLs as requested!
  const [integration, setIntegration] = useState<IntegrationSettings>({
    appScriptUrl: 'https://script.google.com/macros/s/AKfycbxpOhX9udHttctS9cNxjhuyZY7rhfGcNnfWelVtABYlQ1yLyG6-Ni82key6hBceIuOD/exec',
    googleSheetUrl: 'https://docs.google.com/spreadsheets/d/1Gjw6zdm7EHgcwju08YlRyCrt1nz0iCyrPutHSEY0fA0/edit?gid=179874347',
    syncEnabled: true
  });

  // Pull records from Local Storage if present during initial loading
  useEffect(() => {
    const defaultSettings = {
      appScriptUrl: 'https://script.google.com/macros/s/AKfycbxpOhX9udHttctS9cNxjhuyZY7rhfGcNnfWelVtABYlQ1yLyG6-Ni82key6hBceIuOD/exec',
      googleSheetUrl: 'https://docs.google.com/spreadsheets/d/1Gjw6zdm7EHgcwju08YlRyCrt1nz0iCyrPutHSEY0fA0/edit?gid=179874347',
      syncEnabled: true
    };
    
    setIntegration(defaultSettings);
    localStorage.setItem('WS_INTEGRATION_SETTINGS', JSON.stringify(defaultSettings));

    const cachedRequests = localStorage.getItem('WS_VISITS_DATA');
    if (cachedRequests) {
      try {
        setRequests(JSON.parse(cachedRequests));
      } catch (err) {
        setRequests([]);
      }
    } else {
      setRequests([]);
    }

    // Auto load data from Google Sheets immediately using the fixed URL
    fetchRequestsFromSheets(defaultSettings.googleSheetUrl);
  }, []);

  // Sync state modifications to Local Storage
  const handlePersistRequests = (updatedList: VisitRequest[]) => {
    setRequests(updatedList);
    localStorage.setItem('WS_VISITS_DATA', JSON.stringify(updatedList));
  };

  // Fetch and parse live data from the Google Sheet central URL
  const fetchRequestsFromSheets = async (customSheetUrl?: string): Promise<boolean> => {
    const targetUrl = customSheetUrl || integration.googleSheetUrl;
    if (!targetUrl) {
      setSheetError(null);
      return false;
    }
    
    setIsLoadingSheets(true);
    setSheetError(null);
    try {
      // 1. Extract Spreadsheet ID
      const matchId = targetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (!matchId) {
        setIsLoadingSheets(false);
        setSheetError("Formato de link inválido da Planilha. Certifique-se de que a URL contém o ID (/d/...) da planilha.");
        return false;
      }
      const spreadsheetId = matchId[1];
      
      // 2. Extract Gid (sheet tab ID)
      const matchGid = targetUrl.match(/gid=([0-9]+)/);
      const gid = matchGid ? matchGid[1] : "179874347";
      
      const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;
      
      const response = await fetch(csvUrl);
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Aviso de Permissão: A planilha está definida como Restrita (privada). Altere as configurações de compartilhamento no Google Sheets para 'Qualquer pessoa com o link' para permitir a leitura.");
        }
        throw new Error("HTTP Erro " + response.status + ". Verifique se o ID ou URL da planilha do Google estão corretos.");
      }
      const csvText = await response.text();
      
      // 3. Robust CSV Parser
      const rows: string[][] = [];
      let currentRow: string[] = [""];
      let inQuotes = false;
      
      for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        const nextChar = csvText[i + 1];
        
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            currentRow[currentRow.length - 1] += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          currentRow.push("");
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
          if (char === '\r' && nextChar === '\n') {
            i++;
          }
          rows.push(currentRow);
          currentRow = [""];
        } else {
          currentRow[currentRow.length - 1] += char;
        }
      }
      if (currentRow.length > 1 || currentRow[0] !== "") {
        rows.push(currentRow);
      }

      if (rows.length <= 1) {
        handlePersistRequests([]);
        setIsLoadingSheets(false);
        return true;
      }

      // Map rows to VisitRequest structure using dynamic column matching
      const headers = rows[0].map(h => h.toLowerCase().trim());

      // Matching helper
      const findColIdx = (choices: string[], exclude?: string[]) => {
        for (const choice of choices) {
          const idx = headers.findIndex(h => {
            const matches = h.includes(choice);
            const excluded = exclude ? exclude.some(ex => h.includes(ex)) : false;
            return matches && !excluded;
          });
          if (idx !== -1) return idx;
        }
        return -1;
      };

      const nameIdx = findColIdx(['1. nome completo', 'nome completo', 'nome', 'candidato']);
      const emailIdx = findColIdx(['2. e-mail', 'e-mail', 'email'], ['endereço', 'endereco']);
      const phoneIdx = findColIdx(['3. telefone', 'telefone', 'whatsapp', 'celular', 'contato']);
      const profileIdx = findColIdx(['5. perfil', 'perfil']);
      const institutionIdx = findColIdx(['4. instituição', 'instituição', 'instituicao', 'empresa', 'origem']);
      const dateIdx = findColIdx(['7. data', 'data desejada', 'data'], ['carimbo']);
      const timeIdx = findColIdx(['8. horário', 'horário', 'horario', 'turno']);
      const visitorsIdx = findColIdx(['6. quantidade', 'quantidade', 'visitantes', 'visitantescount', 'nº de visitantes', 'no visitantes']);
      const purposeIdx = findColIdx(['9. objetivo', 'objetivo', 'purpose', 'motivo']);
      const statusIdx = findColIdx(['status da visita', 'status', 'situação', 'situacao', 'decisão', 'decisao']);
      const idIdx = findColIdx(['id', 'código', 'codigo'], ['quantidade']);
      const obsIdx = findColIdx(['10. observações', 'observações', 'observacoes'], ['quantidade']);

      const mappedRequests: VisitRequest[] = rows.slice(1).map((row, index) => {
        // Skip empty or invalid rows
        if (row.length < 3) return null;

        // Resolve Name (compulsory)
        const name = nameIdx !== -1 && row[nameIdx] ? row[nameIdx].trim() : '';
        if (!name) return null;

        // Email
        const email = emailIdx !== -1 && row[emailIdx] ? row[emailIdx].trim() : '';

        // ID - Resolves true WS-XXXXXX pattern or falls back to stable, unique combination
        let id = '';
        const rawIdValue = idIdx !== -1 && row[idIdx] ? row[idIdx].trim() : '';
        const rawObsValue = obsIdx !== -1 && row[obsIdx] ? row[obsIdx].trim() : '';

        if (rawIdValue && rawIdValue.startsWith('WS-') && /^[WS0-9\-]+$/.test(rawIdValue)) {
          id = rawIdValue;
        } else if (rawObsValue && rawObsValue.startsWith('WS-') && /^[WS0-9\-]+$/.test(rawObsValue)) {
          id = rawObsValue;
        } else {
          const timestamp = row[0] ? row[0].trim() : '';
          const namePart = name.substring(0, 10);
          const emailPart = email ? email.split('@')[0] : '';
          const combined = `${timestamp}_${namePart}_${emailPart}`;
          id = combined.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
          if (!id) {
            id = `WS-${index}-${Math.floor(100000 + Math.random() * 900000)}`;
          }
        }

        // Phone
        const phone = phoneIdx !== -1 && row[phoneIdx] ? row[phoneIdx].trim() : '';

        // Profile
        const profileRaw = profileIdx !== -1 && row[profileIdx] ? row[profileIdx].toLowerCase() : '';
        let profile: 'estudante' | 'profissional' | 'entusiasta' = 'entusiasta';
        if (profileRaw.includes('estudante') || profileRaw.includes('aluno')) {
          profile = 'estudante';
        } else if (profileRaw.includes('profissional') || profileRaw.includes('empresa') || profileRaw.includes('parceiro')) {
          profile = 'profissional';
        }

        // Institution
        const institution = institutionIdx !== -1 && row[institutionIdx] ? row[institutionIdx].trim() : 'N/A';

        // Date
        const dateRaw = dateIdx !== -1 && row[dateIdx] ? row[dateIdx].trim() : '';
        const date = dateRaw.replace(/"/g, '');

        // Time
        const turnoRaw = timeIdx !== -1 && row[timeIdx] ? row[timeIdx].toLowerCase() : '';
        const time: 'manha' | 'tarde' = (turnoRaw.includes('tarde') || turnoRaw.includes('vespertino') || turnoRaw.includes('t')) ? 'tarde' : 'manha';

        // Visitors Count
        let visitorsCount = 1;
        if (visitorsIdx !== -1 && row[visitorsIdx]) {
          const rawVisitors = row[visitorsIdx].trim();
          const parsed = parseInt(rawVisitors, 10);
          if (!isNaN(parsed)) {
            visitorsCount = parsed;
          } else {
            const match = rawVisitors.match(/\d+/);
            if (match) visitorsCount = parseInt(match[0], 10);
          }
        }

        // Purpose
        const purpose = purposeIdx !== -1 && row[purposeIdx] ? row[purposeIdx].trim() : '';

        // Status
        let status: 'pendente' | 'aprovado' | 'rejeitado' = 'pendente';
        if (statusIdx !== -1 && row[statusIdx]) {
          const statusRaw = row[statusIdx].toLowerCase();
          if (statusRaw.includes('aprovado') || statusRaw.includes('autorizado') || statusRaw.includes('confirmado')) {
            status = 'aprovado';
          } else if (statusRaw.includes('rejeitado') || statusRaw.includes('negado') || statusRaw.includes('rejeito')) {
            status = 'rejeitado';
          }
        } else {
          const lastColVal = (row[row.length - 1] || '').toLowerCase();
          if (lastColVal.includes('aprovado')) status = 'aprovado';
          else if (lastColVal.includes('rejeitado')) status = 'rejeitado';
        }

        // Created At
        const createdAt = row[0] || new Date().toISOString();

        return {
          id,
          name,
          email,
          phone,
          profile,
          institution,
          date,
          time,
          visitorsCount,
          purpose,
          status,
          createdAt
        };
      }).filter((r): r is VisitRequest => r !== null);

      // Apply session overrides to bypass Google Sheets /export caching delays (up to several seconds/minutes)
      const finalizedRequests = mappedRequests.map(req => {
        if (statusOverrides.current[req.id]) {
          return { ...req, status: statusOverrides.current[req.id] };
        }
        return req;
      });

      // Sort newest submissions on top
      finalizedRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      handlePersistRequests(finalizedRequests);
      setIsLoadingSheets(false);
      return true;
    } catch (err: any) {
      console.error("Failed to fetch/parse sheet CSV:", err);
      setIsLoadingSheets(false);
      if (err instanceof TypeError) {
        setSheetError("Erro de acesso/rede (bloqueio CORS). A planilha do Google pode ser privada. Altere o compartilhamento dela para 'Qualquer pessoa com o link'.");
      } else {
        setSheetError(err.message || String(err));
      }
      return false;
    }
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
        
        // Refetch right after submitting to show in the Dashboard real quick!
        setTimeout(() => {
          fetchRequestsFromSheets();
        }, 1200);
      } catch (e) {
        console.error("Direct Apps Script dispatch failed:", e);
      }
    }

    return true;
  };

  // Change request status (Approve / Reject) and sync bidirectionally with Google Sheets
  const handleUpdateStatus = async (id: string, status: 'aprovado' | 'rejeitado') => {
    // Record status locally so we bypass any temporary Google Sheet caching delay on subsequent fetch
    statusOverrides.current[id] = status;

    const reqObj = requests.find(r => r.id === id);

    const updated = requests.map(req => {
      if (req.id === id) {
        return { ...req, status };
      }
      return req;
    });
    handlePersistRequests(updated);

    if (integration.appScriptUrl) {
      try {
        await fetch(integration.appScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'updateStatus',
            id,
            status,
            name: reqObj?.name || '',
            email: reqObj?.email || '',
            date: reqObj?.date || '',
            time: reqObj?.time || '',
            timestamp: reqObj?.createdAt || ''
          })
        });
        // refresh status from Sheets real-time to align columns
        setTimeout(() => {
          fetchRequestsFromSheets();
        }, 1500);
      } catch (err) {
        console.error("Failed to propagate status change to AppsScript:", err);
      }
    }
  };

  // Dismiss a request and sync with Sheets delete action
  const handleDeleteRequest = async (id: string) => {
    // Clear overridden status for this ID of interest
    delete statusOverrides.current[id];

    const targetReq = requests.find(r => r.id === id);

    const updated = requests.filter(req => req.id !== id);
    handlePersistRequests(updated);

    if (integration.appScriptUrl) {
      try {
        await fetch(integration.appScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'delete',
            id,
            name: targetReq?.name || '',
            email: targetReq?.email || '',
            timestamp: targetReq?.createdAt || ''
          })
        });
        setTimeout(() => {
          fetchRequestsFromSheets();
        }, 1500);
      } catch (err) {
        console.error("Failed to delete record on Google Sheet via AppsScript:", err);
      }
    }
  };

  // Update cloud connection coordinates
  const handleUpdateIntegration = (settings: Partial<IntegrationSettings>) => {
    const updated = { ...integration, ...settings };
    setIntegration(updated);
    localStorage.setItem('WS_INTEGRATION_SETTINGS', JSON.stringify(updated));
    if (settings.googleSheetUrl) {
      fetchRequestsFromSheets(settings.googleSheetUrl);
    }
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
                  isLoadingSheets={isLoadingSheets}
                  onRefreshFromSheets={() => fetchRequestsFromSheets()}
                  sheetError={sheetError}
                  onClearSheetError={() => setSheetError(null)}
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
