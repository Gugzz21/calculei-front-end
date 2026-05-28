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
