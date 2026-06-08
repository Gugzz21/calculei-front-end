import type { CalcRequest, CalcResponse } from "../types/api";
import { BCB_SERIES, BCB_DAILY_SERIES } from "../constants/endpoints";
import { calcularDias } from "../utils/apiNormalizer";

export const BCB_BASE_URL = "https://api.bcb.gov.br/dados/serie";

/**
 * Converte YYYY-MM-DD para DD/MM/YYYY (formato exigido pela API do BCB).
 */
export function toBcbDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * Busca dados de uma série MENSAL do BCB e acumula o fator de correção.
 * Séries mensais não têm limite de janela, podem ser consultadas em qualquer período.
 */
export async function fetchMonthlyFromBcb(
  serieId: number,
  req: CalcRequest
): Promise<number | null> {
  const url = `${BCB_BASE_URL}/bcdata.sgs.${serieId}/dados?formato=json&dataInicial=${toBcbDate(req.dateInit)}&dataFinal=${toBcbDate(req.dateFim)}`;
  const response = await fetch(url);
  if (!response.ok) return null;

  const registros: Array<{ data: string; valor: string }> = await response.json();
  if (!Array.isArray(registros) || registros.length === 0) return null;

  // Filtragem por intervalo de datas:
  // Embora a API do BCB agora filtre os dados do lado do servidor usando dataInicial e dataFinal,
  // mantemos o filtro local para garantir a exclusão estrita da data final (ex: req.dateFim não deve ser inclusa).
  return registros
    .filter(r => {
      const [d, m, y] = r.data.split("/");
      const isoData = `${y}-${m}-${d}`;
      return isoData >= req.dateInit && isoData < req.dateFim;
    })
    .reduce(
      (fator, { valor }) => fator * (1 + parseFloat(valor.replace(",", ".")) / 100),
      1
    );
}

/**
 * Busca dados de uma série MENSAL do BCB e acumula o fator de correção via
 * ACUMULAÇÃO SIMPLES (soma das taxas), conforme metodologia TJ/RJ Lei 11.960.
 *
 * Fórmula: fator = 1 + Σ(taxas mensais) / 100
 *
 * Diferente de fetchMonthlyFromBcb (que usa produto/juros compostos),
 * esta função usa soma simples, que é o método exigido pelo TJ/RJ para a
 * SELIC no período pós-EC 113/2021 (a partir de 01/12/2021).
 *
 * Validado: série BCB 4390 de 01/12/2021 a 01/01/2026 → soma=49,82% → fator=1,4982 (igual ao TJ/RJ).
 */
export async function fetchMonthlySimpleFromBcb(
  serieId: number,
  req: CalcRequest
): Promise<number | null> {
  const url = `${BCB_BASE_URL}/bcdata.sgs.${serieId}/dados?formato=json&dataInicial=${toBcbDate(req.dateInit)}&dataFinal=${toBcbDate(req.dateFim)}`;
  const response = await fetch(url);
  if (!response.ok) return null;

  const registros: Array<{ data: string; valor: string }> = await response.json();
  if (!Array.isArray(registros) || registros.length === 0) return null;

  // Acumulação SIMPLES: Σ taxas (% a.m.) ÷ 100 + 1
  // TJRJ 11.960 exige que o cálculo inclua tanto o mês de início quanto o mês de fim (inclusivo)
  const initMonth = req.dateInit.substring(0, 7); // YYYY-MM
  const fimMonth = req.dateFim.substring(0, 7);   // YYYY-MM

  const somaRates = registros
    .filter(r => {
      const [, m, y] = r.data.split("/");
      const recordMonth = `${y}-${m}`;
      return recordMonth >= initMonth && recordMonth <= fimMonth;
    })
    .reduce((acc, { valor }) => acc + parseFloat(valor.replace(",", ".")), 0);

  if (somaRates === 0) return null;
  return 1 + somaRates / 100;
}

/**
 * Busca dados de uma série DIÁRIA do BCB em janelas de 10 anos (limite da API).
 * Acumula os fatores de cada janela para obter o fator total do período.
 */
export async function fetchDailyFromBcb(
  serieId: number,
  req: CalcRequest
): Promise<number | null> {
  const MAX_YEARS_PER_WINDOW = 9; // usa 9 para ter margem de segurança

  const windows: Array<{ inicio: string; fim: string }> = [];
  let currentDate = new Date(req.dateInit);
  const endDate = new Date(req.dateFim);

  while (currentDate < endDate) {
    const windowEnd = new Date(currentDate);
    windowEnd.setFullYear(windowEnd.getFullYear() + MAX_YEARS_PER_WINDOW);
    if (windowEnd > endDate) windowEnd.setTime(endDate.getTime());

    windows.push({
      inicio: currentDate.toISOString().split("T")[0],
      fim: windowEnd.toISOString().split("T")[0],
    });

    windowEnd.setDate(windowEnd.getDate() + 1);
    currentDate = windowEnd;
  }

  const promessas = windows.map(async (w) => {
    const url = `${BCB_BASE_URL}/bcdata.sgs.${serieId}/dados?formato=json&dataInicial=${toBcbDate(w.inicio)}&dataFinal=${toBcbDate(w.fim)}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const registros: Array<{ valor: string }> = await response.json();
    return Array.isArray(registros) && registros.length > 0 ? registros : null;
  });

  const resultados = await Promise.all(promessas);
  let fatorTotal = 1;
  let encontrouDados = false;

  for (const registros of resultados) {
    if (registros) {
      encontrouDados = true;
      fatorTotal *= registros.reduce(
        (f, { valor }) => f * (1 + parseFloat(valor.replace(",", ".")) / 100),
        1
      );
    }
  }

  return encontrouDados ? fatorTotal : null;
}

/**
 * Busca dados de uma série do BCB (mensal ou diária) e retorna o CalcResponse.
 * Seleciona automaticamente a estratégia de busca correta conforme o tipo da série.
 */
export async function fetchFromBcb(indice: string, req: CalcRequest): Promise<CalcResponse | null> {
  try {
    let fatorAcumulado: number | null = null;

    if (BCB_SERIES[indice]) {
      fatorAcumulado = await fetchMonthlyFromBcb(BCB_SERIES[indice], req);
    } else if (BCB_DAILY_SERIES[indice]) {
      fatorAcumulado = await fetchDailyFromBcb(BCB_DAILY_SERIES[indice], req);
    }

    if (fatorAcumulado === null || fatorAcumulado <= 0) return null;

    const valorFinal = req.valor * fatorAcumulado;
    const dias = calcularDias(req.dateInit, req.dateFim);

    return {
      dataInicio: req.dateInit,
      dataFim: req.dateFim,
      dias,
      valorAcumulado: valorFinal,
      valorFinal,
      valueFinal: valorFinal,
      percentualAcumulado: (fatorAcumulado - 1) * 100,
      fatorAcumulado,
      accumulatedFactor: fatorAcumulado,
    };
  } catch {
    console.warn(`[BCB] Falha ao buscar dados para o índice "${indice}"`);
    return null;
  }
}
