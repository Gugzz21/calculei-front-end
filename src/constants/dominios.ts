// ─── Tipo de Cálculo ──────────────────────────────────────────────────────────

export const TIPO_CALCULO_OPCOES = [
  { value: "cdparticular",         label: "Créditos / Débitos Entre Particulares" },
  { value: "cfazenda",             label: "Créditos da Fazenda Pública" },
  { value: "dfazendatributario",   label: "Débitos da Fazenda Pública - Tributários" },
  { value: "dfazendanaotributario",label: "Débitos da Fazenda Pública - Não Tributários" },
  { value: "previdenciario",       label: "Débitos Previdenciários" },
  { value: "precatoriostributario",label: "Precatórios - Tributários" },
  { value: "precatoriosnaotributario", label: "Precatórios - Não Tributários" },
  { value: "multadiaria",          label: "Multa diária" },
  { value: "abatimentos",          label: "Abatimentos" },
] as const;

/** Mapeamento tipo de cálculo → índice de correção pré-selecionado */
export const TIPO_CALCULO_INDICE_MAP: Record<string, string> = {
  dfazendatributario:    "selic",
  dfazendanaotributario: "tjrj119602009ipcaeselic",
  abatimentos:           "semcorrecaomonetaria",
  cdparticular:          "tjrj6899",
  cfazenda:              "tjrj6899",
};

// ─── Índice de Correção Monetária ─────────────────────────────────────────────

export const INDICE_CORRECAO_OPCOES = [
  { value: "ipcae",                  label: "IPCA-E" },
  { value: "igpm",                   label: "IGP-M" },
  { value: "tr",                     label: "TR" },
  { value: "igpdi",                  label: "IGP-DI" },
  { value: "ipca",                   label: "IPCA" },
  { value: "cdi",                    label: "CDI" },
  { value: "selic",                  label: "SELIC" },
  { value: "semcorrecaomonetaria",   label: "SEM CORREÇÃO MONETÁRIA" },
  { value: "tjrj119602009ipcaeselic",label: "TJRJ 11.960/2009 IPCA/SELIC" },
  { value: "tjrj6899",               label: "TJ/RJ Lei 6.899/81 (UFIR-RJ)" },
] as const;

/** Label legível para exibição no lançamento */
export const INDICE_LABEL: Record<string, string> = Object.fromEntries(
  INDICE_CORRECAO_OPCOES.map(({ value, label }) => [value, label])
);

// ─── Descrição ────────────────────────────────────────────────────────────────

export const DESCRICAO_OPCOES = [
  { value: "ressarci",                label: "Ressarcimento" },
  { value: "ressarcimentoaoetario",   label: "Ressarcimento ao etário" },
  { value: "debitosdfp",              label: "Débitos da Fazenda Pública" },
  { value: "multacivil",              label: "Multa Civil" },
  { value: "honorariosadvocaticios",  label: "Honorários Advocatícios" },
  { value: "outros",                  label: "Outros" },
] as const;

export const DESCRICAO_LABEL: Record<string, string> = Object.fromEntries(
  DESCRICAO_OPCOES.map(({ value, label }) => [value, label])
);

// ─── Juros ────────────────────────────────────────────────────────────────────

export const JUROS_INDICE_OPCOES = [
  { value: "codigo",        label: "Código Civil" },
  { value: "jurossimples6", label: "Juros Simples 6% a.a." },
  { value: "jurossimples12",label: "Juros Simples 12% a.a." },
  { value: "selic",         label: "SELIC" },
  { value: "cdi",           label: "CDI" },
  { value: "poupancanova",  label: "Poupança Nova" },
  { value: "poupancaantiga",label: "Poupança Antiga" },
  { value: "poupanca",      label: "Poupança (Antiga + Nova)" },
  { value: "taxalegal",     label: "TAXA LEGAL" },
  { value: "especificartaxa",label: "Especificar Taxa" },
] as const;

export const JUROS_LABEL: Record<string, string> = {
  selic:          "SELIC",
  cdi:            "CDI",
  poupancanova:   "Poupança Nova",
  poupancaantiga: "Poupança Antiga",
  poupanca:       "Poupança",
  taxalegal:      "Taxa Legal",
  codigocivil:    "Código Civil",
  codigo:         "Código Civil",
  especificartaxa:"Taxa Especificada",
  jurossimples6:  "Juros Simples 6% a.a.",
  jurossimples12: "Juros Simples 12% a.a.",
};

/** Descrição completa do índice de juros (exibida no painel de juros) */
export const JUROS_DESCRICAO: Record<string, string> = {
  codigo:         "6% ao ano ou 0,5% ao mês até 10/01/2003; 12% ao ano ou 1% ao mês a partir de 11/01/2003.",
  jurossimples6:  "Juros simples de 6% ao ano (0,5% ao mês).",
  jurossimples12: "Juros simples de 12% ao ano (1% ao mês).",
  selic:          "Taxa SELIC acumulada no período, conforme Banco Central do Brasil.",
  cdi:            "Taxa CDI acumulada no período, conforme Banco Central do Brasil.",
  poupancanova:   "Poupança Nova: Taxa Selic quando abaixo de 8,5% a.a., ou 0,5% a.m. + TR.",
  poupancaantiga: "Poupança Antiga: 0,5% a.m. até 03/05/2012; 0,5% a.m. + TR a partir de 04/05/2012.",
  poupanca:       "Poupança (Antiga + Nova): 0,5% a.m. até 03/05/2012; Taxa Selic quando abaixo de 8,5% a.a., ou 0,5% a.m. + TR a partir de 04/05/2012.",
  taxalegal:      "Taxa Legal: 1% a.m. até 10/01/2003; 0,5% a.m. de 11/01/2003 a 09/01/2006; 1% a.m. a partir de 10/01/2006.",
  especificartaxa:"Taxa a ser especificada pelo usuário.",
};
