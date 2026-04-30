import type { ReactNode } from "react";

// ─── Lançamento ────────────────────────────────────────────────────────────────

export interface LancamentoItem {
  numero: ReactNode;
  id: number;
  descricao: string;
  dataInicial: string;
  valorPrincipal: number;
  dataCalculo: string;
  indiceCorrecao: string;
  valorAtualizado: number;
  dias: number;
  percentualCorrecao: number;
  // Juros
  indiceJuros: string;
  dataInicioJuros: string;
  dataFimJuros: string;
  diasJuros?: number;
  fatorJuros?: number;
  percentualJurosAcumulado?: number;
  juros: number;
  total: number;
}

// ─── Formulário principal ─────────────────────────────────────────────────────

export interface FormState {
  valor: string; // raw digits string
  dataInicial: string;
  dataCalculo: string;
  indiceCorrecao: string;
  tipoCalculo: string;
  descricao: string;
}

// ─── Juros ────────────────────────────────────────────────────────────────────

export interface JurosAplicado {
  id: number;
  indice: string;
  taxa: string;
  dataInicio: string;
  dataFim: string;
  dias: number;
  fator: number;
  percentual: number;
}

export interface JurosState {
  enabled: boolean;
  indice: string;
  dataInicio: string;
  dataFim: string;
  taxa: string; // % a.a. como string para facilitar input decimal PT-BR
  aplicados: JurosAplicado[];
}

// ─── Recuperação por token ────────────────────────────────────────────────────

/** Estrutura de cada lançamento retornado pelo backend via token */
export interface LancamentoRecuperado {
  id?: number;
  descricao: string;
  dataInicial: string;
  dataCalculo: string;
  valorPrincipal: number;
  indiceCorrecao: string;
  valorAtualizado: number;
  dias: number;
  percentualCorrecao: number;
  indiceJuros: string;
  dataInicioJuros?: string;
  dataFimJuros?: string;
  diasJuros?: number;
  fatorJuros?: number;
  percentualJurosAcumulado?: number;
  juros: number;
  total: number;
}

/** Envelope retornado pelo backend (dentro do campo json salvo) */
export interface DadosRecuperados {
  geradoEm?: string;
  totalLancamentos?: number;
  lancamentos?: LancamentoRecuperado[];
}
