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
  // NOTA: accumulatedFactor no backend é um PERCENTUAL (ex: 0 = 0%, não fator 1.0)
  const factor = data.accumulatedFactor ?? data.accumulatedValue ?? data.fatorAcumulado;
  if (factor !== undefined && Number(factor) === 0) return false;

  // Valor final igual ao de entrada = nenhuma correção foi aplicada
  const valorRetornado =
    data.valueFinal ?? data.finalValue ?? data.valorFinal ?? data.valorAcumulado ?? data.amount;
  if (valorRetornado !== undefined && Number(valorRetornado) === req.valor) return false;

  return true;
}

// ─── Normalização de Resposta ─────────────────────────────────────────────────

/**
 * Normaliza a resposta do backend Java para o CalcResponse padrão do frontend.
 *
 * BUG #3 CORRIGIDO — accumulatedFactor: todos os DTOs do backend Java enviam
 * o percentual acumulado (ex: 26,5 para 26,5%) no campo `accumulatedFactor`,
 * NÃO um fator multiplicativo (que seria 1,265). O campo está mal nomeado no
 * Java. O normalizador anterior tratava este campo como fator multiplicativo,
 * levando a cálculos errados de juros e exibição de percentuais incorretos.
 *
 * A correção unifica o tratamento: `accumulatedFactor` é sempre percentual.
 * O `fatorAcumulado` real é derivado como `1 + percentual / 100`.
 *
 * Mapa de campos por endpoint:
 *
 *   /simple-interest/{n} e /simple-interest/period
 *     → { amount: <principal + juros>, startDate, endDate }
 *     → O `amount` já inclui o principal; NÃO há dias nem fator na resposta.
 *
 *   /ipca/…, /ipcae/…, /igpm/…, /igpdi/…, /cdi/…, /tj11960/…
 *     → { valueFinal, accumulatedFactor (= percentual%), businessDays }
 *
 *   /selic/…, /taxalegal/…, /poupanca/…, /salario/…
 *     → { finalValue, accumulatedFactor (= percentual%), businessDays }
 *
 *   /tr/…, /tj6899/…
 *     → { finalValue, accumulatedValue (= percentual%), businessDays }
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

  // BUG #3 FIX: `accumulatedFactor` e `accumulatedValue` nos DTOs Java são
  // SEMPRE percentuais (ex: 26.5 para 26,5%), não fatores multiplicativos.
  // O código anterior tratava esses campos como fator multiplicativo (1.265),
  // o que causava percentuais absurdos (ex: 2650%) em cálculos de juros.
  // A remoção do case especial para taxalegal unifica o comportamento.
  let percentualAcumulado = (
    data.percentualAcumulado       // Campo se o backend futuramente enviar correto
    ?? data.accumulatedPercentage  // Alias alternativo
    ?? data.accumulatedFactor      // ← É PERCENTUAL no Java (mal nomeado)
    ?? data.accumulatedValue       // ← Usado por TR e TJ6899 (também é percentual)
  ) as number | undefined;

  // Fallback: deriva percentual da variação do valor se não veio explícito
  if ((percentualAcumulado === undefined || percentualAcumulado === 0) && req.valor > 0 && valorFinal !== req.valor) {
    percentualAcumulado = ((valorFinal / req.valor) - 1) * 100;
  }

  // Deriva o fatorAcumulado real (multiplicativo) a partir do percentual
  const fatorAcumulado = percentualAcumulado !== undefined
    ? 1 + percentualAcumulado / 100
    : (req.valor > 0 ? valorFinal / req.valor : 1);

  return {
    dataInicio: req.dateInit,
    dataFim: req.dateFim,
    dias,
    valorAcumulado: valorFinal,
    valorFinal: valorFinal,
    valueFinal: valorFinal,
    fatorAcumulado,
    percentualAcumulado,
    accumulatedFactor: fatorAcumulado, // mantido para compatibilidade
  };
}