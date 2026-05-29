/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LayoutDashboard, Users, FileSpreadsheet, Check, X, Trash2, Search, Filter, Server, Copy, CheckCircle, ArrowDownToLine, Terminal, Eye, HelpCircle } from 'lucide-react';
import { VisitRequest, IntegrationSettings } from '../types';

interface DashboardSectionProps {
  requests: VisitRequest[];
  onUpdateRequestStatus: (id: string, status: 'aprovado' | 'rejeitado') => void;
  onDeleteRequest: (id: string) => void;
  integrationSettings: IntegrationSettings;
  onUpdateIntegration: (settings: Partial<IntegrationSettings>) => void;
  onSyncAllWithSheets: () => Promise<boolean>;
}

export default function DashboardSection({
  requests,
  onUpdateRequestStatus,
  onDeleteRequest,
  integrationSettings,
  onUpdateIntegration,
  onSyncAllWithSheets
}: DashboardSectionProps) {
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [profileFilter, setProfileFilter] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Apps Script code copy status
  const [copiedScript, setCopiedScript] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  // Stats calculation
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status === 'pendente').length;
  const approvedRequests = requests.filter(r => r.status === 'aprovado').length;
  const totalVisitorsCount = requests.reduce((sum, r) => sum + (r.status === 'aprovado' ? r.visitorsCount : 0), 0);

  // Group distributions for SVG Chart rendering
  const studentCount = requests.filter(r => r.profile === 'estudante').length;
  const professionalCount = requests.filter(r => r.profile === 'profissional').length;
  const enthusiastCount = requests.filter(r => r.profile === 'entusiasta').length;

  const maxProfileCount = Math.max(1, studentCount + professionalCount + enthusiastCount);
  const studentPct = Math.round((studentCount / maxProfileCount) * 100);
  const professionalPct = Math.round((professionalCount / maxProfileCount) * 100);
  const enthusiastPct = Math.round((enthusiastCount / maxProfileCount) * 100);

  // Filter logic
  const filteredRequests = requests.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.institution.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProfile = profileFilter === 'todos' || r.profile === profileFilter;
    const matchesStatus = statusFilter === 'todos' || r.status === statusFilter;

    return matchesSearch && matchesProfile && matchesStatus;
  });

  // Export to CSV Function
  const handleExportCSV = () => {
    if (requests.length === 0) return;
    
    const headers = ['ID', 'Nome', 'Email', 'Telefone', 'Perfil', 'Instituicao', 'Data', 'Turno', 'Visitantes', 'Objetivacao', 'Status', 'Data_Criacao'];
    const rows = requests.map(r => [
      r.id,
      `"${r.name.replace(/"/g, '""')}"`,
      r.email,
      r.phone,
      r.profile,
      `"${r.institution.replace(/"/g, '""')}"`,
      r.date,
      r.time,
      r.visitorsCount,
      `"${r.purpose.replace(/"/g, '""')}"`,
      r.status,
      r.createdAt
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `solicitacoes_visitas_wilsonsons_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Apps Script Complete Code template
  const appsScriptCode = `// Google Apps Script (doPost) para as automações da Wilson Sons
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Adiciona cabeçalhos caso a planilha esteja virgem
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "ID", "Nome Completo", "E-mail", "WhatsApp", 
        "Perfil", "Instituicao / Empresa", "Data da Visita", 
        "Turno", "No Visitantes", "Objetivo", "Status", "Data Submissao"
      ]);
    }
    
    // Insere os dados obtidos da aplicação
    sheet.appendRow([
      data.id,
      data.name,
      data.email,
      data.phone,
      data.profile,
      data.institution,
      data.date,
      data.time === 'manha' ? 'Manhã' : 'Tarde',
      data.visitorsCount,
      data.purpose,
      data.status || 'pendente',
      new Date().toISOString()
    ]);
    
    // Ativa automação de despacho de e-mail informativo aos visitantes
    try {
      enviarEmailAutomatizado(data.email, data.name, data.date, data.time);
    } catch(errMail) {
      Logger.log("Falha envio de e-mail: " + errMail.toString());
    }
    
    return ContentService.createTextOutput(JSON.stringify({ 
      success: true, 
      message: "Visita registrada no banco central Wilson Sons!" 
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function enviarEmailAutomatizado(email, nome, dataStr, turno) {
  var assunto = "Wilson Sons - Receptação de Solicitação de Visita Técnica";
  var dataFormatada = dataStr.split("-").reverse().join("/");
  var turnoStr = turno === 'manha' ? 'Período Matutino (09h - 11h)' : 'Período Vespertino (14h - 16h)';
  
  var corpoHtml = "<h3>Olá, " + nome + "!</h3>" +
    "<p>Sua solicitação de agendamento de visita técnica para os terminais da Wilson Sons foi registrada.</p>" +
    "<p><b>Detalhes Importantes:</b></p>" +
    "<ul>" +
      "<li><b>Data:</b> " + dataFormatada + "</li>" +
      "<li><b>Turno:</b> " + turnoStr + "</li>" +
    "</ul>" +
    "<p>⚠️ <b>Lembrete de Segurança Imprescindível:</b></p>" +
    "<p>O porte de <b>EPIs completos</b> (capacete, colete fluorescente vísivel e sapato fechado/bota) é obrigatório. " +
    "É expressamente <b>proibida a entrada com camisa regata</b>.</p>" +
    "<p>A análise operacional do terminal entrará em contato para aprovação.</p>" +
    "<br><p>Atenciosamente,<br><b>Wilson Sons - Coordenação Portuária</b></p>";
    
  MailApp.sendEmail({
    to: email,
    subject: assunto,
    htmlBody: corpoHtml
  });
}`;

  const copyToClipboardScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedScript(true);
    setTimeout(() => {
      setCopiedScript(false);
    }, 2000);
  };

  const handleSyncSheets = async () => {
    if (!integrationSettings.appScriptUrl) {
      setSyncFeedback({ type: 'err', msg: 'Configure o URL do Apps Script primeiro.' });
      return;
    }
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const ok = await onSyncAllWithSheets();
      if (ok) {
        setSyncFeedback({ type: 'ok', msg: `${requests.length} registros despachados e integrados com sucesso!` });
      } else {
        setSyncFeedback({ type: 'err', msg: 'Ocorreu um erro no tráfego de dados. Verifique o Script Web App.' });
      }
    } catch {
      setSyncFeedback({ type: 'err', msg: 'Erro de conexificação com o servidor.' });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div id="dashboard_section" className="w-full h-full flex flex-col justify-between py-4 px-6 md:px-12 overflow-y-auto select-none max-w-7xl mx-auto">
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-navy-800/10 pb-4 space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <LayoutDashboard className="w-6 h-6 text-sky-500" />
          <h2 className="text-lg md:text-xl font-bold font-sans tracking-tight text-navy-900 uppercase">
            Painel Operacional do Gestor
          </h2>
        </div>
        
        {/* Export and action triggers */}
        <div className="flex space-x-2 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            disabled={requests.length === 0}
            className={`text-xs py-2 px-3.5 rounded-xl font-semibold flex items-center space-x-1.5 transition-all cursor-pointer border ${requests.length === 0 ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white hover:bg-slate-100 text-navy-900 border-slate-200 active:scale-95'}`}
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={handleSyncSheets}
            disabled={isSyncing || !integrationSettings.appScriptUrl || requests.length === 0}
            className={`text-xs py-2 px-3.5 rounded-xl font-semibold flex items-center space-x-1.5 transition-all text-white cursor-pointer ${!integrationSettings.appScriptUrl || requests.length === 0 ? 'bg-slate-350 cursor-not-allowed' : 'bg-sky-500 hover:bg-sky-400 active:scale-95'}`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{isSyncing ? "Sincronizando..." : "Enviar p/ Sheets"}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 mb-2">
        {/* CARD Total */}
        <div className="bg-white p-4 rounded-2xl border border-navy-950/5 shadow-xs flex items-center space-x-3 text-left">
          <div className="p-3 bg-navy-900 text-white rounded-xl">
            <Users className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-gray-400">Total Solicitado</p>
            <h4 className="text-xl font-bold text-navy-900 mt-0.5">{totalRequests}</h4>
          </div>
        </div>

        {/* CARD Pending */}
        <div className="bg-white p-4 rounded-2xl border border-navy-950/5 shadow-xs flex items-center space-x-3 text-left">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Terminal className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Pendentes</p>
            <h4 className="text-xl font-bold text-amber-600 mt-0.5">{pendingRequests}</h4>
          </div>
        </div>

        {/* CARD Approved */}
        <div className="bg-white p-4 rounded-2xl border border-navy-950/5 shadow-xs flex items-center space-x-3 text-left">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Autorizadas</p>
            <h4 className="text-xl font-bold text-emerald-600 mt-0.5">{approvedRequests}</h4>
          </div>
        </div>

        {/* CARD Headcount */}
        <div className="bg-white p-4 rounded-2xl border border-navy-950/5 shadow-xs flex items-center space-x-3 text-left">
          <div className="p-3 bg-sky-500/10 text-sky-500 rounded-xl">
            <Users className="w-5 h-5 text-sky-500" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Visitantes Autorizados</p>
            <h4 className="text-xl font-bold text-sky-500 mt-0.5">{totalVisitorsCount}</h4>
          </div>
        </div>
      </div>

      {/* Main Grid Content (Table + Settings & Sync Code) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-auto items-stretch pt-2">
        
        {/* Left main area: Requests List Table and Search */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-white border border-navy-950/5 rounded-2xl p-4 shadow-sm relative">
          
          {/* Table Toolbar controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center pb-3 border-b border-slate-100 gap-2 mb-3">
            {/* Search Input bar */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filtrar por nome, empresa ou e-mail"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-sky-500 focus:bg-white"
              />
            </div>

            {/* Select status drop & profile filter */}
            <div className="flex space-x-2 w-full sm:w-auto">
              <select
                value={profileFilter}
                onChange={e => setProfileFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 focus:outline-hidden text-navy-900"
              >
                <option value="todos">Todos Perfis</option>
                <option value="estudante">Estudantes</option>
                <option value="profissional">Profissionais</option>
                <option value="entusiasta">Entusiastas</option>
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 focus:outline-hidden text-navy-900"
              >
                <option value="todos">Todos Status</option>
                <option value="pendente">Pendentes</option>
                <option value="aprovado">Aprovadas</option>
                <option value="rejeitado">Rejeitadas</option>
              </select>
            </div>
          </div>

          {/* Real Table */}
          <div className="overflow-x-auto select-text max-h-[220px] scrollbar-none flex-1">
            <table className="min-w-full divide-y divide-slate-100 text-left text-[11px]">
              <thead className="bg-slate-50/75 sticky top-0 font-bold text-navy-800">
                <tr>
                  <th className="px-3 py-2">Candidato</th>
                  <th className="px-3 py-2">Especialidade / Origem</th>
                  <th className="px-3 py-2">Agendamento</th>
                  <th className="px-3 py-2">Grupo</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-center">Decisão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-slate-400 font-medium font-sans">
                      Nenhuma solicitação de visita encontrada correspondente aos filtros.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <p className="font-bold text-navy-900 text-xs">{req.name}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{req.email}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="capitalize font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded mr-1.5">{req.profile}</span>
                        <span className="text-gray-500 text-[10px] truncate max-w-[120px] inline-block align-middle">{req.institution}</span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <p className="font-semibold text-navy-900">{req.date.split('-').reverse().join('/')}</p>
                        <p className="text-[9px] text-sky-600 font-medium uppercase font-mono tracking-wider">{req.time === 'manha' ? "Manhã (09h)" : "Tarde (14h)"}</p>
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono font-semibold text-slate-800">
                        {req.visitorsCount}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${req.status === 'aprovado' ? 'bg-emerald-100 text-emerald-800' : req.status === 'rejeitado' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-center text-xs">
                        {req.status === 'pendente' ? (
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              title="Aprovar visita"
                              onClick={() => onUpdateRequestStatus(req.id, 'aprovado')}
                              className="p-1 h-6 w-6 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              title="Rejeitar visita"
                              onClick={() => onUpdateRequestStatus(req.id, 'rejeitado')}
                              className="p-1 h-6 w-6 rounded-md bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <button
                              title="Remover do controle"
                              onClick={() => onDeleteRequest(req.id)}
                              className="p-1 h-6 w-6 rounded-md bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors cursor-pointer border border-transparent"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Quick inline distribution graphical preview */}
          <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] text-gray-500">
            <span className="font-semibold text-navy-800 uppercase tracking-widest font-mono text-[9px]">Amostragem de Perfis:</span>
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1.5 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-navy-900" /> <span>Estudantes ({studentPct}%)</span></span>
              <span className="flex items-center space-x-1.5 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> <span>Profissionais ({professionalPct}%)</span></span>
              <span className="flex items-center space-x-1.5 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> <span>Entusiastas ({enthusiastPct}%)</span></span>
            </div>
          </div>
        </div>

        {/* Right Area: Low Code Sheets Sync settings & Code view */}
        <div className="lg:col-span-4 flex flex-col justify-between bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 shadow-sm select-text text-left">
          
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center space-x-2">
                <Server className="w-4.5 h-4.5 text-sky-400 shrink-0" />
                <h3 className="text-xs font-bold font-mono text-sky-400 uppercase tracking-wider">
                  Nuvem & Google Sheets Low-Code
                </h3>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            {/* Feedback alert (Manual sync success / err) */}
            {syncFeedback && (
              <div className={`p-2 rounded-xl text-[10px] leading-relaxed border ${syncFeedback.type === 'ok' ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300' : 'bg-red-950/50 border-red-800 text-red-300'}`}>
                {syncFeedback.msg}
              </div>
            )}

            {/* Inputs settings */}
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase font-mono text-slate-400 mb-1">
                  1. Deploy Apps Script Web App URL
                </label>
                <input
                  type="text"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={integrationSettings.appScriptUrl}
                  onChange={e => onUpdateIntegration({ appScriptUrl: e.target.value })}
                  className="w-full text-[10px] text-slate-200 border border-slate-700 bg-slate-950 rounded-lg px-2.5 py-2 font-mono focus:outline-hidden focus:ring-1 focus:ring-sky-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase font-mono text-slate-400 mb-1">
                  2. Link da Planilha Central (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  value={integrationSettings.googleSheetUrl}
                  onChange={e => onUpdateIntegration({ googleSheetUrl: e.target.value })}
                  className="w-full text-[10px] text-slate-300 border border-slate-700 bg-slate-950 rounded-lg px-2.5 py-2 font-mono focus:outline-hidden focus:ring-1 focus:ring-sky-400"
                />
              </div>

              {integrationSettings.googleSheetUrl && (
                <a
                  href={integrationSettings.googleSheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 text-[9px] font-bold text-sky-400 hover:underline hover:text-sky-300"
                >
                  <FileSpreadsheet className="w-3 h-3" />
                  <span>Acessar Google Planilha em nova aba</span>
                </a>
              )}
            </div>

            {/* Low-code Instructions Accordion text */}
            <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl text-[10px] text-slate-350 leading-relaxed space-y-1 bg-gradient-to-br from-slate-950 to-slate-900">
              <p className="font-bold text-sky-400 text-[10.5px] uppercase font-mono mb-1.5 flex items-center space-x-1">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Instalação Passo-a-Passo:</span>
              </p>
              <p>1. Crie uma Google Planilha e acesse <strong>Extensões → Apps Script</strong>.</p>
              <p>2. Copie o código abaixo e cole no painel do editor Google.</p>
              <p>3. Clique <strong>Implantar → Nova implantação</strong> tipo <strong>"App da Web"</strong>.</p>
              <p>4. Em <i>"Quem pode acessar"</i>, marque obrigatoriamente <strong>"Qualquer pessoa"</strong>.</p>
              <p>5. Copie a URL gerada e cole nesta seção acima!</p>
            </div>
          </div>

          {/* Script copying compartment */}
          <div className="mt-3.5">
            <div className="flex justify-between items-center text-[10px] mb-1.5">
              <span className="font-bold uppercase font-mono text-slate-400 flex items-center space-x-1">
                <Terminal className="w-3.5 h-3.5 text-slate-400" />
                <span>Código AppsScript Integrador</span>
              </span>
              <button
                type="button"
                onClick={copyToClipboardScript}
                className="text-sky-400 hover:text-sky-300 font-bold font-mono px-2 py-0.5 rounded-md hover:bg-slate-800 flex items-center space-x-1 cursor-pointer transition-colors"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedScript ? "Copiado!" : "Copiar"}</span>
              </button>
            </div>
            <pre className="text-[9px] font-mono text-slate-400 bg-slate-950 p-2.5 rounded-lg border border-slate-800 max-h-[80px] overflow-y-auto scrollbar-none select-all whitespace-pre">
              {appsScriptCode}
            </pre>
          </div>

        </div>

      </div>
    </div>
  );
}
