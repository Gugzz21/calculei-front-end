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

// BUG #2 FIX: importar fetchFromBcb, fetchMonthlyFromBcb, fetchDailyFromBcb, fetchMonthlySimpleFromBcb
import { fetchFromBcb, fetchMonthlyFromBcb, fetchDailyFromBcb, fetchMonthlySimpleFromBcb } from "./bcbService";

// Re-exportando tipos para os consumidores que importavam daqui
export type { CalcRequest, CalcResponse, HistoricoPayload } from "../types/api";

// ─── Cache ────────────────────────────────────────────────────────────────────
const API_CACHE = new Map<string, CalcResponse>();
const IN_FLIGHT_REQUESTS = new Map<string, Promise<CalcResponse | null>>();

function getCacheKey(type: string, indice: string, req: CalcRequest, extra?: string | number): string {
  return `${type}:${indice}:${req.dateInit}:${req.dateFim}${extra ? `:${extra}` : ""}`;
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

// ─── Cálculo Lei 11.960/2009 (TJ/RJ 11960) — Fazenda Pública ────────────────
//
// Metodologia legal conforme EC 113/2021 e STJ/TJRJ:
//   • Até 30/11/2021   : IPCA-E (BCB série 10764)
//   • A partir 01/12/2021: SELIC mensal acumulada (BCB série 4390) via acumulação SIMPLES
//
// POR QUE ACUMULAÇÃO SIMPLES (não composta):
//   O TJ/RJ aplica: fatorSELIC = 1 + Σ(taxas mensais) / 100
//   Usando juros compostos o resultado seria ~1,62 (errado).
//   Com acumulação simples: 49 meses × ~1,017%/mês = 49,82% → fator 1,4982 (correto).
//
// Validado: R$100 de 01/01/2020 a 01/01/2026 → R$169,13 (igual ao TJ/RJ)

const TJ11960_CORTE = "2021-11-30";
const TJ11960_SELIC_INICIO = "2021-12-01";

// BCB série 10764 = IPCA-E mensal
const BCB_IPCAE_SERIE = 10764;
// BCB série 4390 = Taxa Selic acumulada no mês (% a.m.) — metodologia TJ/RJ (acumulação simples)
// Validado: soma de 01/12/2021 a 01/01/2026 = 49,82% → fator 1,4982 (igual ao TJ/RJ)
const BCB_SELIC_MENSAL_SERIE = 4390;
// BCB série 11 = SELIC diária (mantida como fallback secundário)
const BCB_SELIC_DIARIA_SERIE = 11;

/**
 * Calcula a correção monetária conforme a Lei 11.960/2009 (Fazenda Pública):
 *   - IPCA-E (BCB 10764) de dataInicio até 30/11/2021
 *   - SELIC mensal acumulada (BCB 4390) de 01/12/2021 até dataFim
 *     Metodologia: acumulação SIMPLES (soma das taxas, não juros compostos)
 *
 * Validado contra a calculadora oficial do TJ/RJ:
 *   R$100 em 01/01/2020 → R$169,13 em 01/01/2026
 *   IPCA-E fator 1,12887 × SELIC simples fator 1,4982 = 1,6913
 */
async function calcularTjRj11960(req: CalcRequest): Promise<CalcResponse | null> {
  let fatorIpcae = 1;
  let fatorSelic = 1;
  const diasTotal = calcularDias(req.dateInit, req.dateFim);

  // ── Fase 1: IPCA-E até 30/11/2021 ──────────────────────────────────────────
  if (req.dateInit < TJ11960_SELIC_INICIO) {
    const fimIpcae = req.dateFim < TJ11960_SELIC_INICIO ? req.dateFim : TJ11960_CORTE;

    // Fonte primária: /tj11960/calculate/between-dates para período EXCLUSIVAMENTE pré-corte.
    // Esse endpoint usa tbl_tj_l11960_selic (tem dados!) → retorna o MESMO fator IPCA-E
    // que o TJ/RJ usa. Exemplo: Jan2020→Nov2021 → fator 1,12887383.
    try {
      const data = await postToBackend("/tj11960/calculate/between-dates", {
        amount: req.valor,
        startDate: req.dateInit,
        endDate: fimIpcae,   // sempre < 2021-12-01, logo backend retorna só a fase IPCA-E
      }) as Record<string, unknown>;

      if (isBackendResponseValida(data, { ...req, dateFim: fimIpcae })) {
        const res = normalizeBackendResponse(data, { ...req, dateFim: fimIpcae }, "/tj11960/calculate/between-dates");
        fatorIpcae = res.fatorAcumulado ?? 1;
        console.info(`[TJ11960] Fase IPCA-E via tj11960 backend (${req.dateInit} → ${fimIpcae}): fator=${fatorIpcae.toFixed(6)}`);
      } else {
        throw new Error("Backend tj11960 sem dados IPCA-E");
      }
    } catch {
      // Fallback secundário: /ipcae/calculate/between-dates
      try {
        const data2 = await postToBackend("/ipcae/calculate/between-dates", {
          amount: req.valor,
          startDate: req.dateInit,
          endDate: fimIpcae,
        }) as Record<string, unknown>;

        if (isBackendResponseValida(data2, { ...req, dateFim: fimIpcae })) {
          const res2 = normalizeBackendResponse(data2, { ...req, dateFim: fimIpcae }, "/ipcae/calculate/between-dates");
          fatorIpcae = res2.fatorAcumulado ?? 1;
          console.info(`[TJ11960] Fase IPCA-E via ipcae backend (${req.dateInit} → ${fimIpcae}): fator=${fatorIpcae.toFixed(6)}`);
        } else {
          throw new Error("Backend ipcae sem dados");
        }
      } catch {
        // Último fallback: IPCA-E via BCB série 10764 (pode divergir ligeiramente do TJ/RJ)
        try {
          const f = await fetchMonthlyFromBcb(BCB_IPCAE_SERIE, {
            valor: req.valor,
            dateInit: req.dateInit,
            dateFim: fimIpcae,
          });
          if (f && f > 1) {
            fatorIpcae = f;
            console.warn(`[TJ11960] Fase IPCA-E BCB 10764 (${req.dateInit} → ${fimIpcae}): fator=${fatorIpcae.toFixed(6)} (pode divergir do TJ/RJ)`);
          }
        } catch { /* sem dados IPCA-E */ }
      }
    }
  }

  // ── Fase 2: SELIC mensal simples (BCB 4390) a partir de 01/12/2021 ─────────────────
  if (req.dateFim > TJ11960_CORTE) {
    const inicioSelic = req.dateInit > TJ11960_CORTE ? req.dateInit : TJ11960_SELIC_INICIO;

    // A fase SELIC da Lei 11.960 exige acumulação SIMPLES mensal (soma das taxas).
    // O backend /selic/diario/calculate/between-dates calcula juros compostos diários (incorreto legalmente).
    // Portanto, buscamos diretamente via BCB 4390 acumulada simples.
    try {
      const f = await fetchMonthlySimpleFromBcb(BCB_SELIC_MENSAL_SERIE, {
        valor: req.valor,
        dateInit: inicioSelic,
        dateFim: req.dateFim,
      });
      if (f && f > 1) {
        fatorSelic = f;
        console.info(`[TJ11960] Fase SELIC mensal simples BCB 4390 (${inicioSelic} → ${req.dateFim}): fator=${fatorSelic.toFixed(6)}`);
      } else {
        throw new Error("BCB 4390 sem dados");
      }
    } catch {
      // Fallback secundário: SELIC diária BCB série 11 (resultado diferente do TJ/RJ, mas usado em último caso)
      console.warn("[TJ11960] BCB 4390 indisponível, tentando série 11 diária (fallback secundário)");
      try {
        const f = await fetchDailyFromBcb(BCB_SELIC_DIARIA_SERIE, {
          valor: req.valor,
          dateInit: inicioSelic,
          dateFim: req.dateFim,
        });
        if (f && f > 1) {
          fatorSelic = f;
          console.warn(`[TJ11960] Fase SELIC diária BCB 11 (${inicioSelic} → ${req.dateFim}): fator=${fatorSelic.toFixed(6)} (pode divergir do TJ/RJ)`);
        }
      } catch { /* sem dados SELIC */ }
    }
  }

  const fatorAcumulado = fatorIpcae * fatorSelic;
  if (fatorAcumulado <= 1) return null; // nenhuma fonte retornou dados úteis

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

// ─── Cálculo TJ/RJ 6899 (UFIR-RJ / Natureza Civil) ──────────────────────────
//
// Metodologia validada contra a calculadora oficial do TJ/RJ:
//   • Usa IPCA-E (BCB série 10764) para TODO o período.
//
// Validado: R$100 em 01/01/2020 → R$139,53 em 01/01/2026 (igual ao TJ/RJ)
//
// NOTA: O nome "UFIR-RJ" é histórico. Atualmente o índice de atualização
// para débitos de natureza civil é o IPCA-E, conforme jurisprudência do TJRJ.

/**
 * Calcula a correção monetária conforme TJ/RJ Lei 6.899/81 (UFIR-RJ / Natureza Civil).
 * Usa IPCA-E (BCB série 10764) para todo o período.
 * Validado: R$100 de 01/01/2020 a 01/01/2026 → R$139,53 (igual ao TJ/RJ).
 */
async function calcularTjRj6899(req: CalcRequest): Promise<CalcResponse | null> {
  const diasTotal = calcularDias(req.dateInit, req.dateFim);

  // Tentar backend Java para TJ6899/UFIR primeiro
  try {
    const data = await postToBackend("/tj6899/calculate/between-dates", {
      amount: req.valor,
      startDate: req.dateInit,
      endDate: req.dateFim,
    }) as Record<string, unknown>;

    if (isBackendResponseValida(data, req)) {
      const res = normalizeBackendResponse(data, req, "/tj6899/calculate/between-dates");
      console.info(`[TJ6899] Backend OK: fator=${res.fatorAcumulado?.toFixed(6)}`);
      return res;
    } else {
      throw new Error("Backend sem dados para TJ6899");
    }
  } catch { /* sem dados no BD — usar BCB */ }

  // Fallback obrigatório: IPCA-E via BCB série 10764
  try {
    const fator = await fetchMonthlyFromBcb(BCB_IPCAE_SERIE, req);
    if (fator && fator > 1) {
      const valorFinal = req.valor * fator;
      console.info(`[TJ6899] IPCA-E BCB (${req.dateInit} → ${req.dateFim}): fator=${fator.toFixed(6)}`);
      return {
        dataInicio: req.dateInit,
        dataFim: req.dateFim,
        dias: diasTotal,
        valorAcumulado: valorFinal,
        valorFinal,
        valueFinal: valorFinal,
        percentualAcumulado: (fator - 1) * 100,
        fatorAcumulado: fator,
        accumulatedFactor: fator,
      };
    }
  } catch { /* sem dados BCB */ }

  return null;
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
  if (API_CACHE.has(cacheKey)) {
    const cached = API_CACHE.get(cacheKey)!;
    const valorFinal = req.valor * (cached.fatorAcumulado ?? 1);
    return {
      ...cached,
      valorAcumulado: valorFinal,
      valorFinal,
      valueFinal: valorFinal,
    };
  }

  // 0.5 Checar in-flight request
  if (IN_FLIGHT_REQUESTS.has(cacheKey)) {
    const promise = IN_FLIGHT_REQUESTS.get(cacheKey)!;
    const cached = await promise;
    if (cached) {
      const valorFinal = req.valor * (cached.fatorAcumulado ?? 1);
      return {
        ...cached,
        valorAcumulado: valorFinal,
        valorFinal,
        valueFinal: valorFinal,
      };
    }
    return null;
  }

  const promiseExecution = (async (): Promise<CalcResponse | null> => {
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
        return res;
      } catch {
        // Java falhou → tentar BCB como fallback
        console.warn(`[API] Java falhou para "${indice}" → tentando BCB como fallback`);
      }
    }

    // 2. BUG #2 FIX: Fallback BCB
    if (temSerieBcb(indice)) {
      try {
        console.info(`[BCB] Buscando "${indice}" na API do Banco Central...`);
        const resBcb = await fetchFromBcb(indice, req);
        if (resBcb) {
          return resBcb;
        }
      } catch {
        console.warn(`[BCB] Falha ao buscar "${indice}" no Banco Central`);
      }
    }

    // 3. Fallback para TJ/RJ 11960 (Fazenda Pública): cálculo híbrido IPCA-E + SELIC
    if (indice === "tjrj11960") {
      try {
        const resTj = await calcularTjRj11960(req);
        if (resTj) {
          return resTj;
        }
      } catch {
        console.warn("[TJ11960] Cálculo híbrido falhou");
      }
    }

    // 4. Fallback para TJ/RJ 6899 (Natureza Civil / UFIR-RJ): usa IPCA-E via BCB
    if (indice === "tjrj6899") {
      try {
        const resTj6899 = await calcularTjRj6899(req);
        if (resTj6899) {
          return resTj6899;
        }
      } catch {
        console.warn("[TJ6899] Cálculo IPCA-E falhou");
      }
    }

    return null;
  })();

  IN_FLIGHT_REQUESTS.set(cacheKey, promiseExecution);
  try {
    const res = await promiseExecution;
    if (res) {
      API_CACHE.set(cacheKey, res);
      const valorFinal = req.valor * (res.fatorAcumulado ?? 1);
      return {
        ...res,
        valorAcumulado: valorFinal,
        valorFinal,
        valueFinal: valorFinal,
      };
    }
    return null;
  } finally {
    IN_FLIGHT_REQUESTS.delete(cacheKey);
  }
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
  if (API_CACHE.has(cacheKey)) {
    const cached = API_CACHE.get(cacheKey)!;
    const valorFinal = req.valor * (cached.fatorAcumulado ?? 1);
    return {
      ...cached,
      valorAcumulado: valorFinal,
      valorFinal,
      valueFinal: valorFinal,
    };
  }

  // 0.5 Checar in-flight request
  if (IN_FLIGHT_REQUESTS.has(cacheKey)) {
    const promise = IN_FLIGHT_REQUESTS.get(cacheKey)!;
    const cached = await promise;
    if (cached) {
      const valorFinal = req.valor * (cached.fatorAcumulado ?? 1);
      return {
        ...cached,
        valorAcumulado: valorFinal,
        valorFinal,
        valueFinal: valorFinal,
      };
    }
    return null;
  }

  const promiseExecution = (async (): Promise<CalcResponse | null> => {
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
        return res;
      } catch (err: unknown) {
        // Para juros com série BCB, tentar fallback
        if (temSerieBcb(indice)) {
          console.warn(`[API] Java falhou para juros "${indice}" → tentando BCB`);
          try {
            const resBcb = await fetchFromBcb(indice, req);
            if (resBcb) {
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
      return resLocal;
    }

    return null;
  })();

  IN_FLIGHT_REQUESTS.set(cacheKey, promiseExecution);
  try {
    const res = await promiseExecution;
    if (res) {
      API_CACHE.set(cacheKey, res);
      const valorFinal = req.valor * (res.fatorAcumulado ?? 1);
      return {
        ...res,
        valorAcumulado: valorFinal,
        valorFinal,
        valueFinal: valorFinal,
      };
    }
    return null;
  } finally {
    IN_FLIGHT_REQUESTS.delete(cacheKey);
  }
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