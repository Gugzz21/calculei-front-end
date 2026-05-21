// ─── Mapa de Endpoints ────────────────────────────────────────────────────────
//
// Cada entrada mapeia o valor interno do índice ao endpoint Java correspondente.
// null  → sem endpoint Java; usa BCB ou cálculo local.
//
// Legenda de status (dados no BD da instância atual):
//   ✅ 200  → endpoint funcional com dados
//   ⚠️ 500  → endpoint existe mas falta dados no BD → BCB é o fallback

export const CORRECAO_ENDPOINTS: Record<string, string | null> = {
  // ✅ Endpoints Java
  ipca: "/ipca/calculate/between-dates",
  ipcae: "/ipcae/calculate/between-dates",
  igpm: "/igpm/calculate/between-dates",
  igpdi: "/igpdi/calculate/between-dates",
  tr: "/tr/calculate/between-dates",
  tjrj11960: "/tj11960/calculate/between-dates",
  tjrj6899: "/tj6899/calculate/between-dates",
  selic: "/selic/diario/calculate/between-dates",
  cdi: "/cdi/calculate/between-dates",

  // Não há nenhum tipo de correção. 
  semcorrecaomonetaria: null,
};

export const UFIR_ENDPOINTS: Record<string, string | null> = {
  ufir: "/ufir/last-value",
};

export const JUROS_ENDPOINTS: Record<string, string | null> = {
  // ✅ Endpoints Java
  jurossimples6: "/simple-interest/6",
  jurossimples12: "/simple-interest/12",
  codigocivil: "/simple-interest/period",
  codigo: "/simple-interest/period",
  selic: "/selic/diario/calculate/between-dates",
  cdi: "/cdi/calculate/between-dates",
  taxalegal: "/taxalegal/calculate/between-dates",
  poupancanova: "/poupanca/nova/calculate/between-dates",
  poupancaantiga: "/poupanca/antiga/calculate/between-dates",
  poupanca: "/poupanca/antiga-nova/calculate/between-dates",

  // Resolvido dinamicamente pela taxa informada pelo usuário
  especificartaxa: null,
};

/**
 * Séries MENSAIS do BCB (SGS) — sem limite de janela de datas.
 * Fonte: https://www.bcb.gov.br/estatisticas/tabelasespeciais
 */
export const BCB_SERIES: Record<string, number> = {
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
export const BCB_DAILY_SERIES: Record<string, number> = {
  selic: 11,
  cdi: 12,
};
