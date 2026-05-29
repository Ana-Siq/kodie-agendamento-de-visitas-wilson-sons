/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, Info, XCircle, AlertTriangle, Eye, Footprints, ShieldAlert, Check } from 'lucide-react';

interface SafetySectionProps {
  onNavigateToScheduling: () => void;
}

export default function SafetySection({ onNavigateToScheduling }: SafetySectionProps) {
  // Hardcoded image path generated earlier for safety regulations guide
  const safetyImageSrc = "/src/assets/images/safety_epi_guide_1780092986181.png";

  const epis = [
    {
      id: "epi_head",
      icon: <span className="text-xl">🪖</span>,
      name: "Capacete de Segurança",
      description: "Proteção obrigatória contra impactos e queda de objetos suspensos durante a circulação nos cais.",
      tag: "Classe B"
    },
    {
      id: "epi_vest",
      icon: <span className="text-xl">🦺</span>,
      name: "Colete Refletivo Fluorescente",
      description: "Item vital de alta visibilidade para identificação imediata pelas frotas de equipamentos pesados do porto.",
      tag: "Padrão ABNT"
    },
    {
      id: "epi_footwear",
      icon: <span className="text-xl">🥾</span>,
      name: "Bota de Segurança de Couro",
      description: "Calçado com revestimento reforçado e biqueira protetora para evitar esmagamentos e escorregamentos.",
      tag: "C.A. Ativo"
    },
    {
      id: "epi_eyes",
      icon: <span className="text-xl">🥽</span>,
      name: "Óculos de Proteção",
      description: "Barreira contra partículas em suspensão, ventos fortes característicos do mar e luminosidade intensa.",
      tag: "Lentes UV"
    }
  ];

  return (
    <div id="safety_section" className="w-full h-full flex flex-col justify-between py-4 px-6 md:px-12 overflow-y-auto select-none max-w-7xl mx-auto">
      {/* Upper header */}
      <div className="flex justify-between items-center border-b border-navy-800/10 pb-4">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-6 h-6 text-sky-500" />
          <h2 className="text-lg md:text-xl font-bold font-sans tracking-tight text-navy-900 uppercase">
            Normas de Segurança de Acesso
          </h2>
        </div>
        <div className="text-xs font-mono bg-amber-100 text-amber-800 px-3 py-1 rounded-full border border-amber-200 font-semibold flex items-center space-x-1">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span>Área Industrial Segura</span>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto items-stretch">
        
        {/* Left Column: EPI Card List */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-4">
          <div className="text-left">
            <span className="text-xs font-bold text-amber-600 bg-amber-50 uppercase border border-amber-100 px-2.5 py-1 rounded-md">
              Aviso Importante aos Visitantes
            </span>
            <h3 className="text-2xl md:text-3xl font-extrabold text-navy-900 mt-2 tracking-tight">
              O uso de Equipamento de Proteção Individual (EPI) é obrigatório
            </h3>
            <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
              O ambiente portuário possui tráfego de cargas pesadas e guindastes. Por lei e segurança pessoal, todo visitante deve estar equipado adequadamente durante 100% da permanência.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {epis.map((epi) => (
              <div 
                key={epi.id} 
                id={epi.id}
                className="p-3.5 bg-white border border-navy-950/5 hover:border-sky-500/10 rounded-xl flex space-x-3 shadow-sm hover:shadow-md transition-all text-left group"
              >
                <div className="w-10 h-10 shrink-0 bg-navy-100/50 group-hover:bg-sky-100 rounded-xl flex items-center justify-center text-xl transition-colors">
                  {epi.icon}
                </div>
                <div className="flex flex-col">
                  <div className="flex justify-between items-baseline">
                    <h4 className="text-xs font-bold text-navy-900 tracking-tight">{epi.name}</h4>
                    <span className="text-[9px] font-mono font-medium text-sky-500 bg-sky-100 px-1 py-0.25 rounded">{epi.tag}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-normal mt-1">{epi.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Poster Display & Prohibition Warning */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          
          {/* Main Visual Poster from Generate Image tool */}
          <div className="relative border border-navy-900/5 rounded-2xl bg-white p-1 shadow-md">
            <img
              src={safetyImageSrc}
              alt="Placa e Diretrizes Técnicas de EPI"
              referrerPolicy="no-referrer"
              className="rounded-xl w-full h-[150px] object-cover"
            />
            <div className="absolute top-3 right-3 bg-navy-900/80 backdrop-blur-xs text-white text-[10px] font-mono py-1 px-2.5 rounded-full border border-white/20">
              Guia Técnico
            </div>
          </div>

          {/* RED ZONE: Proibição de Regatas */}
          <div className="bg-red-50/90 border border-red-200 p-4 rounded-2xl text-left shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 bg-red-105 rounded-full flex items-center justify-center translate-x-2 -translate-y-2 select-none opacity-5">
              <span className="text-7xl font-bold">🚫</span>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-red-100 text-red-600 rounded-xl shrink-0 mt-0.5">
                <XCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-extrabold text-red-900 tracking-tight flex items-center">
                  PROIBIÇÃO RIGOROSA: Camisas Regatas
                </h4>
                <p className="text-xs text-red-700/90 leading-relaxed mt-1">
                  É terminantemente <strong className="font-extrabold text-red-900">PROIBIDO</strong> o acesso de visitantes trajando camisa regata (sem mangas), vestimentas rasgadas, bermudas de banho ou chinelos.
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2.5 text-[11px] text-red-900/80 font-medium">
                  <div className="flex items-center space-x-1">
                    <span className="text-red-500 font-bold">✓</span>
                    <span>Camisa com manga obrigatória</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-red-500 font-bold">✓</span>
                    <span>Calça comprida obrigatória</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-red-500 font-bold">✗</span>
                    <span>Sem regatas ou decotes</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-red-500 font-bold">✗</span>
                    <span>Sem chinelos / sandálias</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            id="btn_safety_understand"
            onClick={onNavigateToScheduling}
            className="w-full bg-navy-900 hover:bg-navy-850 text-white font-semibold text-xs py-3 rounded-xl shadow-md cursor-pointer transition-all hover:shadow-lg flex items-center justify-center space-x-2"
          >
            <Check className="w-4 h-4 text-sky-400" />
            <span>Compreendo todas as regras, ir para Agendamento</span>
          </button>
        </div>

      </div>

      {/* Quick notice footer bar */}
      <div className="mt-4 border-t border-navy-850/5 pt-3.5 flex items-center justify-center space-x-2 text-xs text-slate-500 bg-white/50 rounded-xl p-2.5">
        <Info className="w-4 h-4 text-sky-500 shrink-0" />
        <p className="font-medium text-[11px]">
          O não cumprimento do porte de vestimentas regulamentares impedirá a entrada no terminal, mesmo com agendamento aprovado.
        </p>
      </div>
    </div>
  );
}
