import type { ReactNode } from "react";

/**
 * Interface base para dados de um lançamento.
 * Usada para unificar o item da lista e o item recuperado do backend.
 */
export interface DetalheJuros {
  indice: string;
  taxa: string;
  dataInicio: string;
  dataFim: string;
  dias: number;
  percentual: number;
  valor: number;
}

export interface BaseLancamento {
  descricao: string;
  descricaoComplementar?: string;
  dataInicial: string;
  dataCalculo: string;
  valorPrincipal: number;
  indiceCorrecao: string;
  valorAtualizado: number;
  dias: number;
  percentualCorrecao: number;
  indiceJuros: string;
  dataInicioJuros: string;
  dataFimJuros: string;
  diasJuros?: number;
  fatorJuros?: number;
  percentualJurosAcumulado?: number;
  juros: number;
  total: number;
  itensJuros?: DetalheJuros[];
}

/**
 * Item de lançamento na lista da aplicação.
 */
export interface LancamentoItem extends BaseLancamento {
  id: number;
  numero?: ReactNode;
}

/**
 * Estado do formulário de entrada.
 */
export interface FormState {
  valor: string; // raw digits string para máscara de moeda
  dataInicial: string;
  dataCalculo: string;
  indiceCorrecao: string;
  tipoCalculo: string;
  descricao: string;
  descricaoComplementar: string;
}

/**
 * Período de juros aplicado a um lançamento.
 */
export interface JurosAplicado {
  id: number;
  indice: string;
  taxa: string; // "12,00"
  dataInicio: string;
  dataFim: string;
  dias: number;
  fator: number;
  percentual: number;
}

/**
 * Estado da configuração de juros.
 */
export interface JurosState {
  enabled: boolean;
  indice: string;
  dataInicio: string;
  dataFim: string;
  taxa: string;
  aplicados: JurosAplicado[];
}

/**
 * Lançamento recuperado via Token (pode ter campos opcionais dependendo da versão do backend)
 */
export interface LancamentoRecuperado extends Partial<BaseLancamento> {
  id?: number;
}

/**
 * Envelope de dados recuperados do backend.
 */
export interface DadosRecuperados {
  geradoEm?: string;
  totalLancamentos?: number;
  lancamentos?: LancamentoRecuperado[];
}
