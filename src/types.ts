/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface VisitRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  profile: 'estudante' | 'profissional' | 'entusiasta';
  institution: string;
  date: string;
  time: 'manha' | 'tarde';
  visitorsCount: number;
  purpose: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  createdAt: string;
}

export interface IntegrationSettings {
  appScriptUrl: string;
  googleSheetUrl: string;
  syncEnabled: boolean;
}
