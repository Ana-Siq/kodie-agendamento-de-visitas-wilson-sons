/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CalendarDays, Users, Mail, Phone, Building2, FileText, CheckCircle2, AlertTriangle, ExternalLink, HelpCircle } from 'lucide-react';
import { VisitRequest } from '../types';

interface SchedulingSectionProps {
  onSubmitRequest: (request: Omit<VisitRequest, 'id' | 'createdAt' | 'status'>) => Promise<boolean>;
}

export default function SchedulingSection({ onSubmitRequest }: SchedulingSectionProps) {
  // Form values
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profile, setProfile] = useState<'estudante' | 'profissional' | 'entusiasta'>('estudante');
  const [institution, setInstitution] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState<'manha' | 'tarde'>('manha');
  const [visitorsCount, setVisitorsCount] = useState<number>(1);
  const [purpose, setPurpose] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Status indicators
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showGoogleFormModal, setShowGoogleFormModal] = useState(false);

  // Field validation structures
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Format phone to Brazilian pattern: (XX) XXXXX-XXXX
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 7) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
      value = `(${value}`;
    }
    setPhone(value);
    // clear error
    if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
  };

  const validateForm = () => {
    const tempErrors: { [key: string]: string } = {};

    if (!name.trim() || name.trim().length < 4) {
      tempErrors.name = "Nome completo deve conter pelo menos 4 caracteres.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      tempErrors.email = "E-mail invóluto. Forneça um e-mail válido.";
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      tempErrors.phone = "Número de telefone incompleto. Informe DDD + número.";
    }

    if (profile !== 'entusiasta' && !institution.trim()) {
      tempErrors.institution = `Nome da ${profile === 'estudante' ? 'Instituição de Ensino' : 'Empresa'} é obrigatório.`;
    }

    if (!date) {
      tempErrors.date = "Por favor, selecione a data pretendida.";
    } else {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0,0,0,0);
      if (selectedDate <= today) {
        tempErrors.date = "A data da visita deve ser no futuro.";
      }
      // Warn on weekends but allow or warn
      const day = selectedDate.getUTCDay();
      if (day === 0 || day === 6) {
        tempErrors.date = "Visitas portuárias normais são realizadas apenas em dias úteis.";
      }
    }

    if (visitorsCount < 1) {
      tempErrors.visitorsCount = "Mínimo de 1 visitante.";
    } else if (visitorsCount > 30) {
      tempErrors.visitorsCount = "O limite máximo padrão para visitas em grupo é de 30 pessoas.";
    }

    if (!purpose.trim() || purpose.trim().length < 10) {
      tempErrors.purpose = "Escreva brevemente o objetivo da visita (mín. 10 caracteres).";
    }

    if (!acceptTerms) {
      tempErrors.acceptTerms = "Você deve aceitar as normas de segurança e uso de EPIs.";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    if (!validateForm()) {
      setNotification({
        type: 'error',
        message: 'Por favor, corrija os erros sinalizados no formulário antes de enviar.'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onSubmitRequest({
        name,
        email,
        phone,
        profile,
        institution: profile === 'entusiasta' ? 'N/A (Entusiasta)' : institution,
        date,
        time,
        visitorsCount,
        purpose,
      });

      if (success) {
        setNotification({
          type: 'success',
          message: 'Solicitação registrada com sucesso! A postagem foi armazenada no banco de dados local e está pronta para sincronismo com Google Sheets.'
        });
        // Reset form fields
        setName('');
        setEmail('');
        setPhone('');
        setInstitution('');
        setDate('');
        setPurpose('');
        setAcceptTerms(false);
        setVisitorsCount(1);
      } else {
        throw new Error('Falha ao processar solicitação');
      }
    } catch {
      setNotification({
        type: 'error',
        message: 'Ocorreu um erro ao enviar sua solicitação de agendamento. Tente novamente.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="scheduling_section" className="w-full h-full flex flex-col justify-between py-4 px-6 md:px-12 overflow-y-auto select-none max-w-7xl mx-auto">
      {/* Top Section */}
      <div className="flex justify-between items-center border-b border-navy-800/10 pb-4">
        <div className="flex items-center space-x-2">
          <CalendarDays className="w-6 h-6 text-sky-500" />
          <h2 className="text-lg md:text-xl font-bold font-sans tracking-tight text-navy-900 uppercase">
            Formulário de Agendamento Online
          </h2>
        </div>
        
        {/* Futura Implementação de Formulário Google Trigger */}
        <button
          type="button"
          onClick={() => setShowGoogleFormModal(true)}
          className="text-xs font-mono bg-sky-100 hover:bg-sky-200 text-navy-900 px-3.5 py-1.5 rounded-full border border-sky-200 font-semibold flex items-center space-x-1 cursor-pointer transition-all active:scale-95 shrink-0"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Futuro Formulário Google</span>
        </button>
      </div>

      {/* Grid Layout Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto items-start text-left pt-3">
        
        {/* Left Form Column (Personal / Profile) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-navy-950/5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold font-mono tracking-wider text-navy-600 uppercase border-b border-navy-50 pb-2">
              1. Identificação do Solicitante
            </h3>

            {/* Input Name */}
            <div>
              <label id="lbl_name" className="block text-xs font-semibold text-navy-900 mb-1">Nome Completo</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={e => { setName(e.target.value); if (errors.name) setErrors(p=>({...p, name:''})); }}
                  className={`w-full text-xs border bg-slate-50 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:ring-1 focus:bg-white transition-all ${errors.name ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-sky-500'}`}
                />
              </div>
              {errors.name && <p className="text-[10px] text-red-500 mt-0.5">{errors.name}</p>}
            </div>

            {/* Email & Phone Flex */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label id="lbl_email" className="block text-xs font-semibold text-navy-900 mb-1 flex items-center space-x-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>E-mail de Contato</span>
                </label>
                <input
                  type="email"
                  placeholder="exemplo@email.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); if (errors.email) setErrors(p=>({...p, email:''})); }}
                  className={`w-full text-xs border bg-slate-50 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:ring-1 focus:bg-white transition-all ${errors.email ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-sky-500'}`}
                />
                {errors.email && <p className="text-[10px] text-red-500 mt-0.5">{errors.email}</p>}
              </div>

              <div>
                <label id="lbl_phone" className="block text-xs font-semibold text-navy-900 mb-1 flex items-center space-x-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Celular / WhatsApp</span>
                </label>
                <input
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={handlePhoneChange}
                  className={`w-full text-xs border bg-slate-50 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:ring-1 focus:bg-white transition-all ${errors.phone ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-sky-500'}`}
                />
                {errors.phone && <p className="text-[10px] text-red-500 mt-0.5">{errors.phone}</p>}
              </div>
            </div>

            {/* Profile Selection */}
            <div>
              <label id="lbl_profile" className="block text-xs font-semibold text-navy-900 mb-1.5">Perfil de Visitante</label>
              <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl">
                {(['estudante', 'profissional', 'entusiasta'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => { setProfile(p); if (errors.institution) setErrors(prev => ({ ...prev, institution: '' })); }}
                    className={`py-2 rounded-lg text-[11px] font-bold capitalize transition-all cursor-pointer ${profile === p ? 'bg-navy-900 text-white shadow-sm' : 'text-navy-700 hover:bg-slate-200/50'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Institution / Company name field, dynamic wording based on profile */}
            {profile !== 'entusiasta' && (
              <div>
                <label id="lbl_institution" className="block text-xs font-semibold text-navy-900 mb-1 flex items-center space-x-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{profile === 'estudante' ? "Instituição de Ensino / Curso" : "Empresa / Organização de Origem"}</span>
                </label>
                <input
                  type="text"
                  placeholder={profile === 'estudante' ? "Ex: Universidade Federal do Estado, Escola Técnica" : "Ex: Empresa de Trading, Logística SA"}
                  value={institution}
                  onChange={e => { setInstitution(e.target.value); if (errors.institution) setErrors(p=>({...p, institution:''})); }}
                  className={`w-full text-xs border bg-slate-50 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:ring-1 focus:bg-white transition-all ${errors.institution ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-sky-500'}`}
                />
                {errors.institution && <p className="text-[10px] text-red-500 mt-0.5">{errors.institution}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Right Form Column (Date / Details / Validation feedback) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-navy-950/5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold font-mono tracking-wider text-navy-600 uppercase border-b border-navy-50 pb-2">
              2. Detalhes da Visita Portuária
            </h3>

            {/* Date and Turn selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label id="lbl_date" className="block text-xs font-semibold text-navy-900 mb-1">Data Desejada</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => { setDate(e.target.value); if (errors.date) setErrors(p=>({...p, date:''})); }}
                  className={`w-full text-xs border bg-slate-50 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:ring-1 focus:bg-white transition-all ${errors.date ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-sky-500'}`}
                />
                {errors.date && <p className="text-[10px] text-red-500 mt-0.5">{errors.date}</p>}
              </div>

              <div>
                <label id="lbl_time" className="block text-xs font-semibold text-navy-900 mb-1">Turno Preferencial</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setTime('manha')}
                    className={`py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${time === 'manha' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
                  >
                    Manhã (09h - 11h)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTime('tarde')}
                    className={`py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${time === 'tarde' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
                  >
                    Tarde (14h - 16h)
                  </button>
                </div>
              </div>
            </div>

            {/* Number of Visitors */}
            <div>
              <label id="lbl_visitors" className="block text-xs font-semibold text-navy-900 mb-1 flex items-center space-x-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Nº Total de Integrantes no Grupo</span>
              </label>
              <div className="flex items-center space-x-3 bg-slate-50 p-2 border border-slate-200 rounded-xl w-32">
                <button
                  type="button"
                  onClick={() => setVisitorsCount(p => Math.max(1, p - 1))}
                  className="font-bold text-navy-800 hover:text-sky-500 w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center cursor-pointer active:scale-95"
                >
                  -
                </button>
                <span className="font-mono text-xs font-bold text-navy-900 flex-1 text-center">{visitorsCount}</span>
                <button
                  type="button"
                  onClick={() => setVisitorsCount(p => Math.min(30, p + 1))}
                  className="font-bold text-navy-800 hover:text-sky-500 w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center cursor-pointer active:scale-95"
                >
                  +
                </button>
              </div>
              <p className="text-[10px] text-gray-500 leading-tight mt-1">Limite máximo de 30 pessoas para visita técnica.</p>
              {errors.visitorsCount && <p className="text-[10px] text-red-500 mt-0.5">{errors.visitorsCount}</p>}
            </div>

            {/* Purpose */}
            <div>
              <label id="lbl_purpose" className="block text-xs font-semibold text-navy-900 mb-1 flex items-center space-x-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Objetivo Principal da Visita</span>
              </label>
              <textarea
                rows={2}
                placeholder="Exemplo: Conhecer a automação da movimentação dos contêineres e a integração do modal portuário com rodovias."
                value={purpose}
                onChange={e => { setPurpose(e.target.value); if (errors.purpose) setErrors(p=>({...p, purpose:''})); }}
                className={`w-full text-xs border bg-slate-50 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:ring-1 focus:bg-white transition-all ${errors.purpose ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-sky-500'}`}
              />
              {errors.purpose && <p className="text-[10px] text-red-500 mt-0.5">{errors.purpose}</p>}
            </div>

            {/* Safety terms Checkbox */}
            <div className="pt-1.5">
              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={e => { setAcceptTerms(e.target.checked); if (errors.acceptTerms) setErrors(p=>({...p, acceptTerms:''})); }}
                  className="mt-1 shrink-0 rounded border-slate-300 text-sky-500 focus:ring-sky-500 cursor-pointer"
                />
                <span className="text-[11px] text-gray-600 leading-normal">
                  Declaro que li e compreendo o <strong className="font-semibold text-navy-900">uso obrigatório de EPIs</strong> (capacete, colete, botas) durante toda a visita e a <strong className="font-semibold text-red-600">proibição absoluta de utilizar camisas regata</strong> nas dependências.
                </span>
              </label>
              {errors.acceptTerms && <p className="text-[10px] text-red-500 mt-0.5">{errors.acceptTerms}</p>}
            </div>
          </div>

          {/* Messages Success/Error Notification */}
          {notification && (
            <div className={`p-3.5 rounded-xl border flex items-start space-x-2 text-xs text-left ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              <div className="shrink-0 mt-0.5">
                {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
              </div>
              <p className="leading-tight">{notification.message}</p>
            </div>
          )}

          {/* Submit Action */}
          <button
            id="btn_submit_scheduling"
            type="submit"
            disabled={isSubmitting}
            className={`w-full text-white font-bold text-xs py-3.5 rounded-xl uppercase tracking-wider transition-all cursor-pointer ${isSubmitting ? 'bg-sky-300 cursor-not-allowed' : 'bg-sky-500 hover:bg-sky-400 active:scale-98 shadow-md shadow-sky-500/10'}`}
          >
            {isSubmitting ? "Enviando solicitações..." : "Solicitar Agendamento de Visita"}
          </button>
        </div>

      </form>

      {/* Outer Google Forms Future Implementation Modal Overlay */}
      {showGoogleFormModal && (
        <div className="fixed inset-0 bg-navy-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 transition-opacity">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-navy-900/10 p-6 relative flex flex-col text-left">
            <button
              onClick={() => setShowGoogleFormModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors"
            >
              ✕
            </button>

            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <div className="p-2 bg-sky-100 text-sky-600 rounded-xl">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-navy-900 text-base leading-tight">Implementação de Formulário Google</h3>
                <p className="text-[10px] text-gray-500 font-mono font-medium uppercase tracking-wider">Desenvolvimento Planejado para Futuras Fases</p>
              </div>
            </div>

            <div className="my-4 space-y-3.5 text-xs text-gray-600 leading-relaxed">
              <p>
                O ecossistema planejado para o programa de visitas técnicas inclui a 
                <strong> futura compatibilidade de preenchimento via Google Forms estruturado</strong>.
              </p>
              <p>
                Nesta solução automatizada por low-code, as candidaturas enviadas pelo Google Forms serão direcionadas por gatilhos internos ao mesmo 
                <strong> Google Sheets</strong> configurado no Painel do Gestor deste painel, garantindo um banco de dados centralizado e disparando e-mails por Apps Script.
              </p>
              
              <div className="bg-sky-100/50 border border-sky-100 p-3 rounded-xl flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-navy-900 text-xs text-[11px]">Como funcionará na produção:</p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Ideal para visitas escolares massivas. Os dados alimentam a mesma aba de destino do script, permitindo o controle de status unificado no painel da Wilson Sons.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowGoogleFormModal(false)}
              className="bg-navy-900 hover:bg-navy-850 text-white font-semibold text-xs py-3.5 rounded-xl cursor-pointer transition-colors"
            >
              Entendido e Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
