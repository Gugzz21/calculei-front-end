import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { LancamentoItem } from "../../App";
import type { LancamentoRecuperado } from "./types";
import { formatBRL, formatDate, formatPercent, gerarUUID } from "./utils";
import { salvarHistorico } from "../../services/api";

// ─── Estilos compartilhados ───────────────────────────────────────────────────

const COL_STYLES: { [key: number]: any } = {
  0: { cellWidth: "auto", halign: "left" },
  1: { cellWidth: 32,     halign: "left", fontSize: 7 },
  2: { cellWidth: 26,     halign: "right" },
  3: { cellWidth: 24,     halign: "left" },
  4: { cellWidth: 26,     halign: "right" },
  5: { cellWidth: 13,     halign: "center" },
  6: { cellWidth: 20,     halign: "right" },
  7: { cellWidth: 24,     halign: "left" },
  8: { cellWidth: 26,     halign: "right" },
  9: { cellWidth: 26,     halign: "right" },
};

const COLUNAS_PDF = [
  "Descrição", "Datas", "Valor Principal", "Índice Correção",
  "Valor Atualizado", "Dias", "% Correção", "Índice Juros", "Juros", "Total",
];

// ─── Helpers internos ─────────────────────────────────────────────────────────

function adicionarTotalGeral(
  doc: jsPDF,
  items: { valorPrincipal: number; valorAtualizado: number; dias: number; juros: number; total: number }[]
) {
  const finalY = (doc as any).lastAutoTable.finalY;
  const tot = {
    principal:  items.reduce((s, l) => s + l.valorPrincipal, 0),
    atualizado: items.reduce((s, l) => s + l.valorAtualizado, 0),
    dias:       items.reduce((s, l) => s + l.dias, 0),
    juros:      items.reduce((s, l) => s + l.juros, 0),
    total:      items.reduce((s, l) => s + l.total, 0),
  };
  autoTable(doc, {
    body: [[
      "TOTAL GERAL", "", formatBRL(tot.principal), "",
      formatBRL(tot.atualizado), String(tot.dias), "", "",
      formatBRL(tot.juros), formatBRL(tot.total),
    ]],
    startY: finalY,
    margin: { left: 14, right: 14 },
    styles: {
      fontSize: 7.5, fontStyle: "bold",
      fillColor: [243, 244, 246], textColor: [0, 0, 0],
      lineWidth: 0.1, lineColor: [180, 180, 180],
    },
    columnStyles: COL_STYLES,
  });
}

/**
 * Desenha o bloco de Token de Recuperação na última página do PDF.
 * Fica após a tabela, com fundo amarelo e aviso sobre guarda do token.
 */
function adicionarBlocoToken(doc: jsPDF, token: string) {
  // Desce à última página para escrever após a tabela
  const totalPgs  = (doc.internal as any).getNumberOfPages();
  doc.setPage(totalPgs);

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Calcula Y de partida: 6 mm após o fim da última tabela
  const lastTableY: number = (doc as any).lastAutoTable?.finalY ?? 40;
  const startY = lastTableY + 8;

  // Altura do bloco
  const boxH = 26;
  const margin = 14;
  const boxW = pageWidth - margin * 2;

  // Verifica se há espaço suficiente; se não, adiciona nova página
  if (startY + boxH > pageHeight - 14) {
    doc.addPage();
    doc.setPage((doc.internal as any).getNumberOfPages());
  }

  const y = startY + boxH > pageHeight - 14
    ? 20          // nova página
    : startY;

  // ── Fundo amarelo-âmbar ───────────────────────────────────────────────────
  doc.setFillColor(255, 251, 235);          // amber-50
  doc.setDrawColor(251, 191, 36);           // amber-400
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, boxW, boxH, 2, 2, "FD");

  // ── Ícone de aviso (texto emoji aproximado) ───────────────────────────────
  doc.setFontSize(9);
  doc.setTextColor(146, 64, 14);            // amber-800
  doc.setFont("helvetica", "bold");
  doc.text("⚠  TOKEN DE RECUPERAÇÃO", margin + 4, y + 7);

  // ── Token em destaque ─────────────────────────────────────────────────────
  doc.setFont("courier", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text(token, margin + 4, y + 15);

  // ── Aviso ─────────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(120, 60, 0);
  doc.text(
    "Guarde este token em local seguro. Com ele você pode recuperar e reimprimir este relatório a qualquer momento no sistema.",
    margin + 4,
    y + 22,
    { maxWidth: boxW - 8 }
  );
}

function adicionarPaginacao(doc: jsPDF) {
  const pageWidth  = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const total      = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Página ${i} de ${total}`, pageWidth - 14, pageHeight - 6, { align: "right" });
  }
}

// ─── Exportação principal ─────────────────────────────────────────────────────

/**
 * Gera e baixa o PDF dos lançamentos ativos.
 * O token de recuperação é gerado, salvo no backend e inserido no próprio PDF.
 * Retorna void (não mais exibe popup).
 */
export async function exportarParaPDF(lancamentos: LancamentoItem[]): Promise<void> {
  // Gerar token ANTES de montar o PDF para incluí-lo no documento
  const token = gerarUUID();

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  doc.setFontSize(16);
  doc.setTextColor(40);
  doc.text("Relatório de Lançamentos", 14, 15);

  const linhas = lancamentos.map((l) => [
    l.descricao,
    `Inicial: ${formatDate(l.dataInicial)}\nCálculo: ${formatDate(l.dataCalculo)}`,
    formatBRL(l.valorPrincipal),
    l.indiceCorrecao,
    formatBRL(l.valorAtualizado),
    l.dias.toString(),
    formatPercent(l.percentualCorrecao),
    l.indiceJuros,
    formatBRL(l.juros),
    formatBRL(l.total),
  ]);

  autoTable(doc, {
    head: [COLUNAS_PDF],
    body: linhas,
    startY: 25,
    margin: { left: 14, right: 14 },
    styles: { fontSize: 7.5, cellPadding: 2.5, valign: "middle", lineWidth: 0.1, lineColor: [180, 180, 180] },
    headStyles: { fillColor: [209, 213, 219], textColor: 0, fontStyle: "bold", lineWidth: 0.2 },
    columnStyles: COL_STYLES,
    alternateRowStyles: { fillColor: [255, 255, 255] },
  });

  if (lancamentos.length > 1) adicionarTotalGeral(doc, lancamentos);

  // ── Bloco do token no PDF ──────────────────────────────────────────────────
  adicionarBlocoToken(doc, token);

  // ── Paginação (depois do bloco para não sobrescrever) ─────────────────────
  adicionarPaginacao(doc);

  doc.save("relatorio-lancamentos.pdf");

  // ── Salvar no backend (após download para não bloquear) ───────────────────
  await salvarHistorico({
    data: new Date().toISOString().split("T")[0],
    token,
    json: {
      geradoEm: new Date().toISOString(),
      totalLancamentos: lancamentos.length,
      lancamentos: lancamentos.map((l) => ({
        id: l.id,
        descricao: l.descricao,
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
        juros: l.juros,
        total: l.total,
      })),
    },
  });
}

// ─── PDF de recuperação ───────────────────────────────────────────────────────

/**
 * Gera e baixa o PDF a partir de lançamentos recuperados por token.
 */
export function gerarPDFRecuperado(items: LancamentoRecuperado[], tokenUsado: string): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  doc.setFontSize(14);
  doc.setTextColor(40);
  doc.text("Relatório Recuperado por Token", 14, 13);
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(`Token: ${tokenUsado}`, 14, 20);

  const linhas = items.map((l) => [
    l.descricao,
    `Inicial: ${formatDate(l.dataInicial)}\nCálculo: ${formatDate(l.dataCalculo)}`,
    formatBRL(l.valorPrincipal),
    l.indiceCorrecao,
    formatBRL(l.valorAtualizado),
    String(l.dias),
    formatPercent(l.percentualCorrecao),
    l.indiceJuros ?? "—",
    formatBRL(l.juros),
    formatBRL(l.total),
  ]);

  autoTable(doc, {
    head: [COLUNAS_PDF],
    body: linhas,
    startY: 26,
    margin: { left: 14, right: 14 },
    styles: { fontSize: 7.5, cellPadding: 2.5, valign: "middle", lineWidth: 0.1, lineColor: [180, 180, 180] },
    headStyles: { fillColor: [209, 213, 219], textColor: 0, fontStyle: "bold", lineWidth: 0.2 },
    columnStyles: COL_STYLES,
    alternateRowStyles: { fillColor: [255, 255, 255] },
  });

  if (items.length > 1) adicionarTotalGeral(doc, items);
  adicionarPaginacao(doc);
  doc.save(`relatorio-token-${tokenUsado.slice(0, 8)}.pdf`);
}
