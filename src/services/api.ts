// =============================================================================
// api.ts — Camada de comunicação com o backend Java (Spring Boot)
//
// Estratégia de fallback por ordem de prioridade:
//   1. Backend Java  → sempre tentado primeiro
//   2. Banco Central (BCB) → fallback quando o Java não tem dados no BD
//   3. Cálculo local → apenas para "taxa especificada" sem endpoint definido
// =============================================================================

const BACKEND_BASE_URL = "/api";
const BCB_BASE_URL = "https://api.bcb.gov.br/dados/serie";

// ─── Tipos ────────────────────────────────────────────────────────────────────

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
interface BackendPayload {
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

// ─── Mapa de Endpoints ────────────────────────────────────────────────────────
//
// Cada entrada mapeia o valor interno do índice ao endpoint Java correspondente.
// null  → sem endpoint Java; usa BCB ou cálculo local.
//
// Legenda de status (dados no BD da instância atual):
//   ✅ 200  → endpoint funcional com dados
//   ⚠️ 500  → endpoint existe mas falta dados no BD → BCB é o fallback

const CORRECAO_ENDPOINTS: Record<string, string | null> = {
  // ✅ Endpoints Java com dados
  ipcae: "/ipcae/calculate/between-dates",
  tr: "/tr/calculate/between-dates",
  // ⚠️ Endpoints Java sem dados → fallback para BCB
  ipca: "/ipca/calculate/between-dates",
  igpm: "/igpm/calculate/between-dates",
  igpdi: "/igpdi/calculate/between-dates",
  cdi: "/cdi/calculate/between-dates",
  selic: "/selic/mensal/calculate/between-dates",
  tjrj119602009ipcaeselic: "/tj11960/calculate/between-dates",
  tjrj6899: "/tj6899/calculate/between-dates",
  // Sem correção monetária — retorna null intencionalmente
  semcorrecaomonetaria: null,
};

const UFIR_ENDPOINTS: Record<string, string | null> = {
  ufir: "/ufir/last-value",
};

const JUROS_ENDPOINTS: Record<string, string | null> = {
  // ✅ Endpoints Java com dados
  jurossimples6: "/simple-interest/6",
  jurossimples12: "/simple-interest/12",
  codigocivil: "/simple-interest/period",
  codigo: "/simple-interest/period",
  // ⚠️ Endpoints Java sem dados → fallback para BCB
  selic: "/selic/diario/calculate/between-dates",
  cdi: "/cdi/calculate/between-dates",
  taxalegal: "/taxalegal/calculate/between-dates",
  poupancanova: "/poupanca/nova/calculate/between-dates",
  poupancaantiga: "/poupanca/antiga/calculate/between-dates",
  poupanca: "/poupanca/nova/calculate/between-dates",
  // Resolvido dinamicamente pela taxa informada pelo usuário
  especificartaxa: null,
};

/**
 * Séries MENSAIS do BCB (SGS) — sem limite de janela de datas.
 * Fonte: https://www.bcb.gov.br/estatisticas/tabelasespeciais
 */
const BCB_SERIES: Record<string, number> = {
  ipca: 433,
  ipcae: 10764,
  igpm: 189,
  tr: 7811,
  igpdi: 190,
};

/**
 * Séries DIÁRIAS do BCB (SGS).
 * A API do BCB limita consultas diárias a janelas de até 10 anos;
 * por isso são buscadas em múltiplas requisições com janelas menores.
 */
const BCB_DAILY_SERIES: Record<string, number> = {
  selic: 11,
  cdi: 12,
};

/**
 * Índices que vão DIRETAMENTE ao BCB, sem passar pelo Java.
 * Inclui todas as séries mensais e diárias cobertas pelo BCB.
 */
const BCB_DIRECT_INDICES = new Set([
  ...Object.keys(BCB_SERIES),
  ...Object.keys(BCB_DAILY_SERIES),
]);
// ─── Cache ────────────────────────────────────────────────────────────────────
const API_CACHE = new Map<string, CalcResponse>();

function getCacheKey(type: string, indice: string, req: CalcRequest, extra?: string | number): string {
  return `${type}:${indice}:${req.valor}:${req.dateInit}:${req.dateFim}${extra ? `:${extra}` : ""}`;
}

// ─── Funções de Transporte HTTP ───────────────────────────────────────────────

/** Tempo máximo (ms) que aguardamos o Java antes de tentar o BCB */
const BACKEND_TIMEOUT_MS = 3_000;

/**
 * Realiza um POST para um endpoint do backend Java.
 * Aborta automaticamente após BACKEND_TIMEOUT_MS para não bloquear o fallback BCB.
 * Lança Error com mensagem legível se a resposta não for 2xx.
 */
async function postToBackend(endpoint: string, payload: BackendPayload): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

  try {
    const response = await fetch(`${BACKEND_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Backend retornou ${response.status} em ${endpoint}: ${body}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}


/**
 * Converte YYYY-MM-DD para DD/MM/YYYY (formato exigido pela API do BCB).
 */
function toBcbDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * Busca dados de uma série MENSAL do BCB e acumula o fator de correção.
 * Séries mensais não têm limite de janela, podem ser consultadas em qualquer período.
 */
async function fetchMonthlyFromBcb(
  serieId: number,
  req: CalcRequest
): Promise<number | null> {
  const url = `${BCB_BASE_URL}/bcdata.sgs.${serieId}/dados?formato=json&dataInicial=${toBcbDate(req.dateInit)}&dataFinal=${toBcbDate(req.dateFim)}`;
  const response = await fetch(url);
  if (!response.ok) return null;

  const registros: Array<{ data: string; valor: string }> = await response.json();
  if (!Array.isArray(registros) || registros.length === 0) return null;

  // Filtragem para evitar "sobre-correção": 
  // O BCB retorna o índice do mês cheio no dia 01/MM/AAAA.
  // Se o cálculo termina em 2024-05-01, não devemos incluir o índice de Maio (01/05/2024).
  return registros
    .filter(r => {
      const [d, m, y] = r.data.split("/");
      const isoData = `${y}-${m}-${d}`;
      return isoData < req.dateFim;
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
async function fetchDailyFromBcb(
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
async function fetchFromBcb(indice: string, req: CalcRequest): Promise<CalcResponse | null> {
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
function normalizeBackendResponse(
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
    valorFinal,
    valueFinal: valorFinal,
    fatorAcumulado,
    percentualAcumulado,
  };
}

// ─── Utilitário ───────────────────────────────────────────────────────────────

function calcularDias(dateInit: string, dateFim: string): number {
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
function isBackendResponseValida(
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

  // 1. Índices com série BCB → ir direto ao BCB (mais rápido e confiável)
  if (BCB_DIRECT_INDICES.has(indice)) {
    const res = await fetchFromBcb(indice, req);
    if (res) API_CACHE.set(cacheKey, res);
    return res;
  }

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
      // Java falhou → tentar BCB como último recurso
    }
  }

  // 3. Fallback final: BCB
  const resBcb = await fetchFromBcb(indice, req);
  if (resBcb) API_CACHE.set(cacheKey, resBcb);
  return resBcb;
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

  // 1. Índices com série BCB → ir direto ao BCB
  if (BCB_DIRECT_INDICES.has(indice)) {
    const res = await fetchFromBcb(indice, req);
    if (res) API_CACHE.set(cacheKey, res);
    return res;
  }

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

export interface HistoricoPayload {
  /** Data de geração do histórico (YYYY-MM-DD) */
  data: string;
  /** UUID gerado no frontend para identificar a sessão */
  token: string;
  /** Lançamentos serializados para persistência */
  json: object;
}

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
    const response = await fetch(`${BACKEND_BASE_URL}/ufir/value`);
    if (!response.ok) return 0;
    const data = await response.json();
    // O backend pode retornar { value: 4.56 } ou apenas o número
    return typeof data === "number" ? data : (data.value || 0);
  } catch (error) {
    console.error("Erro ao buscar valor da UFIR:", error);
    return 0;
  }
}
