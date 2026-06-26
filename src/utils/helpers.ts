import type { LancamentoItem, LancamentoRecuperado } from "../types";

/** Gera um UUID v4 usando a Web Crypto API nativa do browser. */
export function gerarUUID(): string {
  return crypto.randomUUID();
}

/** Extrai o array de lançamentos de qualquer forma que o backend retorne */
export function extrairLancamentos(raw: object): LancamentoRecuperado[] {
  const d = raw as Record<string, unknown>;
  if (Array.isArray(d)) return d as LancamentoRecuperado[];
  if (Array.isArray(d["lancamentos"])) return d["lancamentos"] as LancamentoRecuperado[];
  if (d["json"] && typeof d["json"] === "object") {
    const inner = d["json"] as Record<string, unknown>;
    if (Array.isArray(inner["lancamentos"])) return inner["lancamentos"] as LancamentoRecuperado[];
  }
  return [];
}

/** Converte LancamentoRecuperado[] → LancamentoItem[] (formato da tabela principal) */
export function converterParaLancamentoItem(itens: LancamentoRecuperado[]): LancamentoItem[] {
  return itens.map((l, index) => ({
    id: l.id ?? Date.now() + index,
    numero: index + 1,
    descricao: l.descricao ?? "",
    descricaoComplementar: l.descricaoComplementar,
    tipoCalculo: l.tipoCalculo,
    dataInicial: l.dataInicial ?? "",
    dataCalculo: l.dataCalculo ?? "",
    valorPrincipal: l.valorPrincipal ?? 0,
    indiceCorrecao: l.indiceCorrecao ?? "",
    valorAtualizado: l.valorAtualizado ?? 0,
    dias: l.dias ?? 0,
    percentualCorrecao: l.percentualCorrecao ?? 0,
    indiceJuros: l.indiceJuros ?? "—",
    dataInicioJuros: l.dataInicioJuros ?? "",
    dataFimJuros: l.dataFimJuros ?? "",
    diasJuros: l.diasJuros,
    fatorJuros: l.fatorJuros,
    percentualJurosAcumulado: l.percentualJurosAcumulado,
    juros: l.juros ?? 0,
    total: l.total ?? 0,
    itensJuros: l.itensJuros,
  }));
}

/**
 * Serializa os lançamentos no formato esperado pelo backend para persistência de histórico.
 * Usado por exportPDF, exportExcel e exportImagem para evitar duplicação do bloco de payload.
 */
export function buildHistoricoPayload(token: string, lancamentos: LancamentoItem[]) {
  return {
    data: new Date().toISOString().split("T")[0],
    token,
    json: {
      geradoEm: new Date().toISOString(),
      totalLancamentos: lancamentos.length,
      lancamentos: lancamentos.map((l) => ({
        id: l.id,
        tipoCalculo: l.tipoCalculo,
        descricao: l.descricao,
        descricaoComplementar: l.descricaoComplementar,
        dataInicial: l.dataInicial,
        dataCalculo: l.dataCalculo,
        valorPrincipal: l.valorPrincipal,
        indiceCorrecao: l.indiceCorrecao,
        valorAtualizado: l.valorAtualizado,
        dias: l.dias,
        percentualCorrecao: l.percentualCorrecao,
        indiceJuros: l.indiceJuros,
        dataInicioJuros: l.dataInicioJuros,
        dataFimJuros: l.dataFimJuros,
        diasJuros: l.diasJuros,
        fatorJuros: l.fatorJuros,
        percentualJurosAcumulado: l.percentualJurosAcumulado,
        juros: l.juros,
        total: l.total,
        itensJuros: l.itensJuros,
      })),
    },
  };
}
