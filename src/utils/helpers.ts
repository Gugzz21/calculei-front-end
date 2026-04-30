/** Gera um UUID v4 simples sem dependência externa */
export function gerarUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Extrai o array de lançamentos de qualquer forma que o backend retorne */
export function extrairLancamentos(raw: object): any[] {
  const d = raw as Record<string, unknown>;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d["lancamentos"])) return d["lancamentos"];
  if (d["json"] && typeof d["json"] === "object") {
    const inner = d["json"] as Record<string, unknown>;
    if (Array.isArray(inner["lancamentos"])) return inner["lancamentos"];
  }
  return [];
}

/** Converte LancamentoRecuperado[] → LancamentoItem[] (formato da tabela principal) */
export function converterParaLancamentoItem(itens: any[]): any[] {
  return itens.map((l, index) => ({
    id: l.id ?? Date.now() + index,
    numero: index + 1,
    descricao: l.descricao,
    dataInicial: l.dataInicial,
    dataCalculo: l.dataCalculo,
    valorPrincipal: l.valorPrincipal,
    indiceCorrecao: l.indiceCorrecao,
    valorAtualizado: l.valorAtualizado,
    dias: l.dias,
    percentualCorrecao: l.percentualCorrecao,
    indiceJuros: l.indiceJuros,
    dataInicioJuros: l.dataInicioJuros ?? "",
    dataFimJuros: l.dataFimJuros ?? "",
    juros: l.juros,
    total: l.total,
  }));
}
