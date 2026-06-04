/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CalendarDays, ShieldAlert, Info } from 'lucide-react';
import { VisitRequest } from '../types';

interface SchedulingSectionProps {
  onSubmitRequest?: (request: Omit<VisitRequest, 'id' | 'createdAt' | 'status'>) => Promise<boolean>;
}

export default function SchedulingSection({ }: SchedulingSectionProps) {
  return (
    <div id="scheduling_section" className="w-full h-full flex flex-col justify-between py-4 px-6 md:px-12 select-none max-w-7xl mx-auto flex-1">
      {/* Top Section */}
      <div className="flex justify-between items-center border-b border-navy-800/10 pb-4 mb-4">
        <div className="flex items-center space-x-2">
          <CalendarDays className="w-6 h-6 text-sky-500" />
          <h2 className="text-lg md:text-xl font-bold font-sans tracking-tight text-navy-900 uppercase">
            Formulário de Agendamento Online
          </h2>
        </div>
        
        
      </div>

      {/* Embedded Google Form Container */}
      <div className="w-[75%] mx-auto flex-1 bg-white rounded-2xl border border-navy-950/5 shadow-xs overflow-hidden p-1 flex flex-col min-h-[450px]">
        <iframe
          src="https://docs.google.com/forms/d/e/1FAIpQLSfkpw2Fdg82y1qKgZ8orO3PGhHwm4gRhFfJ_Uk2sxop59MuXQ/viewform?embedded=true"
          className="w-full h-full flex-1 rounded-xl"
          style={{ border: 'none', minHeight: '600px', maxWidth: `750px` }}
          title="Google Forms - Agendamento Wilson Sons"
        >
          Carregando…
        </iframe>
      </div>

      {/* Quick notice footer bar */}
      <div className="mt-4 border-t border-navy-850/5 pt-3.5 flex items-center justify-center space-x-2 text-xs text-slate-500 bg-white/50 rounded-xl p-2.5">
        <ShieldAlert className="w-4 h-4 text-sky-500 shrink-0" />
        <p className="font-medium text-[11px] text-center">
          Declaro que li e compreendo o uso obrigatório de EPIs durante toda a visita e a proibição absoluta de utilizar camisas regata.
        </p>
      </div>
    </div>
  );
}
