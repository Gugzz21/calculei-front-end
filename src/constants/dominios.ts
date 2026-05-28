// ─── Tipo de Cálculo ──────────────────────────────────────────────────────────

export const TIPO_CALCULO_OPCOES = [
  { value: "cdparticular", label: "Créditos / Débitos Entre Particulares" },
  { value: "cfazenda", label: "Créditos da Fazenda Pública" },
  { value: "dfazendatributario", label: "Débitos da Fazenda Pública - Tributários" },
  { value: "dfazendanaotributario", label: "Débitos da Fazenda Pública - Não Tributários" },
  { value: "previdenciario", label: "Débitos Previdenciários" },
  { value: "precatoriostributario", label: "Precatórios - Tributários" },
  { value: "precatoriosnaotributario", label: "Precatórios - Não Tributários" },
  { value: "multadiaria", label: "Multa diária" },
  { value: "abatimentos", label: "Abatimentos" },
] as const;

/** Mapeamento tipo de cálculo → índice de correção pré-selecionado */
export const TIPO_CALCULO_INDICE_MAP: Record<string, string> = {
  dfazendatributario:    "selic",
  dfazendanaotributario: "tjrj11960",
  abatimentos:           "semcorrecaomonetaria",
  cdparticular:          "tjrj6899",   // Natureza Civil → TJ/RJ 6899 (UFIR-RJ)
  cfazenda:              "tjrj11960",  // Fazenda Pública → TJ/RJ 11960
};

/**
 * Índices de correção monetária que NÃO devem aparecer para cada tipo de cálculo.
 * Ex: TJ/RJ 11960 (Fazenda Pública) não se aplica a Créditos/Débitos entre Particulares.
 */
export const TIPO_CALCULO_INDICE_EXCLUIDOS: Record<string, string[]> = {
  cdparticular: ["tjrj11960"], // Natureza Civil não usa Lei 11.960 (Fazenda Pública)
};

// ─── Índice de Correção Monetária ─────────────────────────────────────────────

/** Label de exibição para cada índice de correção monetária */
export const INDICE_LABEL: Record<string, string> = {
  ipcae: "IPCA-E",
  igpm: "IGP-M",
  tr: "TR",
  igpdi: "IGP-DI",
  ipca: "IPCA",
  cdi: "CDI",
  selic: "SELIC",
  semcorrecaomonetaria: "SEM CORREÇÃO MONETÁRIA",
  tjrj11960: "TJRJ 11.960/2009",
  tjrj6899: "TJ/RJ Lei 6.899/81 (UFIR-RJ)",
};

/**
 * Converte os enums retornados pelo backend Java (GET /index-name/monetary-correction)
 * nos valores de chave usados internamente no frontend.
 */
export const MONETARY_CORRECTION_JAVA_MAP: Record<string, string> = {
  CDI: "cdi",
  SELIC: "selic",
  IPCA: "ipca",
  IPCA_E: "ipcae",
  IGP_DI: "igpdi",
  TR: "tr",
  IGP_M: "igpm",
  TJ11960: "tjrj11960",
  TJ6899: "tjrj6899",
};

// ─── Descrição ────────────────────────────────────────────────────────────────

export const DESCRICAO_OPCOES = [
  { value: "ressarci", label: "Ressarcimento" },
  { value: "ressarcimentoaoetario", label: "Ressarcimento ao etário" },
  { value: "debitosdfp", label: "Débitos da Fazenda Pública" },
  { value: "multacivil", label: "Multa Civil" },
  { value: "honorariosadvocaticios", label: "Honorários Advocatícios" },
  { value: "outros", label: "Digite sua descrição..." },
] as const;

export const DESCRICAO_LABEL: Record<string, string> = Object.fromEntries(
  DESCRICAO_OPCOES.map(({ value, label }) => [value, label])
);

// ─── Juros ────────────────────────────────────────────────────────────────────

/** Label de exibição para cada índice de juros */
export const JUROS_LABEL: Record<string, string> = {
  selic: "SELIC",
  cdi: "CDI",
  poupancanova: "Poupança Nova",
  poupancaantiga: "Poupança Antiga",
  poupanca: "Poupança (Antiga + Nova)",
  taxalegal: "Taxa Legal",
  codigocivil: "Código Civil",
  codigo: "Código Civil",
  especificartaxa: "Taxa Especificada",
  jurossimples6: "Juros Simples 6% a.a.",
  jurossimples12: "Juros Simples 12% a.a.",
};

/**
 * Converte os enums retornados pelo backend Java (GET /index-name/interest-correction)
 * nos valores de chave usados internamente no frontend.
 */
export const INTEREST_CORRECTION_JAVA_MAP: Record<string, string> = {
  SELIC: "selic",
  CÓDIGO_CIVIL: "codigo",
  JUROS_SIMPLES_6: "jurossimples6",
  JUROS_SIMPLES_12: "jurossimples12",
  CDI: "cdi",
  POUPANÇA_NOVA: "poupancanova",
  POUPANÇA_ANTIGA: "poupancaantiga",
  POUPANÇA_ANTIGA_E_NOVA: "poupanca",
  TAXA_LEGAL: "taxalegal",
  ESPECIFICAR_TAXA: "especificartaxa",
};

/** Descrição completa do índice de juros (exibida no painel de configuração de juros) */
export const JUROS_DESCRICAO: Record<string, string> = {
  codigo: "6% ao ano ou 0,5% ao mês até 10/01/2003; 12% ao ano ou 1% ao mês a partir de 11/01/2003.",
  jurossimples6: "Juros simples de 6% ao ano (0,5% ao mês).",
  jurossimples12: "Juros simples de 12% ao ano (1% ao mês).",
  selic: "Taxa SELIC acumulada no período, conforme Banco Central do Brasil.",
  cdi: "Taxa CDI acumulada no período, conforme Banco Central do Brasil.",
  poupancanova: "Poupança Nova: Taxa Selic quando abaixo de 8,5% a.a., ou 0,5% a.m. + TR.",
  poupancaantiga: "Poupança Antiga: 0,5% a.m. até 03/05/2012; 0,5% a.m. + TR a partir de 04/05/2012.",
  poupanca: "Poupança (Antiga + Nova): 0,5% a.m. até 03/05/2012; Taxa Selic quando abaixo de 8,5% a.a., ou 0,5% a.m. + TR a partir de 04/05/2012.",
  taxalegal: "Taxa Legal: 1% a.m. até 10/01/2003; 0,5% a.m. de 11/01/2003 a 09/01/2006; 1% a.m. a partir de 10/01/2006.",
  especificartaxa: "Taxa a ser especificada pelo usuário.",
};
