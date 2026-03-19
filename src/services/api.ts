const BASE_URL = "/api";

export interface CalcRequest {
  valor: number;
  dateInit: string; // YYYY-MM-DD
  dateFim: string;  // YYYY-MM-DD
}

export interface CalcResponse {
  dataInicio: string;
  dataFim: string;
  dias: number;
  valorAcumulado?: number;
  valorFinal?: number;
  percentualAcumulado?: number;
  fatorAcumulado?: number;
}

// Map de índice para endpoint (correção monetária)
const ENDPOINT_MAP: Record<string, string> = {
  ipca: "/ipca/calculate/between-dates",
  ipcae: "/ipcae/calculate/between-dates",
  igpm: "/igpm/calculate/between-dates",
  tr: "/tr/calculate/between-dates",
  inpc: "/inpc/calculate/between-dates",
  igpdi: "/igpdi/calculate/between-dates",
  ipcbr: "/ipcbr/calculate/between-dates",
  cdi: "/cdi/calculate/between-dates",
  selic: "/selic-mensal/calculate/between-dates",
  semcorrecaomonetaria: null as unknown as string,
  tjrj119602009ortnotnbnttrufiripcae: "/ipcae/calculate/between-dates",
  tjrj119602009ipcaeselic: "/selic-mensal/calculate/between-dates",
};

// Map de índice de juros para endpoint
const JUROS_ENDPOINT_MAP: Record<string, string> = {
  selic: "/selic-mensal/calculate/between-dates",
  cdi: "/cdi/calculate/between-dates",
  poupanca: "/poupanca/nova/calculate/between-dates",
  codigocivil: null as unknown as string, // cálculo local
  jurossimples6: null as unknown as string,  // cálculo local
  jurossimples12: null as unknown as string, // cálculo local
};

export async function calcularIndice(
  indice: string,
  req: CalcRequest
): Promise<CalcResponse | null> {
  const endpoint = ENDPOINT_MAP[indice];
  if (!endpoint) return null; // sem correção monetária

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erro na API (${res.status}): ${text}`);
  }

  return res.json();
}

export async function calcularJuros(
  indiceJuros: string,
  req: CalcRequest
): Promise<CalcResponse | null> {
  const endpoint = JUROS_ENDPOINT_MAP[indiceJuros];

  // Juros calculados com taxa fixa localmente
  if (!endpoint) {
    const { valor, dateInit, dateFim } = req;
    const d1 = new Date(dateInit);
    const d2 = new Date(dateFim);
    const dias = Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    const meses = dias / 30;
    let taxaMensal = 0;
    if (indiceJuros === "jurossimples6") taxaMensal = 0.005;
    else if (indiceJuros === "jurossimples12") taxaMensal = 0.01;
    else if (indiceJuros === "codigocivil") {
      const corte = new Date("2003-01-10");
      // Simplificação: usar 1% a.m. (12% a.a.) para período após corte
      taxaMensal = d1 < corte ? 0.005 : 0.01;
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

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erro na API de juros (${res.status}): ${text}`);
  }

  return res.json();
}

export function getValorAtualizado(resp: CalcResponse): number {
  return resp.valorAcumulado ?? resp.valorFinal ?? 0;
}
