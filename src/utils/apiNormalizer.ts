import type { CalcRequest, CalcResponse } from "../types/api";

// ─── Utilitário ───────────────────────────────────────────────────────────────

export function calcularDias(dateInit: string, dateFim: string): number {
  const d1 = new Date(dateInit).getTime();
  const d2 = new Date(dateFim).getTime();
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
}

/**
 * Detecta respostas Java com aparência de sucesso mas sem dados reais.
 *
 * O backend retorna HTTP 200 com `accumulatedFactor: 0` e o valor final igual
 * ao valor de entrada quando não há dados no banco para o período solicitado.
 * Sem esta verificação, o fallback para o BCB nunca seria acionado.
 */
export function isBackendResponseValida(
  data: Record<string, unknown>,
  req: CalcRequest
): boolean {
  // Fator acumulado zerado = nenhum dado encontrado no BD
  const factor = data.accumulatedFactor ?? data.accumulatedValue ?? data.fatorAcumulado;
  if (factor !== undefined && Number(factor) === 0) return false;

  // Valor final igual ao de entrada = nenhuma correção foi aplicada
  const valorRetornado = data.valueFinal ?? data.finalValue ?? data.valorFinal ?? data.amount;
  if (valorRetornado !== undefined && Number(valorRetornado) === req.valor) return false;

  return true;
}

// ─── Normalização de Resposta ─────────────────────────────────────────────────

/**
 * Normaliza a resposta do backend Java para o CalcResponse padrão do frontend.
 *
 * Cada endpoint Java tem um DTO diferente. Os casos conhecidos são:
 *
 *   /simple-interest/{n} e /simple-interest/period
 *     → { amount: <principal + juros>, startDate, endDate }
 *     → O `amount` já inclui o principal; NÃO há dias nem fator na resposta.
 *
 *   /ipca/…, /tr/…, /selic-mensal/…, etc.
 *     → { finalValue, accumulatedFactor, businessDays, … }
 *
 *   /taxalegal/…
 *     → { accumulatedFactor: <percentual%>, … }  (semântica invertida)
 */
export function normalizeBackendResponse(
  data: Record<string, unknown>,
  req: CalcRequest,
  endpoint: string
): CalcResponse {

  // ── /simple-interest/* ──────────────────────────────────────────────────────
  // Esses endpoints retornam apenas { amount, startDate, endDate }.
  // "amount" é o total acumulado (principal + juros) já calculado pelo Java.
  if (endpoint.includes("/simple-interest/")) {
    const totalAcumulado = (data.amount ?? req.valor) as number;
    const percentualAcumulado = req.valor > 0
      ? ((totalAcumulado / req.valor) - 1) * 100
      : 0;
    const fatorAcumulado = req.valor > 0 ? totalAcumulado / req.valor : 1;

    return {
      dataInicio: req.dateInit,
      dataFim: req.dateFim,
      dias: calcularDias(req.dateInit, req.dateFim), // Java não retorna dias
      valorAcumulado: totalAcumulado,
      valorFinal: totalAcumulado,
      valueFinal: totalAcumulado,
      percentualAcumulado,
      fatorAcumulado,
      accumulatedFactor: fatorAcumulado,
    };
  }

  // ── Endpoints de índice (correção monetária e outros juros) ─────────────────

  // Dias: preferir campo calendário; businessDays como fallback; cálculo local como última saída
  const dias = (data.dias ?? data.businessDays ?? calcularDias(req.dateInit, req.dateFim)) as number;

  // O campo com o valor final varia por endpoint
  const valorFinal = (
    data.valorAcumulado ?? data.valorFinal ?? data.valueFinal
    ?? data.finalValue ?? data.amount
    ?? req.valor
  ) as number;

  // O TaxaLegalController usa `accumulatedFactor` como PERCENTUAL (não fator multiplicativo)
  const ehTaxaLegal = endpoint.includes("/taxalegal/");

  let percentualAcumulado = ehTaxaLegal
    ? (data.accumulatedFactor as number | undefined)
    : (data.percentualAcumulado ?? data.accumulatedPercentage) as number | undefined;

  let fatorAcumulado = ehTaxaLegal
    ? undefined
    : (data.fatorAcumulado ?? data.accumulatedFactor) as number | undefined;

  // Fallback: deriva percentual da variação do valor
  if (percentualAcumulado === undefined && req.valor > 0) {
    percentualAcumulado = ((valorFinal / req.valor) - 1) * 100;
  }

  return {
    dataInicio: req.dateInit,
    dataFim: req.dateFim,
    dias,
    valorAcumulado: valorFinal,
    valorFinal: valorFinal,
    valueFinal: valorFinal,
    fatorAcumulado,
    percentualAcumulado,
  };
}
