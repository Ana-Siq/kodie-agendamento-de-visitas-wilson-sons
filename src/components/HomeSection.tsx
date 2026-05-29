/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Anchor, Ship, GraduationCap, Award, Compass, ArrowRight } from 'lucide-react';

interface HomeSectionProps {
  onNavigateToScheduling: () => void;
  onNavigateToSafety: () => void;
}

export default function HomeSection({ onNavigateToScheduling, onNavigateToSafety }: HomeSectionProps) {
  // Hardcoded image path generated earlier for the port terminal
  const heroImageSrc = "/src/assets/images/wilsonsons_terminal_1780092966464.png";

  const objectives = [
    {
      icon: <GraduationCap className="w-6 h-6 text-sky-400" />,
      title: "Imersão Educacional",
      desc: "Estudantes de engenharia, logística e comércio exterior vivenciam as operações portuárias reais de perto."
    },
    {
      icon: <Award className="w-6 h-6 text-sky-450" />,
      title: "Desenvolvimento de Carreira",
      desc: "Profissionais do setor conhecem de perto a infraestrutura avançada e nossas inovações tecnológicas."
    },
    {
      icon: <Compass className="w-6 h-6 text-sky-400" />,
      title: "Fomento ao Setor Portuário",
      desc: "Estreitar o relacionamento com a comunidade técnica de entusiastas e futuros parceiros do ecossistema marítimo."
    }
  ];

  return (
    <div id="home_section" className="w-full h-full flex flex-col justify-between py-4 px-6 md:px-12 select-none overflow-y-auto max-w-7xl mx-auto">
      {/* Top Header / Branding */}
      <div className="flex justify-between items-center border-b border-navy-800/10 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-navy-900 rounded-lg flex items-center justify-center shadow-lg shadow-navy-900/10">
            <Anchor className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-sans tracking-tight text-navy-900 flex items-center">
              WILSON SONS
            </h1>
            <p className="text-[10px] md:text-xs text-navy-600/75 uppercase tracking-widest font-mono font-medium">
              Programa de Visitações Técnicas
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto items-center">
        {/* Text Area */}
        <div className="lg:col-span-7 flex flex-col space-y-5 text-left">
          <span className="text-xs font-semibold text-sky-500 tracking-wider bg-sky-100 w-fit px-3 py-1 rounded-full uppercase">
            Visitas e Portas Abertas
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-navy-900 leading-tight tracking-tight">
            Explore de perto o maior operador de <span className="text-transparent bg-clip-text bg-gradient-to-r from-navy-800 via-sky-500 to-sky-400">logística portuária do Brasil</span>
          </h2>
          <p className="text-sm md:text-base text-gray-600 leading-relaxed max-w-xl">
            Com mais de 180 anos de história, a Wilson Sons conecta o mercado nacional às maiores frotas globais. 
            Nosso programa de visitas oferece uma oportunidade única de conhecer a rotina de rebocadores, terminais modernos e fluxos de comércio exterior avançados.
          </p>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
            <button
              id="btn_safety_rules"
              onClick={onNavigateToSafety}
              className="border border-navy-800/10 hover:border-sky-500/30 text-navy-800 hover:text-sky-500 font-semibold text-sm px-6 py-3.5 rounded-xl bg-white hover:bg-sky-100/10 active:scale-95 transition-all cursor-pointer"
            >
              Regras e EPIs Necessários
            </button>
            <button
              id="btn_schedule_now"
              onClick={onNavigateToScheduling}
              className="bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-sky-500/20 active:scale-95 transition-all flex items-center justify-center space-x-2 group cursor-pointer"
            >
              <span>Agendar Visita online</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            
          </div>
        </div>

        {/* Hero Image Block */}
        <div className="lg:col-span-5 relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-navy-900/10 to-sky-500/5 rounded-3xl" />
          <div className="p-1 rounded-3xl border border-navy-900/5 bg-white shadow-xl max-w-full">
            <img
              src={heroImageSrc}
              alt="Terminal Portuário Wilson Sons Tecon"
              referrerPolicy="no-referrer"
              className="rounded-2xl object-cover w-full h-[220px] md:h-[320px] shadow-inner"
            />
          </div>
          
          <div className="absolute -bottom-4 -left-4 bg-navy-900 text-white p-3.5 rounded-2xl shadow-xl flex items-center space-x-3 max-w-[240px] border border-navy-800/50">
            <div className="p-2.5 bg-navy-850 rounded-lg">
              <Ship className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-mono text-gray-400 tracking-wider">Infraestrutura</p>
              <p className="text-xs font-semibold leading-tight text-white">Soberania logística e inovação constante</p>
            </div>
          </div>
        </div>
      </div>

      {/* Target Audiences and Objectives */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-navy-800/10 pt-5 mt-auto">
        {objectives.map((obj, idx) => (
          <div 
            key={idx} 
            className="flex flex-col space-y-2 p-4 bg-white hover:bg-sky-100/10 rounded-2xl border border-navy-950/5 hover:border-sky-500/10 transition-all hover:shadow-md"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-navy-900 rounded-xl">
                {obj.icon}
              </div>
              <h3 className="text-sm font-bold text-navy-900 tracking-tight">{obj.title}</h3>
            </div>
            <p className="text-xs text-gray-500 leading-normal pl-1">
              {obj.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
