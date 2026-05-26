// =============================================================================
// api.ts — Camada de comunicação com o backend Java (Spring Boot) - FACADE
//
// BUGS CORRIGIDOS:
//   #2 — fetchFromBcb nunca era chamado: a função existia em bcbService.ts
//         mas não era importada nem invocada aqui. Índices como IPCA, IGP-M,
//         TR, etc. nunca chegavam ao BCB como fallback → resultado sempre null
//         → percentual exibido = 0%.
//   #4 — URL inconsistente: BACKEND_BASE_URL agora é "/api" (via proxy Vite).
//   #5 — TJ/RJ 11960 usava UFIR-RJ (incorreto). Implementado cálculo híbrido
//         legal: IPCA até 30/11/2021 + SELIC a partir de 01/12/2021 (EC 113/2021).
// =============================================================================

import type { CalcRequest, CalcResponse, HistoricoPayload } from "../types/api";
import { CORRECAO_ENDPOINTS, JUROS_ENDPOINTS, UFIR_ENDPOINTS, BCB_SERIES, BCB_DAILY_SERIES } from "../constants/endpoints";
import { isBackendResponseValida, normalizeBackendResponse, calcularDias } from "../utils/apiNormalizer";
import { BACKEND_BASE_URL, postToBackend } from "./httpClient";

// BUG #2 FIX: importar fetchFromBcb, fetchMonthlyFromBcb, fetchDailyFromBcb
import { fetchFromBcb, fetchMonthlyFromBcb, fetchDailyFromBcb } from "./bcbService";

// Re-exportando tipos para os consumidores que importavam daqui
export type { CalcRequest, CalcResponse, HistoricoPayload } from "../types/api";

// ─── Cache ────────────────────────────────────────────────────────────────────
const API_CACHE = new Map<string, CalcResponse>();

function getCacheKey(type: string, indice: string, req: CalcRequest, extra?: string | number): string {
  return `${type}:${indice}:${req.valor}:${req.dateInit}:${req.dateFim}${extra ? `:${extra}` : ""}`;
}

// ─── Helpers de detecção de série BCB ────────────────────────────────────────
function temSerieBcbMensal(indice: string): boolean {
  return indice in BCB_SERIES;
}

function temSerieBcbDiaria(indice: string): boolean {
  return indice in BCB_DAILY_SERIES;
}

function temSerieBcb(indice: string): boolean {
  return temSerieBcbMensal(indice) || temSerieBcbDiaria(indice);
}

// ─── Cálculo Lei 11.960/2009 (TJ/RJ 11960) ───────────────────────────────────
//
// Metodologia legal conforme EC 113/2021 e jurisprudência do TJRJ:
//   • Até 30/11/2021 : IPCA-E (usamos IPCA pois IPCAE não tem dados no BD)
//   • A partir de 01/12/2021 : Taxa SELIC acumulada (série BCB 11)
//
// O backend Java (/tj11960/…) não possui dados no BD. Por isso este
// cálculo híbrido substitui o antigo fallback UFIR-RJ que era incorreto.

const TJ11960_CORTE = "2021-11-30";
const TJ11960_SELIC_INICIO = "2021-12-01";

/**
 * Calcula a correção monetária conforme a Lei 11.960/2009:
 *   - IPCA (via backend Java) de dataInicio até 30/11/2021
 *   - SELIC diária (via BCB) de 01/12/2021 até dataFim
 * Os dois fatores são multiplicados para obter o fator total do período.
 */
async function calcularTjRj11960(req: CalcRequest): Promise<CalcResponse | null> {
  let fatorIpca = 1;
  let fatorSelic = 1;
  let diasTotal = calcularDias(req.dateInit, req.dateFim);

  // ── Fase 1: IPCA até 30/11/2021 ─────────────────────────────────────────────
  if (req.dateInit < TJ11960_SELIC_INICIO) {
    const fimIpca = req.dateFim < TJ11960_SELIC_INICIO ? req.dateFim : TJ11960_CORTE;
    try {
      const data = await postToBackend("/ipca/calculate/between-dates", {
        amount: req.valor,
        startDate: req.dateInit,
        endDate: fimIpca,
      }) as Record<string, unknown>;

      if (isBackendResponseValida(data, { ...req, dateFim: fimIpca })) {
        const res = normalizeBackendResponse(data, { ...req, dateFim: fimIpca }, "/ipca/calculate/between-dates");
        fatorIpca = res.fatorAcumulado ?? 1;
        console.info(`[TJ11960] Fase IPCA (${req.dateInit} → ${fimIpca}): fator=${fatorIpca.toFixed(6)}`);
      }
    } catch {
      // fallback: IPCA via BCB
      try {
        const f = await fetchMonthlyFromBcb(433, { valor: req.valor, dateInit: req.dateInit, dateFim: fimIpca });
        if (f && f > 0) {
          fatorIpca = f;
          console.info(`[TJ11960] Fase IPCA via BCB (${req.dateInit} → ${fimIpca}): fator=${fatorIpca.toFixed(6)}`);
        }
      } catch { /* sem dados */ }
    }
  }

  // ── Fase 2: SELIC a partir de 01/12/2021 ────────────────────────────────────
  if (req.dateFim > TJ11960_CORTE) {
    const inicioSelic = req.dateInit > TJ11960_CORTE ? req.dateInit : TJ11960_SELIC_INICIO;
    try {
      // Série BCB 11 = SELIC diária
      const f = await fetchDailyFromBcb(11, { valor: req.valor, dateInit: inicioSelic, dateFim: req.dateFim });
      if (f && f > 0) {
        fatorSelic = f;
        console.info(`[TJ11960] Fase SELIC via BCB (${inicioSelic} → ${req.dateFim}): fator=${fatorSelic.toFixed(6)}`);
      }
    } catch { /* sem dados */ }
  }

  const fatorAcumulado = fatorIpca * fatorSelic;
  if (fatorAcumulado === 1) return null; // nenhuma fonte retornou dados úteis

  const valorFinal = req.valor * fatorAcumulado;

  return {
    dataInicio: req.dateInit,
    dataFim: req.dateFim,
    dias: diasTotal,
    valorAcumulado: valorFinal,
    valorFinal,
    valueFinal: valorFinal,
    percentualAcumulado: (fatorAcumulado - 1) * 100,
    fatorAcumulado,
    accumulatedFactor: fatorAcumulado,
  };
}


// ─── API Pública — Correção Monetária ─────────────────────────────────────────

/**
 * Calcula a correção monetária pelo índice informado.
 *
 * Estratégia de fallback em cascata:
 *   1. Tenta o backend Java (fonte primária com dados históricos completos)
 *   2. Se Java falhar E o índice tiver série BCB → tenta a API do BCB
 *   3. Se índice TJ/RJ → tenta tabela local UFIR-RJ
 *   4. Se nenhuma fonte resolver → retorna null (sem correção)
 *
 * Antes desta correção (Bug #2), o passo 2 nunca era executado porque
 * fetchFromBcb não era importado nem chamado, causando o percentual 0%.
 */
export async function calcularIndice(
  indice: string,
  req: CalcRequest
): Promise<CalcResponse | null> {
  // Índice "sem correção monetária" — comportamento esperado
  if (CORRECAO_ENDPOINTS[indice] === null) return null;

  // 0. Checar Cache
  const cacheKey = getCacheKey("indice", indice, req);
  if (API_CACHE.has(cacheKey)) return API_CACHE.get(cacheKey) || null;

  // 1. Tentar backend Java (fonte primária)
  const endpoint = CORRECAO_ENDPOINTS[indice];
  if (endpoint) {
    try {
      const data = await postToBackend(endpoint, {
        amount: req.valor,
        startDate: req.dateInit,
        endDate: req.dateFim,
      }) as Record<string, unknown>;

      if (!isBackendResponseValida(data, req)) {
        throw new Error("Java retornou resposta vazia (sem dados no BD)");
      }

      const res = normalizeBackendResponse(data, req, endpoint);
      API_CACHE.set(cacheKey, res);
      return res;
    } catch {
      // Java falhou → tentar BCB como fallback
      console.warn(`[API] Java falhou para "${indice}" → tentando BCB como fallback`);
    }
  }

  // 2. BUG #2 FIX: Fallback BCB — antes este bloco não existia!
  //    Índices como IPCA, IGPM, TR, IPCAE, IGPDI têm séries no BCB.
  //    Se o Java não tiver dados ou estiver offline, o BCB é consultado.
  if (temSerieBcb(indice)) {
    try {
      console.info(`[BCB] Buscando "${indice}" na API do Banco Central...`);
      const resBcb = await fetchFromBcb(indice, req);
      if (resBcb) {
        API_CACHE.set(cacheKey, resBcb);
        return resBcb;
      }
    } catch {
      console.warn(`[BCB] Falha ao buscar "${indice}" no Banco Central`);
    }
  }

  // 3. Fallback para TJ/RJ 11960: cálculo híbrido IPCA + SELIC conforme Lei 11.960
  if (indice === "tjrj11960") {
    try {
      const resTj = await calcularTjRj11960(req);
      if (resTj) {
        API_CACHE.set(cacheKey, resTj);
        return resTj;
      }
    } catch {
      console.warn("[TJ11960] Cálculo híbrido falhou");
    }
  }

  return null;
}

/**
 * Pré-busca silenciosa do índice de correção.
 * Dispara a requisição em background e guarda no cache.
 * Quando o usuário clicar em "Calcular", o resultado já estará pronto.
 */
export function prefetchIndice(indice: string, req: CalcRequest): void {
  if (!indice || !req.dateInit || !req.dateFim || !req.valor) return;
  if (CORRECAO_ENDPOINTS[indice] === null) return; // sem correção — não precisa buscar
  const cacheKey = getCacheKey("indice", indice, req);
  if (API_CACHE.has(cacheKey)) return; // já está em cache
  // Dispara sem await — resultado vai para o cache quando chegar
  calcularIndice(indice, req).catch(() => { /* silencioso */ });
}

// ─── API Pública — Juros ──────────────────────────────────────────────────────

/**
 * Calcula os juros pelo índice informado.
 *
 * Estratégia:
 *   1. Para `especificartaxa`: constrói o endpoint dinamicamente (índice Java)
 *   2. Tenta Java e faz fallback para BCB se o Java falhar
 *   3. Cálculo local como último recurso para taxas sem endpoint nem série BCB
 */
export async function calcularJuros(
  indice: string,
  req: CalcRequest,
  taxaAnualPercentual?: number
): Promise<CalcResponse | null> {
  // 0. Checar Cache
  const cacheKey = getCacheKey("juros", indice, req, taxaAnualPercentual);
  if (API_CACHE.has(cacheKey)) return API_CACHE.get(cacheKey) || null;

  // 1. Para taxa especificada pelo usuário, o endpoint é dinâmico
  const endpoint = indice === "especificartaxa" && taxaAnualPercentual !== undefined
    ? `/simple-interest/${taxaAnualPercentual}`
    : JUROS_ENDPOINTS[indice];

  // 2. Tentar backend Java
  if (endpoint) {
    try {
      const data = await postToBackend(endpoint, {
        amount: req.valor,
        startDate: req.dateInit,
        endDate: req.dateFim,
      }) as Record<string, unknown>;

      if (!isBackendResponseValida(data, req)) {
        throw new Error("Java retornou resposta vazia (sem dados no BD)");
      }

      const res = normalizeBackendResponse(data, req, endpoint);
      API_CACHE.set(cacheKey, res);
      return res;
    } catch (err: unknown) {
      // Para juros com série BCB, tentar fallback
      if (temSerieBcb(indice)) {
        console.warn(`[API] Java falhou para juros "${indice}" → tentando BCB`);
        try {
          const resBcb = await fetchFromBcb(indice, req);
          if (resBcb) {
            API_CACHE.set(cacheKey, resBcb);
            return resBcb;
          }
        } catch {
          console.warn(`[BCB] Falha ao buscar juros "${indice}"`);
        }
      }
      // Para outros índices sem fallback BCB, propagar o erro
      console.error(`[API] Erro ao calcular juros no Java:`, err);
      throw err;
    }
  }

  // 3. Cálculo local (apenas para taxas sem endpoint e sem série BCB)
  if (taxaAnualPercentual !== undefined && !isNaN(taxaAnualPercentual)) {
    const dias = calcularDias(req.dateInit, req.dateFim);
    const meses = dias / 30;
    const taxaMensal = taxaAnualPercentual / 100 / 12;
    const jurosSimples = req.valor * taxaMensal * meses;
    const percentualAcumulado = taxaMensal * meses * 100;

    const resLocal = {
      dataInicio: req.dateInit,
      dataFim: req.dateFim,
      dias,
      valorAcumulado: req.valor + jurosSimples,
      percentualAcumulado,
      fatorAcumulado: 1 + percentualAcumulado / 100,
    };
    API_CACHE.set(cacheKey, resLocal);
    return resLocal;
  }

  return null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extrai o valor atualizado de uma CalcResponse,
 * independente do campo em que o backend o devolveu.
 */
export function getValorAtualizado(resp: CalcResponse): number {
  return resp.valorAcumulado ?? resp.valorFinal ?? resp.valueFinal ?? 0;
}

// ─── Histórico por Token ──────────────────────────────────────────────────────

/**
 * Salva os lançamentos no backend vinculados a um token de recuperação.
 * Endpoint: POST /history/save
 */
export async function salvarHistorico(payload: HistoricoPayload): Promise<void> {
  const response = await fetch(`${BACKEND_BASE_URL}/history/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Erro ao salvar histórico (${response.status}): ${body}`);
  }
}

/**
 * Recupera os lançamentos previamente salvos pelo token de recuperação.
 * Endpoint: GET /history/findbytoken?token=<token>
 */
export async function buscarPorToken(token: string): Promise<object> {
  const url = `${BACKEND_BASE_URL}/history/findbytoken?token=${encodeURIComponent(token)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    if (response.status === 404) throw new Error("Token não encontrado. Verifique e tente novamente.");
    const body = await response.text();
    throw new Error(`Erro ao buscar histórico (${response.status}): ${body}`);
  }

  return response.json();
}

/**
 * Busca o valor unitário da UFIR no backend.
 */
export async function buscarUfirValue(): Promise<number> {
  try {
    const endpoint = UFIR_ENDPOINTS.ufir || "/ufir/last-value";
    const response = await fetch(`${BACKEND_BASE_URL}${endpoint}`);
    if (!response.ok) return 0;
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return typeof data === "number" ? data : (data.value || 0);
    } catch {
      const num = parseFloat(text);
      return isNaN(num) ? 0 : num;
    }
  } catch (error) {
    console.error("Erro ao buscar valor da UFIR:", error);
    return 0;
  }
}