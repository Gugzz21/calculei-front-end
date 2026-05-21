// =============================================================================
// api.ts — Camada de comunicação com o backend Java (Spring Boot) - FACADE
//
// Esta camada agora atua como uma fachada (Facade). A lógica interna foi 
// dividida em arquivos menores (types, constants, utils, httpClient, bcbService).
// =============================================================================

import type { CalcRequest, CalcResponse, HistoricoPayload } from "../types/api";
import { CORRECAO_ENDPOINTS, JUROS_ENDPOINTS, UFIR_ENDPOINTS } from "../constants/endpoints";
import { UFIR_RJ_HISTORICO } from "../constants/tabelaUfirRj";
import { isBackendResponseValida, normalizeBackendResponse, calcularDias } from "../utils/apiNormalizer";
import { BACKEND_BASE_URL, postToBackend } from "./httpClient";
import { fetchFromBcb } from "./bcbService";

// Re-exportando tipos para os consumidores que importavam daqui
export type { CalcRequest, CalcResponse, HistoricoPayload } from "../types/api";

// ─── Cache ────────────────────────────────────────────────────────────────────
const API_CACHE = new Map<string, CalcResponse>();

function getCacheKey(type: string, indice: string, req: CalcRequest, extra?: string | number): string {
  return `${type}:${indice}:${req.valor}:${req.dateInit}:${req.dateFim}${extra ? `:${extra}` : ""}`;
}

// ─── Fallback Local TJ/RJ ─────────────────────────────────────────────────────

/**
 * Fallback local para índices do Tribunal de Justiça do Rio de Janeiro.
 * Utiliza a tabela histórica da UFIR-RJ para corrigir os valores quando o backend Java falhar.
 */
function fetchFromTjRjLocal(req: CalcRequest): CalcResponse | null {
  const anoInit = req.dateInit.split("-")[0];
  const anoFim = req.dateFim.split("-")[0];

  const ufirInit = UFIR_RJ_HISTORICO[anoInit];
  const ufirFim = UFIR_RJ_HISTORICO[anoFim];

  if (!ufirInit || !ufirFim) {
    console.warn(`[TJ-RJ] Sem dados locais de UFIR para os anos ${anoInit} ou ${anoFim}`);
    return null;
  }

  const fatorAcumulado = ufirFim / ufirInit;
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
}


// ─── API Pública — Correção Monetária ─────────────────────────────────────────

/**
 * Calcula a correção monetária pelo índice informado.
 *
 * Estratégia:
 *   1. Se o índice tem série BCB: vai DIRETO ao BCB (Java não tem dados populados)
 *   2. Caso contrário: tenta Java e faz fallback para BCB se o Java falhar
 *   3. Se `semcorrecaomonetaria`: retorna null (sem correção)
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


  // 2. Tentar backend Java (TJ/RJ e outros sem série BCB)
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
      // Java falhou → será tratado no fallback abaixo
      console.warn(`[API] Fallback ativado para o índice: ${indice}`);
    }
  }

  // 3. Fallback final: TJRJ Local ou BCB
  let resFallback: CalcResponse | null = null;
  
  if (indice.startsWith("tj")) {
    resFallback = fetchFromTjRjLocal(req);
  } else {
    resFallback = await fetchFromBcb(indice, req);
  }

  if (resFallback) API_CACHE.set(cacheKey, resFallback);
  return resFallback;
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
 *   1. Se o índice tem série BCB: vai DIRETO ao BCB
 *   2. Para `especificartaxa`: constrói o endpoint dinamicamente (índice Java)
 *   3. Tenta Java e faz fallback para BCB se o Java falhar
 *   4. Cálculo local como último recurso para taxas sem endpoint nem série BCB
 */
export async function calcularJuros(
  indice: string,
  req: CalcRequest,
  taxaAnualPercentual?: number
): Promise<CalcResponse | null> {
  // 0. Checar Cache
  const cacheKey = getCacheKey("juros", indice, req, taxaAnualPercentual);
  if (API_CACHE.has(cacheKey)) return API_CACHE.get(cacheKey) || null;


  // 2. Para taxa especificada pelo usuário, o endpoint é dinâmico
  const endpoint = indice === "especificartaxa" && taxaAnualPercentual !== undefined
    ? `/simple-interest/${taxaAnualPercentual}`
    : JUROS_ENDPOINTS[indice];

  // 3. Tentar backend Java
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
      // Java falhou ou sem dados → tentar BCB
    }
  }

  // 4. Fallback: BCB (cobre selic, cdi caso não estejam em BCB_DIRECT_INDICES)
  const bcbData = await fetchFromBcb(indice, req);
  if (bcbData) {
    API_CACHE.set(cacheKey, bcbData);
    return bcbData;
  }

  // 5. Cálculo local (apenas para taxas sem endpoint e sem série BCB)
  if (taxaAnualPercentual !== undefined && !isNaN(taxaAnualPercentual)) {
    const dias = calcularDias(req.dateInit, req.dateFim);
    const meses = dias / 30;
    const taxaMensal = taxaAnualPercentual / 100 / 12;
    const jurosSimples = req.valor * taxaMensal * meses;

    const resLocal = {
      dataInicio: req.dateInit,
      dataFim: req.dateFim,
      dias,
      valorAcumulado: req.valor + jurosSimples,
      percentualAcumulado: taxaMensal * meses * 100,
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
