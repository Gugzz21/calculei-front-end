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
  juros: number;
  total: number;
}

/** Envelope retornado pelo backend (dentro do campo json salvo) */
export interface DadosRecuperados {
  geradoEm?: string;
  totalLancamentos?: number;
  lancamentos?: LancamentoRecuperado[];
}
