/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, FileSpreadsheet, Check, X, Trash2, 
  Search, Filter, Server, Copy, CheckCircle, ArrowDownToLine, 
  Terminal, Eye, HelpCircle, LogOut, Lock, RefreshCw 
} from 'lucide-react';
import { VisitRequest, IntegrationSettings } from '../types';

interface DashboardSectionProps {
  requests: VisitRequest[];
  onUpdateRequestStatus: (id: string, status: 'aprovado' | 'rejeitado') => void;
  onDeleteRequest: (id: string) => void;
  integrationSettings: IntegrationSettings;
  onUpdateIntegration: (settings: Partial<IntegrationSettings>) => void;
  onSyncAllWithSheets: () => Promise<boolean>;
  isLoadingSheets?: boolean;
  onRefreshFromSheets?: () => void;
  sheetError?: string | null;
  onClearSheetError?: () => void;
}

export default function DashboardSection({
  requests,
  onUpdateRequestStatus,
  onDeleteRequest,
  integrationSettings,
  onUpdateIntegration,
  onSyncAllWithSheets,
  isLoadingSheets = false,
  onRefreshFromSheets,
  sheetError,
  onClearSheetError
}: DashboardSectionProps) {
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [profileFilter, setProfileFilter] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Authenticated check state fixed to admin / admin
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('WS_ADMIN_AUTHENTICATED') === 'true';
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === 'admin' && password.trim() === 'admin') {
      setIsAuthenticated(true);
      localStorage.setItem('WS_ADMIN_AUTHENTICATED', 'true');
      setLoginError('');
    } else {
      setLoginError('Acesso negado. Usuário ou senha inválidos. Tente novamente!');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('WS_ADMIN_AUTHENTICATED');
    setUsername('');
    setPassword('');
  };

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
  };  // Apps Script Complete Code template
  const appsScriptCode = `// Google Apps Script (doPost) para as automações da Wilson Sons
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Adiciona cabeçalhos caso a planilha esteja virgem
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Carimbo de data/hora", 
        "Endereço de e-mail", 
        "1. Nome completo", 
        "2. E-mail", 
        "3. Telefone para contato", 
        "4. Instituição ou Empresa", 
        "5. Perfil do visitante", 
        "6. Quantidade de visitantes", 
        "7. Data desejada para visita", 
        "8. Horário desejado", 
        "9. Objetivo da visita", 
        "10. Observações adicionais", 
        "Coluna 12", 
        "Coluna 13", 
        "Status do E-mail", 
        "Status"
      ]);
    }

    var lastRow = sheet.getLastRow();
    if (data.action === "updateStatus") {
      var idToFind = (data.id || "").toString().trim();
      var newStatus = data.status || "pendente";
      var findName = (data.name || "").toString().trim().toLowerCase();
      var findEmail = (data.email || "").toString().trim().toLowerCase();
      var findTimestamp = (data.timestamp || "").toString().trim();
      
      var range = sheet.getRange(1, 1, lastRow, sheet.getLastColumn());
      var values = range.getDisplayValues(); // getDisplayValues() garante leitura como strings idênticas ao Google Sheets
      var headers = values[0];
      
      var idColIdx = -1;
      var timestampColIdx = -1;
      var statusColIdx = -1;
      var nameColIdx = -1;
      var emailColIdx = -1;
      var obsColIdx = -1;
      var dateColIdx = -1;
      var timeColIdx = -1;
      
      for (var k = 0; k < headers.length; k++) {
        var hName = headers[k].toString().toLowerCase();
        if (hName === "id" || hName === "código" || hName === "codigo") {
          idColIdx = k;
        } else if (hName.indexOf("carimbo") !== -1 || hName.indexOf("timestamp") !== -1 || hName.indexOf("data/hora") !== -1) {
          timestampColIdx = k;
        } else if (hName === "status" || hName === "decisão" || hName === "decisao" || hName === "status da visita" || hName === "situação" || hName === "situacao") {
          statusColIdx = k;
        } else if (hName.indexOf("nome") !== -1) {
          nameColIdx = k;
        } else if (hName.indexOf("e-mail") !== -1 || hName.indexOf("email") !== -1) {
          if (hName.indexOf("endereço") === -1 && hName.indexOf("endereco") === -1) {
            emailColIdx = k;
          }
        } else if (hName.indexOf("observações") !== -1 || hName.indexOf("observacoes") !== -1 || hName.indexOf("observacao") !== -1) {
          obsColIdx = k;
        } else if (hName.indexOf("data") !== -1) {
          dateColIdx = k;
        } else if (hName.indexOf("horário") !== -1 || hName.indexOf("horario") !== -1 || hName.indexOf("turno") !== -1) {
          timeColIdx = k;
        }
      }
      
      // Se não achou de forma alguma, assume a coluna P (16) como Status
      if (statusColIdx === -1) {
        statusColIdx = 15;
      }
      
      var foundRow = -1;
      // Strip de todos os caracteres não-números de forma totalmente segura sem barra invertida (bug-free em template literals)
      var idToFindDigits = idToFind.replace(/[^0-9]/g, "");
      var findTimestampDigits = findTimestamp.replace(/[^0-9]/g, "");
      
      for (var i = 1; i < values.length; i++) {
        var rowId = idColIdx !== -1 ? values[i][idColIdx].toString().trim() : "";
        var rowObs = obsColIdx !== -1 ? values[i][obsColIdx].toString().trim() : "";
        var rowTimestamp = timestampColIdx !== -1 ? values[i][timestampColIdx].toString().trim() : "";
        var rowName = nameColIdx !== -1 ? values[i][nameColIdx].toString().trim().toLowerCase() : "";
        
        // Coleta todos os e-mails possíveis na linha (tanto coluna e-mail automático quanto manual do form)
        var rowEmails = [];
        if (emailColIdx !== -1 && values[i][emailColIdx]) {
          rowEmails.push(values[i][emailColIdx].toString().trim().toLowerCase());
        }
        for (var c = 0; c < values[i].length; c++) {
          var cellVal = values[i][c].toString().toLowerCase();
          if (cellVal.indexOf("@") !== -1 && cellVal.indexOf(".") !== -1) {
            rowEmails.push(cellVal.trim());
          }
        }
        
        var rowIdDigits = rowId.replace(/[^0-9]/g, "");
        var rowObsDigits = rowObs.replace(/[^0-9]/g, "");
        var rowTimestampDigits = rowTimestamp.replace(/[^0-9]/g, "");
        
        // 1. Coincidência por ID ou Observações
        var isIdMatch = false;
        if (idToFind) {
          isIdMatch = (rowId && (rowId === idToFind || rowIdDigits === idToFindDigits)) ||
                      (rowObs && (rowObs === idToFind || rowObsDigits === idToFindDigits));
        }
        
        // 2. Coincidência por dígitos de Timestamp
        var isTimestampMatch = false;
        if (findTimestamp && rowTimestamp) {
          isTimestampMatch = (rowTimestamp === findTimestamp || rowTimestampDigits === findTimestampDigits);
        }
        
        // 3. Coincidência infalível por Nome e E-mail (fallback completo para Google Forms nativo)
        var isDataMatch = false;
        if (findName && rowName && (rowName === findName || rowName.indexOf(findName) !== -1 || findName.indexOf(rowName) !== -1)) {
          if (findEmail) {
            for (var m = 0; m < rowEmails.length; m++) {
              if (rowEmails[m] === findEmail || rowEmails[m].indexOf(findEmail) !== -1 || findEmail.indexOf(rowEmails[m]) !== -1) {
                isDataMatch = true;
                break;
              }
            }
          } else {
            isDataMatch = true;
          }
        }
        
        // 4. Busca por id exato em qualquer coluna da linha
        var matchAnyColumn = false;
        if (idToFind) {
          for (var c = 0; c < values[i].length; c++) {
            var valIdxDisp = values[i][c].toString().trim();
            if (valIdxDisp === idToFind) {
              matchAnyColumn = true;
              break;
            }
          }
        }
        
        if (isIdMatch || isTimestampMatch || isDataMatch || matchAnyColumn) {
          foundRow = i + 1; // linha real (compensar cabeçalho)
          break;
        }
      }
      
      if (foundRow !== -1) {
        sheet.getRange(foundRow, statusColIdx + 1).setValue(newStatus); 
        
        // Se aprovado, pode disparar um e-mail informando a aprovação
        if (newStatus === "aprovado" || newStatus === "rejeitado") {
          // Busca e-mail, nome, data e turno com altíssima resiliência e varredura inteligente
          var targetEmail = emailColIdx !== -1 ? values[foundRow - 1][emailColIdx].toString().trim() : "";
          if (!targetEmail || targetEmail.indexOf("@") === -1) {
            // Varre toda a linha para encontrar qualquer string que se pareça com e-mail válido
            for (var c = 0; c < values[foundRow - 1].length; c++) {
              var valC = values[foundRow - 1][c].toString().trim();
              if (valC.indexOf("@") !== -1 && valC.indexOf(".") !== -1) {
                targetEmail = valC;
                break;
              }
            }
          }
          
          var targetName = nameColIdx !== -1 ? values[foundRow - 1][nameColIdx].toString().trim() : "";
          if (!targetName) {
            targetName = findName ? findName.charAt(0).toUpperCase() + findName.slice(1) : "Visitante";
          }
          
          var targetDate = dateColIdx !== -1 ? values[foundRow - 1][dateColIdx].toString().trim() : "";
          if (!targetDate) {
            // Varre a linha para localizar primeira data em formato dd/mm/aaaa
            for (var c = 0; c < values[foundRow - 1].length; c++) {
              var valC = values[foundRow - 1][c].toString().trim();
              if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(valC)) {
                targetDate = valC;
                break;
              }
            }
          }
          
          var targetTime = timeColIdx !== -1 ? values[foundRow - 1][timeColIdx].toString().trim() : "";
          if (!targetTime) {
            // Varre a linha buscando referências de horário ou turno
            for (var c = 0; c < values[foundRow - 1].length; c++) {
              var valC = values[foundRow - 1][c].toString().toLowerCase();
              if (valC.indexOf("manhã") !== -1 || valC.indexOf("manha") !== -1) {
                targetTime = "Manhã";
                break;
              } else if (valC.indexOf("tarde") !== -1) {
                targetTime = "Tarde";
                break;
              }
            }
          }
 
          try {
            if (targetEmail) {
              if (newStatus === "aprovado") {
                enviarEmailAprovacao(targetEmail, targetName, targetDate, targetTime);
              }
            }
          } catch(eMail) {
            Logger.log("Erro ao enviar e-mail de confirmação: " + eMail.toString());
          }
        }
        
        return ContentService.createTextOutput(JSON.stringify({ 
          success: true, 
          message: "Status atualizado com sucesso!" 
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ 
        success: false, 
        message: "ID não encontrado em nenhuma verificação das linhas da planilha." 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Ação para excluir/remover registro
    if (data.action === "delete") {
      var idToFind = (data.id || "").toString().trim();
      var findName = (data.name || "").toString().trim().toLowerCase();
      var findEmail = (data.email || "").toString().trim().toLowerCase();
      var findTimestamp = (data.timestamp || "").toString().trim();
      
      var range = sheet.getRange(1, 1, lastRow, sheet.getLastColumn());
      var values = range.getDisplayValues(); // getDisplayValues() para compatibilidade total de strings
      var headers = values[0];
      
      var idColIdx = -1;
      var timestampColIdx = -1;
      var nameColIdx = -1;
      var emailColIdx = -1;
      var obsColIdx = -1;
      
      for (var k = 0; k < headers.length; k++) {
        var hName = headers[k].toString().toLowerCase();
        if (hName === "id" || hName === "código" || hName === "codigo") {
          idColIdx = k;
        } else if (hName.indexOf("carimbo") !== -1 || hName.indexOf("timestamp") !== -1 || hName.indexOf("data/hora") !== -1) {
          timestampColIdx = k;
        } else if (hName.indexOf("nome") !== -1) {
          nameColIdx = k;
        } else if (hName.indexOf("e-mail") !== -1 || hName.indexOf("email") !== -1) {
          if (hName.indexOf("endereço") === -1 && hName.indexOf("endereco") === -1) {
            emailColIdx = k;
          }
        } else if (hName.indexOf("observações") !== -1 || hName.indexOf("observacoes") !== -1 || hName.indexOf("observacao") !== -1) {
          obsColIdx = k;
        }
      }
      
      var foundRow = -1;
      var idToFindDigits = idToFind.replace(/[^0-9]/g, "");
      var findTimestampDigits = findTimestamp.replace(/[^0-9]/g, "");
      
      for (var i = 1; i < values.length; i++) {
        var rowId = idColIdx !== -1 ? values[i][idColIdx].toString().trim() : "";
        var rowObs = obsColIdx !== -1 ? values[i][obsColIdx].toString().trim() : "";
        var rowTimestamp = timestampColIdx !== -1 ? values[i][timestampColIdx].toString().trim() : "";
        var rowName = nameColIdx !== -1 ? values[i][nameColIdx].toString().trim().toLowerCase() : "";
        
        var rowEmails = [];
        if (emailColIdx !== -1 && values[i][emailColIdx]) {
          rowEmails.push(values[i][emailColIdx].toString().trim().toLowerCase());
        }
        for (var c = 0; c < values[i].length; c++) {
          var cellVal = values[i][c].toString().toLowerCase();
          if (cellVal.indexOf("@") !== -1 && cellVal.indexOf(".") !== -1) {
            rowEmails.push(cellVal.trim());
          }
        }
        
        var rowIdDigits = rowId.replace(/[^0-9]/g, "");
        var rowObsDigits = rowObs.replace(/[^0-9]/g, "");
        var rowTimestampDigits = rowTimestamp.replace(/[^0-9]/g, "");
        
        // 1. Coincidência por ID ou Observações
        var isIdMatch = false;
        if (idToFind) {
          isIdMatch = (rowId && (rowId === idToFind || rowIdDigits === idToFindDigits)) ||
                      (rowObs && (rowObs === idToFind || rowObsDigits === idToFindDigits));
        }
        
        // 2. Coincidência por dígitos de Timestamp
        var isTimestampMatch = false;
        if (findTimestamp && rowTimestamp) {
          isTimestampMatch = (rowTimestamp === findTimestamp || rowTimestampDigits === findTimestampDigits);
        }
        
        // 3. Coincidência infalível por Nome e E-mail
        var isDataMatch = false;
        if (findName && rowName && (rowName === findName || rowName.indexOf(findName) !== -1 || findName.indexOf(rowName) !== -1)) {
          if (findEmail) {
            for (var m = 0; m < rowEmails.length; m++) {
              if (rowEmails[m] === findEmail || rowEmails[m].indexOf(findEmail) !== -1 || findEmail.indexOf(rowEmails[m]) !== -1) {
                isDataMatch = true;
                break;
              }
            }
          } else {
            isDataMatch = true;
          }
        }
        
        // 4. Qualquer coluna exata
        var matchAnyColumn = false;
        if (idToFind) {
          for (var c = 0; c < values[i].length; c++) {
            var valVal = values[i][c].toString().trim();
            if (valVal === idToFind) {
              matchAnyColumn = true;
              break;
            }
          }
        }
        
        if (isIdMatch || isTimestampMatch || isDataMatch || matchAnyColumn) {
          foundRow = i + 1;
          break;
        }
      }
      
      if (foundRow !== -1) {
        sheet.deleteRow(foundRow);
        return ContentService.createTextOutput(JSON.stringify({ 
          success: true, 
          message: "Registro removido com sucesso!" 
        })).setMimeType(ContentService.MimeType.JSON);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ 
        success: false, 
        message: "ID não encontrado." 
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Envia e-mail antes de salvar para registrar o status do envio com perfeição
    var emailStatus = "Pendente";
    try {
      enviarEmailAutomatizado(data.email, data.name, data.date, data.time);
      emailStatus = "Enviado com Sucesso";
    } catch(errMail) {
      Logger.log("Falha envio de e-mail: " + errMail.toString());
      emailStatus = "Erro de Envio: " + errMail.toString();
    }

    // Padrão: insere nova solicitação respeitando as 16 colunas reais da planilha do formulário Google
    // A: Carimbo de data/hora
    // B: Endereço de e-mail
    // C: 1. Nome completo
    // D: 2. E-mail
    // E: 3. Telefone para contato
    // F: 4. Instituição ou Empresa
    // G: 5. Perfil do visitante
    // H: 6. Quantidade de visitantes
    // I: 7. Data desejada para visita
    // J: 8. Horário desejado
    // K: 9. Objetivo da visita
    // L: 10. Observações adicionais (Onde salvamos o id do registro)
    // M: Coluna 12 (Vazia)
    // N: Coluna 13 (Vazia)
    // O: Status do E-mail
    // P: Status da visita
    var rowData = [
      new Date(), // A
      data.email || "", // B
      data.name || "", // C
      data.email || "", // D
      data.phone || "", // E
      data.institution || "", // F
      data.profile ? data.profile.charAt(0).toUpperCase() + data.profile.slice(1) : "Entusiasta", // G
      data.visitorsCount || 1, // H
      data.date || "", // I
      data.time === 'manha' ? 'Manhã' : 'Tarde', // J
      data.purpose || "", // K
      data.id || "", // L
      "", // M
      "", // N
      emailStatus, // O
      data.status || 'pendente' // P
    ];

    sheet.appendRow(rowData);
    
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

// FORMATAR METICULOSAMENTE DATAS PARA NÃO QUEBRAR
function formatarData(dataStr) {
  if (!dataStr) return "Não informada";
  try {
    if (typeof dataStr === 'object' && dataStr.getTime) {
      return Utilities.formatDate(dataStr, Session.getScriptTimeZone(), "dd/MM/yyyy");
    }
    var dStr = dataStr.toString().trim();
    if (dStr.indexOf("T") !== -1) {
      dStr = dStr.split("T")[0];
    }
    if (dStr.indexOf("-") !== -1) {
      var parts = dStr.split("-");
      if (parts[0].length === 4) { // YYYY-MM-DD
        return parts[2] + "/" + parts[1] + "/" + parts[0];
      }
      return parts.reverse().join("/");
    }
    return dStr;
  } catch (e) {
    return dataStr.toString();
  }
}

function enviarEmailAprovacao(email, nome, dataStr, turno) {
  var assunto = "Wilson Sons - Solicitação de Visita APROVADA! 🎉";
  var dataFormatada = formatarData(dataStr);
  var turnoStr = (turno === 'manha' || (turno && turno.toString().toLowerCase().indexOf('manhã') !== -1)) ? 'Manhã' : 'Tarde';
  
  var corpoHtml = "<h3>Olá, " + nome + "!</h3>" +
    "<p>Temos o prazer de informar que sua solicitação de para visita técnica foi <b>APROVADA</b> pela Wilson Sons!</p>" +
    "<p><b>Detalhes Importantes:</b></p>" +
    "<ul>" +
      "<li><b>Data:</b> " + dataFormatada + "</li>" +
      "<li><b>Turno:</b> " + turnoStr + "</li>" +
    "</ul>" +
    "<p>🛡️ <b>Lembrete de Segurança Crítico:</b></p>" +
    "<p>O uso de <b>EPIs completos</b> (capacete, colete fluorescente e calçado fechado robusto) é mandatório para circulação.</p>" +
    "<p>Lembramos que é expressamente <b>proibido o uso de camisas regata</b> ou shorts.</p>" +
    "<br><p>Atenciosamente,<br><b>Wilson Sons - Coordenação Portuária</b></p>";
    
  MailApp.sendEmail({
    to: email,
    subject: assunto,
    htmlBody: corpoHtml
  });
}

function enviarEmailAutomatizado(email, nome, dataStr, turno) {
  var assunto = "Wilson Sons - Receptação de Solicitação de Visita Técnica";
  var dataFormatada = formatarData(dataStr);
  var turnoStr = (turno === 'manha' || (turno && turno.toString().toLowerCase().indexOf('manhã') !== -1)) ? 'Período Matutino (09h - 11h)' : 'Período Vespertino (14h - 16h)';
  
  var corpoHtml = "<h3>Olá, " + nome + "!</h3>" +
    "<p>Sua solicitação de agendamento de visita técnica para os terminais da Wilson Sons foi registrada.</p>" +
    "<p><b>Detalhes Importantes:</b></p>" +
    "<ul>" +
      "<li><b>Data:</b> " + dataFormatada + "</li>" +
      "<li><b>Turno:</b> " + turnoStr + "</li>" +
    "</ul>" +
    "<p>⚠️ <b>Lembrete de Segurança Imprescindível:</b></p>" +
    "<p>O porte de <b>EPIs completos</b> (capacete, colete fluorescente vísivel e sapato fechado/bota) é obrigatório. " +
    "È expressamente <b>proibida a entrada com camisa regata</b>.</p>" +
    "<p>A análise operacional do terminal entrará em contato para aprovação.</p>" +
    "<br><p>Atenciosamente,<br><b>Wilson Sons - Coordenação Portuária</b></p>";
    
  MailApp.sendEmail({
    to: email,
    subject: assunto,
    htmlBody: corpoHtml
  });
}

// === MENU INTERATIVO NO GOOGLE SHEETS ===
// Cria o menu personalizado quando a planilha é aberta
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🚢 Wilson Sons')
    .addItem('Aprovar Visita da Linha Selecionada', 'aprovarVisitaMenu')
    .addItem('Rejeitar Visita da Linha Selecionada', 'rejeitarVisitaMenu')
    .addToUi();
}

function aprovarVisitaMenu() {
  alterarStatusLinhaSelecionada('aprovado');
}

function rejeitarVisitaMenu() {
  alterarStatusLinhaSelecionada('rejeitado');
}

function alterarStatusLinhaSelecionada(novoStatus) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var range = sheet.getActiveRange();
  if (!range) {
    SpreadsheetApp.getUi().alert('Por favor, selecione uma linha ou célula da visita que deseja alterar.');
    return;
  }
  var row = range.getRow();
  if (row < 2) {
    SpreadsheetApp.getUi().alert('Não é possível alterar a linha de cabeçalho!');
    return;
  }
  
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) lastCol = 16; // fallback de segurança para 16 colunas
  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = values[0];
  
  var statusColIdx = -1;
  for (var k = 0; k < headers.length; k++) {
    var hName = headers[k].toString().toLowerCase();
    if (hName === "status" || hName === "decisão" || hName === "decisao" || hName === "status da visita") {
      statusColIdx = k;
    }
  }
  
  if (statusColIdx === -1) {
    statusColIdx = 15; // coluna P
  }
  
  sheet.getRange(row, statusColIdx + 1).setValue(novoStatus);
  
  // Enviar e-mail caso seja aprovado
  if (novoStatus === 'aprovado') {
    var nameColIdx = -1, emailColIdx = -1, dateColIdx = -1, timeColIdx = -1;
    for (var k = 0; k < headers.length; k++) {
      var h = headers[k].toString().toLowerCase();
      if (h.indexOf("nome") !== -1) nameColIdx = k;
      else if (h.indexOf("e-mail") !== -1 || h.indexOf("email") !== -1) {
        if (h.indexOf("endereço") === -1 && h.indexOf("endereco") === -1) emailColIdx = k;
      }
      else if (h.indexOf("data") !== -1) dateColIdx = k;
      else if (h.indexOf("horário") !== -1 || h.indexOf("horario") !== -1 || h.indexOf("turno") !== -1) timeColIdx = k;
    }
    if (emailColIdx === -1) emailColIdx = 3; 
    if (nameColIdx === -1) nameColIdx = 2;
    
    var rowValues = sheet.getRange(row, 1, 1, lastCol).getValues()[0];
    var targetEmail = rowValues[emailColIdx] || "";
    var targetName = rowValues[nameColIdx] || "";
    var targetDate = dateColIdx !== -1 ? rowValues[dateColIdx] : "";
    var targetTime = timeColIdx !== -1 ? rowValues[timeColIdx] : "";
    
    try {
      if (targetEmail) {
        enviarEmailAprovacao(targetEmail, targetName, targetDate, targetTime);
        SpreadsheetApp.getUi().alert('✓ Visita aprovada e e-mail de notificação enviado para: ' + targetEmail);
      } else {
        SpreadsheetApp.getUi().alert('✓ Visita aprovada com sucesso! (Não há e-mail cadastrado nessa linha)');
      }
    } catch(e) {
      SpreadsheetApp.getUi().alert('Status atualizado na linha, mas com falha no e-mail: ' + e.toString());
    }
  } else {
    SpreadsheetApp.getUi().alert('✓ Status atualizado com sucesso na linha para ' + novoStatus.toUpperCase() + '!');
  }
}

// === GATILHO COMPLEMENTAR AUTOMÁTICO (Caso use Formulários do Google diretamente) ===
// Se você utiliza o Formulário nativo do Google Forms conectado a esta planilha,
// vá em Execuções/Acionadores no Apps Script e adicione um acionador do tipo
// "Ao enviar formulário" direcionado para esta função:
function aoEnviarFormulario(e) {
  try {
    var valores = e.values;
    if (!valores || valores.length < 3) return;
    
    // Mapeamento com base nas colunas da sua planilha:
    // B [1] - Endereço de e-mail (ou campo '2. E-mail' em D [3])
    // C [2] - 1. Nome completo
    // I [8] - 7. Data desejada para visita
    // J [9] - 8. Horário desejado
    var email = valores[1] || valores[3] || "";
    var nome = valores[2] || "Visitante";
    var dataVisita = valores[8] || "";
    var turno = valores[9] || "Manhã";
    
    if (email) {
      enviarEmailAutomatizado(email, nome, dataVisita, turno);
    }
  } catch(err) {
    Logger.log("Erro no disparo ao enviar formulário: " + err.toString());
  }
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

  if (!isAuthenticated) {
    return (
      <div id="admin_login_container" className="w-full flex justify-center py-10">
        <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden text-center">
          <div className="bg-navy-900 px-6 py-8 text-center relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-28 h-28 bg-sky-500/10 rounded-full blur-2xl" />
            <div className="absolute -left-10 -bottom-10 w-28 h-28 bg-sky-500/10 rounded-full blur-2xl" />
            
            <div className="mx-auto w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 mb-4 shadow-inner">
              <Lock className="w-6 h-6 text-sky-400" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">Painel Gestor Wilson Sons</h2>
            <p className="text-[10px] text-sky-200/85 mt-1 uppercase font-mono tracking-widest font-semibold">Autenticação de Segurança</p>
          </div>
          
          <form onSubmit={handleLogin} className="p-6 space-y-5">
            {loginError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl flex items-center space-x-2 border border-rose-100 text-left font-sans animate-bounce">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="space-y-1 text-left">
                <label htmlFor="user_field" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Usuário de Acesso</label>
                <input
                  id="user_field"
                  type="text"
                  required
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all text-slate-800"
                />
              </div>
              
              <div className="space-y-1 text-left">
                <label htmlFor="pass_field" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Senha Operacional</label>
                <input
                  id="pass_field"
                  type="password"
                  required
                  placeholder="••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all text-slate-800"
                />
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-sky-500/20 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Verificar Credenciais</span>
            </button>
            
            <div className="text-center pt-2 border-t border-slate-100">
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400">Credenciais padrão: admin / admin</span>
            </div>
          </form>
        </div>
      </div>
    );
  }

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
        <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center">
          {onRefreshFromSheets && (
            <button
              onClick={onRefreshFromSheets}
              disabled={isLoadingSheets}
              className={`text-xs py-2 px-3.5 rounded-xl font-semibold flex items-center space-x-1.5 transition-all cursor-pointer border ${isLoadingSheets ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-white hover:bg-slate-100 text-navy-900 border-slate-200 active:scale-95'}`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSheets ? 'animate-spin text-sky-500' : 'text-slate-500'}`} />
              <span>{isLoadingSheets ? "Atualizando..." : "Atualizar do Sheets"}</span>
            </button>
          )}

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
            className={`text-xs py-2 px-3.5 rounded-xl font-semibold flex items-center space-x-1.5 transition-all text-white cursor-pointer ${!integrationSettings.appScriptUrl || requests.length === 0 ? 'bg-slate-300 cursor-not-allowed' : 'bg-sky-500 hover:bg-sky-400 active:scale-95'}`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{isSyncing ? "Sincronizando..." : "Enviar p/ Sheets"}</span>
          </button>

          <button
            onClick={handleLogout}
            className="text-xs py-2 px-3.5 rounded-xl font-semibold flex items-center space-x-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 transition-all cursor-pointer active:scale-95"
            title="Sair do painel"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
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

      {/* Main Grid Content (Table in Full Width) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 my-auto items-stretch pt-2">
        
        {/* Main area: Requests List Table and Search */}
        <div className="lg:col-span-12 flex flex-col justify-between bg-white border border-navy-950/5 rounded-2xl p-4 shadow-sm relative">
          
          {sheetError && (
            <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-xl flex items-start space-x-2.5 border border-rose-100 text-left font-sans mb-3 select-text animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
              <div className="flex-1">
                <span className="font-bold block mb-0.5">Aviso de Erro do Google Sheets:</span>
                <span>{sheetError}</span>
              </div>
              {onClearSheetError && (
                <button 
                  onClick={onClearSheetError}
                  className="text-rose-500 hover:text-rose-700 font-bold transition-all px-1 cursor-pointer shrink-0 text-[11px]"
                >
                  Fechar
                </button>
              )}
            </div>
          )}
          
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
          <div className="overflow-x-auto select-text max-h-[500px] scrollbar-none flex-1">
            <table className="min-w-full divide-y divide-slate-100 text-left text-[11px]">
              <thead className="bg-slate-50/75 sticky top-0 font-bold text-navy-800">
                <tr>
                  <th className="px-3 py-2">Candidato</th>
                  <th className="px-3 py-2">Especialidade / Origem</th>
                  <th className="px-3 py-2">Agendamento</th>
                  <th className="px-3 py-2 text-center text-slate-800">Grupo</th>
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
                  filteredRequests.map((req, index) => (
                    <tr key={`${req.id}-${index}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <p className="font-bold text-navy-900 text-xs">{req.name}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{req.email}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="capitalize font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded mr-1.5">{req.profile}</span>
                        <span className="text-gray-500 text-[10px] truncate max-w-[125px] inline-block align-middle">{req.institution}</span>
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

      </div>
    </div>
  );
}
