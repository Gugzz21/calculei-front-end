/** Parâmetros comuns de entrada para qualquer cálculo de atualização/juros */
export interface CalcRequest {
  /** Valor principal em reais */
  valor: number;
  /** Data de início no formato YYYY-MM-DD */
  dateInit: string;
  /** Data de fim no formato YYYY-MM-DD */
  dateFim: string;
}

/** Payload esperado pelo Spring Boot em todos os endpoints POST */
export interface BackendPayload {
  amount: number;
  startDate: string;
  endDate: string;
}

/** Resposta normalizada entregue a todos os consumidores do frontend */
export interface CalcResponse {
  dataInicio: string;
  dataFim: string;
  dias: number;
  valorAcumulado?: number;
  valorFinal?: number;
  valueFinal?: number;
  percentualAcumulado?: number;
  fatorAcumulado?: number;
  accumulatedFactor?: number;
}

export interface HistoricoPayload {
  /** Data de geração do histórico (YYYY-MM-DD) */
  data: string;
  /** UUID gerado no frontend para identificar a sessão */
  token: string;
  /** Lançamentos serializados para persistência */
  json: object;
}
