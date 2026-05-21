import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { LancamentoItem } from "../../types";
import type { LancamentoRecuperado } from "./types";
import { formatDate } from "../../utils/dateUtils";
import { gerarUUID } from "../../utils/helpers";
import { buscarUfirValue, salvarHistorico } from "../../services/api";
import { logoGrandeMPRJUrl, logoGateUrl, carregarImagemBase64 } from "../../assets/images";

// ─── Paleta de cores MPRJ ─────────────────────────────────────────────────────

const AZUL_HEADER: [number, number, number] = [31, 78, 121];   // azul escuro cabeçalho
const AZUL_GRUPO: [number, number, number] = [189, 210, 235];  // azul claro grupo
const BRANCO: [number, number, number] = [255, 255, 255];
const CINZA_TOTAL: [number, number, number] = [242, 242, 242];
const AZUL_UFIR: [number, number, number] = [220, 234, 248];
const PRETO: [number, number, number] = [0, 0, 0];

// ─── Cabeçalho MPRJ ──────────────────────────────────────────────────────────

function desenharCabecalho(
  doc: jsPDF,
  paginaAtual: number,
  logoGrandeB64: string,
  logoGateB64: string
) {
  const pw = doc.internal.pageSize.getWidth();

  // ── Logo grande MPRJ (esquerda) — 402×60px → ≈ 72mm × 10.8mm
  // Posicionada em x=14, y=4, largura=72, altura=10.8
  doc.addImage(logoGrandeB64, "PNG", 14, 4, 72, 10.8);

  // ── Logo Gate MPRJ (direita) — 186×40px → ≈ 35mm × 7.5mm
  // Posicionada à direita: x = pw - 14 - 35
  doc.addImage(logoGateB64, "PNG", pw - 49, 4, 35, 7.5);

  // Linha separadora horizontal
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(14, 18, pw - 14, 18);

  // Data de geração (linha 1 apenas)
  if (paginaAtual === 1) {
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, "0");
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const ano = hoje.getFullYear();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text(`Data de geração: ${dia}/${mes}/${ano}`, pw - 14, 24, { align: "right" });
  }
}

// ─── Rodapé com paginação e link ──────────────────────────────────────────────

function adicionarRodape(doc: jsPDF, link: string) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const total = (doc.internal as any).getNumberOfPages();

  for (let i = 1; i <= total; i++) {
    doc.setPage(i);

    // Linha separadora
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(14, ph - 14, pw - 14, ph - 14);

    // Link de recuperação
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    doc.text("Para recuperar este cálculo, clique no link: ", 14, ph - 8);

    const prefixWidth = doc.getTextWidth("Para recuperar este cálculo, clique no link: ");
    doc.setTextColor(0, 0, 200);
    doc.text(link, 14 + prefixWidth, ph - 8);

    // Paginação
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Página ${i} de ${total}`, pw - 14, ph - 8, { align: "right" });
  }
}

// ─── Tabela 1: Cálculo de atualização monetária ───────────────────────────────

function gerarTabelaCorrecao(
  doc: jsPDF,
  lancamentos: LancamentoItem[],
  startY: number,
  ufirValue: number,
  logoGrandeB64: string,
  logoGateB64: string
): number {
  const pw = doc.internal.pageSize.getWidth();
  const margin = 14;

  // Título da tabela
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text("Cálculo de atualização monetária", margin, startY);

  const tableStartY = startY + 5;

  // Cabeçalho da tabela
  const head = [["#", "Período de cálculo", "Valor (R$)", "Índice", "Correção (%)", "Valor atualizado (R$)", "Juros (R$)", "Total devido (R$)"]];

  // Corpo: para cada lançamento, linha de dados + linha de subtotal + linha Total em UFIR
  const body: any[] = [];

  // Usamos didDrawCell para rastrear linhas de grupo; mais simples: concatenar todas as rows
  // e usar willAddPage para re-desenhar cabeçalho

  lancamentos.forEach((l, idx) => {
    const numero = idx + 1;
    const periodo = `${formatDate(l.dataInicial)} a ${formatDate(l.dataCalculo)}`;
    const correcaoPct = Number(l.percentualCorrecao).toLocaleString("pt-BR", { minimumFractionDigits: 8, maximumFractionDigits: 8 });

    // ── Linha de grupo (nome do lançamento)
    body.push([
      {
        content: `${l.descricao}${l.descricaoComplementar ? ` (${l.descricaoComplementar})` : ""}`,
        colSpan: 8,
        styles: {
          fillColor: AZUL_GRUPO,
          textColor: PRETO,
          fontStyle: "bold",
          fontSize: 8,
          cellPadding: { left: 3, right: 3, top: 2, bottom: 2 },
        },
      },
    ]);

    // ── Linha de dados
    body.push([
      { content: `${numero})`, styles: { halign: "center", overflow: "hidden" } },
      { content: periodo, styles: { halign: "left" } },
      { content: l.valorPrincipal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: "right" } },
      { content: l.indiceCorrecao, styles: { halign: "left" } },
      { content: correcaoPct, styles: { halign: "right", fontSize: 7 } },
      { content: l.valorAtualizado.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: "right" } },
      { content: l.juros > 0 ? l.juros.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—", styles: { halign: "right" } },
      { content: l.total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: "right" } },
    ]);

    // ── Linha de Total do grupo
    body.push([
      { content: "Total", colSpan: 2, styles: { halign: "left", fontStyle: "bold", fillColor: CINZA_TOTAL } },
      { content: l.valorPrincipal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: "right", fontStyle: "bold", fillColor: CINZA_TOTAL } },
      { content: "", styles: { fillColor: CINZA_TOTAL } },
      { content: "", styles: { fillColor: CINZA_TOTAL } },
      { content: l.valorAtualizado.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: "right", fontStyle: "bold", fillColor: CINZA_TOTAL } },
      { content: l.juros > 0 ? l.juros.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—", styles: { halign: "right", fontStyle: "bold", fillColor: CINZA_TOTAL } },
      { content: l.total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: "right", fontStyle: "bold", fillColor: CINZA_TOTAL } },
    ]);

    // ── Linha Total em UFIR (sempre exibida; valor só se ufirValue > 0)
    const totalUfirStr = ufirValue > 0
      ? (l.total / ufirValue).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "—";
    body.push([
      { content: "Total em UFIR", colSpan: 7, styles: { halign: "left", fontStyle: "bold", fillColor: AZUL_UFIR, textColor: [7, 51, 101] } },
      { content: totalUfirStr, styles: { halign: "right", fontStyle: "bold", fillColor: AZUL_UFIR, textColor: [7, 51, 101] } },
    ]);
  });

  // Totais gerais (só se mais de 1 lançamento)
  if (lancamentos.length > 1) {
    const totPrincipal = lancamentos.reduce((s, l) => s + l.valorPrincipal, 0);
    const totAtualizado = lancamentos.reduce((s, l) => s + l.valorAtualizado, 0);
    const totJuros = lancamentos.reduce((s, l) => s + l.juros, 0);
    const totTotal = lancamentos.reduce((s, l) => s + l.total, 0);
    const temJuros = lancamentos.some(l => l.juros > 0);

    body.push([
      { content: "TOTAL GERAL", colSpan: 2, styles: { halign: "left", fontStyle: "bold", fillColor: AZUL_HEADER, textColor: BRANCO } },
      { content: totPrincipal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: "right", fontStyle: "bold", fillColor: AZUL_HEADER, textColor: BRANCO } },
      { content: "", styles: { fillColor: AZUL_HEADER } },
      { content: "", styles: { fillColor: AZUL_HEADER } },
      { content: totAtualizado.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: "right", fontStyle: "bold", fillColor: AZUL_HEADER, textColor: BRANCO } },
      { content: temJuros ? totJuros.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—", styles: { halign: "right", fontStyle: "bold", fillColor: AZUL_HEADER, textColor: BRANCO } },
      { content: totTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: "right", fontStyle: "bold", fillColor: AZUL_HEADER, textColor: BRANCO } },
    ]);
  }

  // Linha vazia de espaçamento
  body.push([{ content: "", colSpan: 8, styles: { fillColor: BRANCO, minCellHeight: 8, lineWidth: 0 } }]);

  // Valor Unitário da UFIR
  const ufirUnitStr = ufirValue > 0 ? ufirValue.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 }) : "Não disponível";
  body.push([
    { content: "Valor unitário da UFIR utilizado:", colSpan: 7, styles: { halign: "right", fontStyle: "bold", fillColor: AZUL_UFIR, textColor: [7, 51, 101], lineWidth: 0.1, lineColor: [7, 51, 101] } },
    { content: ufirUnitStr, styles: { halign: "center", fontStyle: "bold", fillColor: AZUL_HEADER, textColor: BRANCO, lineWidth: 0.1, lineColor: [7, 51, 101] } },
  ]);

  // TOTAL GERAL EM UFIR
  const totTotalGeral = lancamentos.reduce((s, l) => s + l.total, 0);
  const totalGeralUfirStr = ufirValue > 0
    ? (totTotalGeral / ufirValue).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "—";
  
  body.push([
    { content: "TOTAL GERAL EM UFIR", colSpan: 7, styles: { halign: "left", fontStyle: "bold", fillColor: AZUL_UFIR, textColor: [7, 51, 101], lineWidth: 0.1, lineColor: [7, 51, 101] } },
    { content: totalGeralUfirStr, styles: { halign: "right", fontStyle: "bold", fillColor: AZUL_UFIR, textColor: [7, 51, 101], lineWidth: 0.1, lineColor: [7, 51, 101] } },
  ]);

  // A4 portrait usable width = 210 - 14*2 = 182mm
  // Soma: 9+30+23+34+22+24+22+18 = 182
  const colWidths: { [key: number]: any } = {
    0: { cellWidth: 9, halign: "center" },
    1: { cellWidth: 30, halign: "left" },
    2: { cellWidth: 23, halign: "right" },
    3: { cellWidth: 34, halign: "left" },
    4: { cellWidth: 22, halign: "right" },
    5: { cellWidth: 24, halign: "right" },
    6: { cellWidth: 22, halign: "right" },
    7: { cellWidth: 18, halign: "right" },
  };

  autoTable(doc, {
    head,
    body,
    startY: tableStartY,
    margin: { left: margin, right: margin },
    tableWidth: pw - margin * 2,
    styles: {
      fontSize: 8,
      cellPadding: { left: 4, right: 4, top: 4, bottom: 4 },
      valign: "middle",
      lineWidth: 0.1,
      lineColor: [180, 180, 200],
      textColor: PRETO,
    },
    headStyles: {
      fillColor: AZUL_HEADER,
      textColor: BRANCO,
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
    },
    columnStyles: colWidths,
    alternateRowStyles: { fillColor: BRANCO },
    didDrawPage: (data) => {
      desenharCabecalho(doc, data.pageNumber, logoGrandeB64, logoGateB64);
    },
  });

  return (doc as any).lastAutoTable.finalY as number;
}

// ─── Tabela 2: Memória de Cálculo de Juros ────────────────────────────────────

function gerarTabelaJuros(
  doc: jsPDF,
  lancamentos: LancamentoItem[],
  startY: number,
  logoGrandeB64: string,
  logoGateB64: string
): number {
  const pw = doc.internal.pageSize.getWidth();
  const margin = 14;

  // Título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text("Memória de Cálculo de Juros", margin, startY);

  const tableStartY = startY + 5;

  const head = [["#", "Período de cálculo", "Valor atualizado (R$)", "Dias", "Fator (%)", "Acumulado (%)", "Juros (R$)"]];
  const body: any[] = [];

  lancamentos.forEach((l, idx) => {
    const numero = idx + 1;
    const temItens = l.itensJuros && l.itensJuros.length > 0;
    const nomeGrupo = `${l.descricao}${l.descricaoComplementar ? ` (${l.descricaoComplementar})` : ""}`;

    // Linha de grupo
    body.push([
      {
        content: nomeGrupo,
        colSpan: 7,
        styles: {
          fillColor: AZUL_GRUPO,
          textColor: PRETO,
          fontStyle: "bold",
          fontSize: 8,
          cellPadding: { left: 3, right: 3, top: 2, bottom: 2 },
        },
      },
    ]);

    if (temItens) {
      l.itensJuros!.forEach((sub) => {
        const periodo = `${formatDate(sub.dataInicio)} a ${formatDate(sub.dataFim)}`;
        const fator = sub.taxa ? (sub.taxa.includes("%") ? sub.taxa.replace("%", "").trim() : sub.taxa) : "—";
        body.push([
          { content: `${numero})`, styles: { halign: "left" } },
          { content: periodo, styles: { halign: "left" } },
          { content: l.valorAtualizado.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: "right" } },
          { content: String(sub.dias), styles: { halign: "center" } },
          { content: fator, styles: { halign: "center" } },
          { content: Number(sub.percentual).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: "right" } },
          { content: Number(sub.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: "right" } },
        ]);
      });

      // Total do grupo
      const totalDias = l.itensJuros!.reduce((s, sub) => s + (sub.dias || 0), 0);
      body.push([
        { content: "Total", colSpan: 3, styles: { halign: "left", fontStyle: "bold", fillColor: CINZA_TOTAL } },
        { content: String(totalDias), styles: { halign: "center", fontStyle: "bold", fillColor: CINZA_TOTAL } },
        { content: "", styles: { fillColor: CINZA_TOTAL } },
        { content: "", styles: { fillColor: CINZA_TOTAL } },
        { content: l.juros.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: "right", fontStyle: "bold", fillColor: CINZA_TOTAL } },
      ]);
    } else {
      // Sem itens detalhados — usa os campos simples do lançamento
      const periodo = l.dataInicioJuros
        ? `${formatDate(l.dataInicioJuros)} a ${formatDate(l.dataFimJuros)}`
        : "—";
      body.push([
        { content: `${numero})`, styles: { halign: "left" } },
        { content: periodo, styles: { halign: "left" } },
        { content: l.valorAtualizado.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: "right" } },
        { content: String(l.diasJuros ?? "—"), styles: { halign: "center" } },
        { content: l.fatorJuros != null ? String(l.fatorJuros) : "—", styles: { halign: "center" } },
        { content: l.percentualJurosAcumulado != null ? Number(l.percentualJurosAcumulado).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—", styles: { halign: "right" } },
        { content: l.juros.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: "right" } },
      ]);

      body.push([
        { content: "Total", colSpan: 3, styles: { halign: "left", fontStyle: "bold", fillColor: CINZA_TOTAL } },
        { content: String(l.diasJuros ?? "—"), styles: { halign: "center", fontStyle: "bold", fillColor: CINZA_TOTAL } },
        { content: "", styles: { fillColor: CINZA_TOTAL } },
        { content: "", styles: { fillColor: CINZA_TOTAL } },
        { content: l.juros.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: "right", fontStyle: "bold", fillColor: CINZA_TOTAL } },
      ]);
    }
  });

  // A4 portrait usable width = 182mm
  // Soma: 9+44+36+18+18+22+35 = 182
  const colWidths: { [key: number]: any } = {
    0: { cellWidth: 9, halign: "center" },
    1: { cellWidth: 44, halign: "left" },
    2: { cellWidth: 36, halign: "right" },
    3: { cellWidth: 18, halign: "center" },
    4: { cellWidth: 18, halign: "center" },
    5: { cellWidth: 22, halign: "right" },
    6: { cellWidth: 35, halign: "right" },
  };

  autoTable(doc, {
    head,
    body,
    startY: tableStartY,
    margin: { left: margin, right: margin },
    tableWidth: pw - margin * 2,
    styles: {
      fontSize: 8,
      cellPadding: { left: 4, right: 4, top: 4, bottom: 4 },
      valign: "middle",
      lineWidth: 0.1,
      lineColor: [180, 180, 200],
      textColor: PRETO,
    },
    headStyles: {
      fillColor: AZUL_HEADER,
      textColor: BRANCO,
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
    },
    columnStyles: colWidths,
    alternateRowStyles: { fillColor: BRANCO },
    didDrawPage: (data) => {
      desenharCabecalho(doc, data.pageNumber, logoGrandeB64, logoGateB64);
    },
  });

  return (doc as any).lastAutoTable.finalY as number;
}

// ─── Exportação principal ─────────────────────────────────────────────────────

export async function exportarParaPDF(
  lancamentos: LancamentoItem[],
  ufirValue: number = 0
): Promise<{ token: string; doc: jsPDF }> {
  let resolvedUfir = ufirValue;
  if (resolvedUfir <= 0) {
    try {
      resolvedUfir = await buscarUfirValue();
    } catch (err) {
      console.error("Erro ao obter UFIR no exportPDF:", err);
    }
  }

  // ── Carregar logos uma vez só
  let logoGrandeB64 = "";
  let logoGateB64 = "";
  try {
    [logoGrandeB64, logoGateB64] = await Promise.all([
      carregarImagemBase64(logoGrandeMPRJUrl),
      carregarImagemBase64(logoGateUrl),
    ]);
  } catch (err) {
    console.error("Erro ao carregar logos:", err);
  }

  const token = gerarUUID();
  const link = `${window.location.origin}/?token=${token}`;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Primeira página: cabeçalho
  desenharCabecalho(doc, 1, logoGrandeB64, logoGateB64);

  // ── Tabela 1
  let currentY = 30;
  currentY = gerarTabelaCorrecao(doc, lancamentos, currentY, resolvedUfir, logoGrandeB64, logoGateB64);

  // ── Tabela 2 (somente se houver juros)
  const temJuros = lancamentos.some(l => l.juros > 0);
  if (temJuros) {
    const lancamentosComJuros = lancamentos.filter(l => l.juros > 0);
    currentY += 10;

    // Verificar se há espaço na página atual
    const ph = doc.internal.pageSize.getHeight();
    if (currentY + 40 > ph - 20) {
      doc.addPage();
      desenharCabecalho(doc, (doc.internal as any).getNumberOfPages(), logoGrandeB64, logoGateB64);
      currentY = 30;
    }

    gerarTabelaJuros(doc, lancamentosComJuros, currentY, logoGrandeB64, logoGateB64);
  }

  // ── Rodapé em todas as páginas
  adicionarRodape(doc, link);

  // ── Salvar histórico no backend
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
        diasJuros: l.diasJuros,
        fatorJuros: l.fatorJuros,
        percentualJurosAcumulado: l.percentualJurosAcumulado,
        juros: l.juros,
        total: l.total,
        itensJuros: l.itensJuros,
      })),
    },
  });

  return { token, doc };
}

// ─── PDF de recuperação ───────────────────────────────────────────────────────

export async function gerarPDFRecuperado(items: LancamentoRecuperado[], tokenUsado: string): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // ── Carregar logos
  let logoGrandeB64 = "";
  let logoGateB64 = "";
  try {
    [logoGrandeB64, logoGateB64] = await Promise.all([
      carregarImagemBase64(logoGrandeMPRJUrl),
      carregarImagemBase64(logoGateUrl),
    ]);
  } catch (err) {
    console.error("Erro ao carregar logos:", err);
  }

  desenharCabecalho(doc, 1, logoGrandeB64, logoGateB64);

  const lancamentos = items as LancamentoItem[];
  let currentY = 30;

  currentY = gerarTabelaCorrecao(doc, lancamentos, currentY, 0, logoGrandeB64, logoGateB64);

  const temJuros = lancamentos.some(l => l.juros > 0);
  if (temJuros) {
    const lancamentosComJuros = lancamentos.filter(l => l.juros > 0);
    currentY += 10;
    const ph = doc.internal.pageSize.getHeight();
    if (currentY + 40 > ph - 20) {
      doc.addPage();
      desenharCabecalho(doc, (doc.internal as any).getNumberOfPages(), logoGrandeB64, logoGateB64);
      currentY = 30;
    }
    gerarTabelaJuros(doc, lancamentosComJuros, currentY, logoGrandeB64, logoGateB64);
  }

  const link = `${window.location.origin}/?token=${tokenUsado}`;
  adicionarRodape(doc, link);

  doc.save(`relatorio-token-${tokenUsado.slice(0, 8)}.pdf`);
}
