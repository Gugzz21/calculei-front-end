const BASE_URL = "/api";

export interface CalcRequest {
  valor: number;
  dateInit: string; // YYYY-MM-DD
  dateFim: string;  // YYYY-MM-DD
}

/** Payload shape the Spring Boot backend expects */
interface BackendPayload {
  amount: number;
  startDate: string;
  endDate: string;
}

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

// ─── Correção Monetária ───────────────────────────────────────────────────────
// Map de índice para endpoint
const ENDPOINT_MAP: Record<string, string | null> = {
  ipca:                    "/ipca/calculate/between-dates",
  ipcae:                   "/ipcae/calculate/between-dates",
  igpm:                    "/igpm/calculate/between-dates",
  tr:                      "/tr/calculate/between-dates",
  igpdi:                   "/igpdi/calculate/between-dates",
  cdi:                     "/cdi/calculate/between-dates",
  selic:                   "/selic-mensal/calculate/between-dates",
  semcorrecaomonetaria:    null, // sem correção — devolve valor bruto
  tjrj119602009ipcaeselic: "/selic-mensal/calculate/between-dates",
  tjrj6899:                "/ufirrj/calculate/between-dates", // Endpoint provável no backend
};

// ─── Juros ────────────────────────────────────────────────────────────────────
// Map de índice de juros para endpoint (null = cálculo local)
const JUROS_ENDPOINT_MAP: Record<string, string | null> = {
  selic:         "/selic-mensal/calculate/between-dates",
  cdi:           "/cdi/calculate/between-dates",
  poupancanova:  "/poupanca/nova/calculate/between-dates",
  poupancaantiga:"/poupanca/antiga/calculate/between-dates", // ✅ usando API
  poupanca:      "/poupanca/nova/calculate/between-dates",   // ✅ usando API (nova cobre lógica combinada)
  taxalegal:     null, // Controller Java sem @PostMapping — cálculo local
  codigocivil:   null, // sem endpoint — cálculo local
  especificartaxa: null,
  jurossimples6:   null,
  jurossimples12:  null,
};

// Map de índice para série do BCB
const BCB_SERIES: Record<string, number> = {
  ipca: 433,
  ipcae: 10764,
  igpm: 189,
  tr: 226,
  igpdi: 190,
  selic: 11, // Selic diária para precisão exata
  cdi: 12,   // CDI diário para precisão exata
};

async function fetchFromBcb(
  indice: string,
  req: CalcRequest
): Promise<CalcResponse | null> {
  const bcbSerieId = BCB_SERIES[indice];
  if (!bcbSerieId) return null;

  try {
    const [y1, m1, d1] = req.dateInit.split("-");
    const [y2, m2, d2] = req.dateFim.split("-");
    const dataInicial = `${d1}/${m1}/${y1}`;
    const dataFinal = `${d2}/${m2}/${y2}`;
    
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${bcbSerieId}/dados?formato=json&dataInicial=${dataInicial}&dataFinal=${dataFinal}`;
    
    const res = await fetch(url);
    if (!res.ok) return null;
    
    const data = await res.json();
    let fatorAcumulado = 1;
    for (const item of data) {
      fatorAcumulado *= (1 + parseFloat(item.valor) / 100);
    }
    
    const valorFinal = req.valor * fatorAcumulado;
    const dias = Math.floor((new Date(req.dateFim).getTime() - new Date(req.dateInit).getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      dataInicio: req.dateInit,
      dataFim: req.dateFim,
      dias,
      valorAcumulado: valorFinal,
      valorFinal: valorFinal,
      valueFinal: valorFinal,
      percentualAcumulado: (fatorAcumulado - 1) * 100,
      fatorAcumulado: fatorAcumulado,
      accumulatedFactor: fatorAcumulado,
    };
  } catch (e) {
    console.warn(`Falha ao buscar dados do BCB para a série ${bcbSerieId}`, e);
    return null;
  }
}

// ─── Correção Monetária ───────────────────────────────────────────────────────
export async function calcularIndice(
  indice: string,
  req: CalcRequest
): Promise<CalcResponse | null> {
  // 1. Tentar Banco Central primeiro para os índices conhecidos
  const bcbData = await fetchFromBcb(indice, req);
  if (bcbData) return bcbData;

  const endpoint = ENDPOINT_MAP[indice];
  if (!endpoint) return null; // sem correção monetária

  const payload: BackendPayload = {
    amount: req.valor,
    startDate: req.dateInit,
    endDate: req.dateFim,
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erro na API (${res.status}): ${text}`);
  }

  return res.json();
}

// ─── Juros ────────────────────────────────────────────────────────────────────
export async function calcularJuros(
  indiceJuros: string,
  req: CalcRequest,
  taxaAnual?: number
): Promise<CalcResponse | null> {
  const endpoint = JUROS_ENDPOINT_MAP[indiceJuros];

  // Juros calculados localmente com taxa fixa
  if (endpoint === null || endpoint === undefined) {
    const { valor, dateInit, dateFim } = req;
    const d1 = new Date(dateInit);
    const d2 = new Date(dateFim);
    const dias = Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    const meses = dias / 30;
    let taxaMensal = 0;

    if (
      taxaAnual !== undefined &&
      !isNaN(taxaAnual) &&
      (indiceJuros === "jurossimples6" ||
        indiceJuros === "jurossimples12" ||
        indiceJuros === "especificartaxa")
    ) {
      taxaMensal = taxaAnual / 100 / 12;
    } else {
      if (indiceJuros === "jurossimples6") taxaMensal = 0.005;
      else if (indiceJuros === "jurossimples12") taxaMensal = 0.01;
      else if (indiceJuros === "codigocivil" || indiceJuros === "taxalegal") {
        const corte = new Date("2003-01-10");
        // Código Civil / Taxa Legal: 0,5%/mês até jan/2003, 1%/mês depois
        taxaMensal = d1 < corte ? 0.005 : 0.01;
      }
    }

    const jurosSimples = valor * taxaMensal * meses;
    return {
      dataInicio: dateInit,
      dataFim: dateFim,
      dias,
      valorAcumulado: valor + jurosSimples,
      percentualAcumulado: taxaMensal * meses * 100,
    };
  }

  // 1. Tentar Banco Central primeiro para os índices conhecidos (ex: selic, cdi)
  const bcbData = await fetchFromBcb(indiceJuros, req);
  if (bcbData) {
    // Se for juros com taxa fixa que o BCB não aplica diretamente ou apenas precisamos da taxa acumulada
    return bcbData;
  }

  const payload: BackendPayload = {
    amount: req.valor,
    startDate: req.dateInit,
    endDate: req.dateFim,
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erro na API de juros (${res.status}): ${text}`);
  }

  return res.json();
}

// ─── Helper ───────────────────────────────────────────────────────────────────
export function getValorAtualizado(resp: CalcResponse): number {
  return resp.valorAcumulado ?? resp.valorFinal ?? resp.valueFinal ?? 0;
}

// ─── Histórico por Token ──────────────────────────────────────────────────────

export interface HistoricoPayload {
  data: string;      // YYYY-MM-DD
  token: string;     // UUID gerado no frontend
  json: object;      // dados dos lançamentos serializados
}

/**
 * Salva os dados dos lançamentos no backend vinculados a um token.
 * Endpoint: POST /history/save
 */
export async function salvarHistorico(payload: HistoricoPayload): Promise<void> {
  const res = await fetch(`${BASE_URL}/history/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erro ao salvar histórico (${res.status}): ${text}`);
  }
}

/**
 * Recupera os dados dos lançamentos pelo token.
 * Endpoint: GET /history/findbytoken?token=<token>
 */
export async function buscarPorToken(token: string): Promise<object> {
  const res = await fetch(`${BASE_URL}/history/findbytoken?token=${encodeURIComponent(token)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    if (res.status === 404) throw new Error("Token não encontrado. Verifique e tente novamente.");
    const text = await res.text();
    throw new Error(`Erro ao buscar histórico (${res.status}): ${text}`);
  }

  return res.json();
}
