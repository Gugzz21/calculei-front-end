import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { LancamentoItem } from "../../types";
import type { LancamentoRecuperado } from "./types";
import { formatDate } from "../../utils/dateUtils";
import { gerarUUID } from "../../utils/helpers";
import { buscarUfirValue, salvarHistorico } from "../../services/api";
import { logoGrandeMPRJUrl, logoGateUrl, carregarImagemBase64 } from "../../assets/images";

// ─── Paleta de cores baseada no modelo ────────────────────────────────────────

const AZUL_HEADER: [number, number, number] = [31, 78, 121];   // Azul escuro cabeçalho tabela
const AZUL_GRUPO: [number, number, number] = [189, 210, 235];  // Azul clarinho para "Ressarcimento (1)"
const BRANCO: [number, number, number] = [255, 255, 255];
const CINZA_TOTAL: [number, number, number] = [242, 242, 242]; // Cinza das linhas de Total
const PRETO: [number, number, number] = [0, 0, 0];
const VERMELHO_LINK: [number, number, number] = [204, 0, 0];

// ─── Cabeçalho MPRJ ──────────────────────────────────────────────────────────

function desenharCabecalho(
  doc: jsPDF,
  paginaAtual: number,
  logoGrandeB64: string,
  logoGateB64: string,
  linkRetorno?: string
) {
  const pw = doc.internal.pageSize.getWidth();

  // ── Link "Voltar a tela" centralizado no topo
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...VERMELHO_LINK);
  if (linkRetorno) {
    doc.textWithLink("Voltar a tela", pw / 2, 10, { url: linkRetorno, align: "center" });
  } else {
    doc.text("Voltar a tela", pw / 2, 10, { align: "center" });
  }

  // ── Logo grande MPRJ (esquerda)
  // Posicionada em x=14, y=14
  doc.addImage(logoGrandeB64, "PNG", 14, 14, 60, 9);

  // ── Logo Gate MPRJ (direita)
  // Posicionada à direita: x = pw - 14 - largura
  doc.addImage(logoGateB64, "PNG", pw - 44, 14, 30, 6.5);

  // Data de geração
  if (paginaAtual === 1) {
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, "0");
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const ano = hoje.getFullYear();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(`Data de geração: ${dia}/${mes}/${ano}`, pw - 14, 25, { align: "right" });
  }
}

// ─── Rodapé com paginação e link ──────────────────────────────────────────────

function adicionarRodape(doc: jsPDF, link: string) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const total = (doc.internal as any).getNumberOfPages();

  for (let i = 1; i <= total; i++) {
    doc.setPage(i);

    // Link de recuperação
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    const prefixo = "Para recuperar este calculo, clique no link: ";
    doc.text(prefixo, 14, ph - 10);

    const prefixWidth = doc.getTextWidth(prefixo);
    doc.setTextColor(100, 100, 100);
    // Para simplificar a exibição e linkar de forma limpa, deixamos na mesma linha com cor sutil
    doc.textWithLink(link, 14 + prefixWidth, ph - 10, { url: link });

    // Paginação
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(`Página ${i} de ${total}`, pw - 14, ph - 10, { align: "right" });
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
  const head = [["Período de cálculo", "Valor (R$)", "Índice", "Fator de correção", "Valor atualizado (R$)", "Juros (R$)", "Total devido (R$)"]];

  // Corpo: para cada lançamento, linha de dados + linha de subtotal + linha Total em UFIR
  const body: any[] = [];

  // Usamos didDrawCell para rastrear linhas de grupo; mais simples: concatenar todas as rows
  // e usar willAddPage para re-desenhar cabeçalho

  lancamentos.forEach((l, idx) => {
    const numero = String(idx + 1);
    const periodo = `${formatDate(l.dataInicial)} a ${formatDate(l.dataCalculo)}`;

    // A correção deve mostrar muitas casas decimais conforme o modelo
    const correcaoPct = Number(l.percentualCorrecao).toLocaleString("pt-BR", { minimumFractionDigits: 8, maximumFractionDigits: 8 });
    const descricaoGrupo = `${numero} - ${l.descricao}${l.descricaoComplementar ? ` (${l.descricaoComplementar})` : ""}`;

    // ── Linha de grupo (Ressarcimento)
    body.push([
      {
        content: descricaoGrupo,
        colSpan: 7,
        styles: {
          fillColor: AZUL_GRUPO,
          textColor: PRETO,
          fontStyle: "bold",
          fontSize: 8,
          halign: "left",
        },
      },
    ]);

    // ── Linha de dados
    body.push([
      { content: periodo, styles: { halign: "center" } },
      { content: l.valorPrincipal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: "center" } },
      { content: l.indiceCorrecao, styles: { halign: "center" } },
      { content: correcaoPct, styles: { halign: "center" } },
      { content: l.valorAtualizado.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: "center" } },
      { content: l.juros > 0 ? l.juros.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—", styles: { halign: "center" } },
      { content: l.total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: "center", fillColor: CINZA_TOTAL } },
    ]);
  });

  // ── Totais Gerais (Apenas no final do cálculo)
  const totalPrincipal = lancamentos.reduce((acc, l) => acc + l.valorPrincipal, 0);
  const totalAtualizado = lancamentos.reduce((acc, l) => acc + l.valorAtualizado, 0);
  const totalJuros = lancamentos.reduce((acc, l) => acc + l.juros, 0);
  const totalGeral = lancamentos.reduce((acc, l) => acc + l.total, 0);

  const totalEmUfir = ufirValue > 0 ? (totalGeral / ufirValue).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";
  const ufirUnitStr = ufirValue > 0 ? ufirValue.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 }) : "Não disponível";

  body.push([
    { content: "Total", styles: { halign: "left", fontStyle: "bold", fillColor: BRANCO } },
    { content: totalPrincipal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: "center", fontStyle: "bold", fillColor: BRANCO } },
    { content: "", styles: { fillColor: BRANCO } },
    { content: "", styles: { fillColor: BRANCO } },
    { content: totalAtualizado.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: "center", fontStyle: "bold", fillColor: BRANCO } },
    { content: totalJuros > 0 ? totalJuros.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—", styles: { halign: "center", fontStyle: "bold", fillColor: BRANCO } },
    { content: totalGeral.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: "center", fontStyle: "bold", fillColor: CINZA_TOTAL } },
  ]);


  body.push([
    { content: "Valor unitário da UFIR utilizado:", colSpan: 6, styles: { halign: "right", fontStyle: "bold", fillColor: AZUL_GRUPO } },
    { content: ufirUnitStr, styles: { halign: "center", fontStyle: "bold", fillColor: AZUL_HEADER, textColor: BRANCO } },
  ]);

  body.push([
    { content: "Total geral em UFIR", colSpan: 6, styles: { halign: "right", fontStyle: "bold", fillColor: AZUL_GRUPO } },
    { content: totalEmUfir, styles: { halign: "center", fontStyle: "bold", fillColor: AZUL_GRUPO } },
  ]);

  // A4 landscape usable width = 297 - 14*2 = 269mm
  const colWidths: { [key: number]: any } = {
    0: { cellWidth: 42, halign: "center" },
    1: { cellWidth: 32, halign: "center" },
    2: { cellWidth: 40, halign: "center" },
    3: { cellWidth: 40, halign: "center" },
    4: { cellWidth: 40, halign: "center" },
    5: { cellWidth: 36, halign: "center" },
    6: { cellWidth: 39, halign: "center" },
  };

  autoTable(doc, {
    head,
    body,
    startY: tableStartY,
    margin: { top: 32, left: margin, right: margin },
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
      fontSize: 9,
      halign: "center",
    },
    columnStyles: colWidths,
    // Remover fundo alternado global para respeitar grupos
    didDrawPage: (data) => {
      desenharCabecalho(doc, data.pageNumber, logoGrandeB64, logoGateB64, window.location.origin);
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

  const head = [["Período de cálculo", "Valor atualizado (R$)", "Dias", "Fator (%)", "Acumulado (%)", "Juros (R$)"]];
  const body: any[] = [];

  lancamentos.forEach((l, idx) => {
    const numero = String(idx + 1);
    const temItens = l.itensJuros && l.itensJuros.length > 0;
    const nomeGrupo = `${numero} - ${l.descricao}${l.descricaoComplementar ? ` (${l.descricaoComplementar})` : ""}`;

    // Linha de grupo
    body.push([
      {
        content: nomeGrupo,
        colSpan: 6,
        styles: {
          fillColor: AZUL_GRUPO,
          textColor: PRETO,
          fontStyle: "bold",
          fontSize: 8,
          halign: "left"
        },
      },
    ]);

    if (temItens) {
      l.itensJuros!.forEach((sub) => {
        const periodo = `${formatDate(sub.dataInicio)} a ${formatDate(sub.dataFim)}`;
        const fator = sub.taxa ? (sub.taxa.includes("%") ? sub.taxa.replace("%", "").trim() : sub.taxa) : "—";
        body.push([
          { content: periodo, styles: { halign: "center" } },
          { content: l.valorAtualizado.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: "center" } },
          { content: String(sub.dias), styles: { halign: "center" } },
          { content: fator, styles: { halign: "center" } },
          { content: Number(sub.percentual).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: "center" } },
          { content: Number(sub.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: "center", fillColor: CINZA_TOTAL } },
        ]);
      });
    } else {
      // Sem itens detalhados — usa os campos simples do lançamento
      const periodo = l.dataInicioJuros
        ? `${formatDate(l.dataInicioJuros)} a ${formatDate(l.dataFimJuros)}`
        : "—";
      body.push([
        { content: periodo, styles: { halign: "center" } },
        { content: l.valorAtualizado.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: "center" } },
        { content: String(l.diasJuros ?? "—"), styles: { halign: "center" } },
        { content: l.fatorJuros != null ? String(l.fatorJuros) : "—", styles: { halign: "center" } },
        { content: l.percentualJurosAcumulado != null ? Number(l.percentualJurosAcumulado).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—", styles: { halign: "center" } },
        { content: l.juros.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: "center", fillColor: CINZA_TOTAL } },
      ]);
    }
  });

  // ── Totais Gerais de Juros
  const totalAtualizadoJuros = lancamentos.reduce((acc, l) => acc + l.valorAtualizado, 0);
  const totalJurosGeral = lancamentos.reduce((acc, l) => acc + l.juros, 0);

  body.push([
    { content: "Total", styles: { halign: "left", fontStyle: "bold", fillColor: BRANCO } },
    { content: totalAtualizadoJuros.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { halign: "center", fontStyle: "bold", fillColor: BRANCO } },
    { content: "", styles: { fillColor: BRANCO } },
    { content: "", styles: { fillColor: BRANCO } },
    { content: "", styles: { fillColor: BRANCO } },
    { content: totalJurosGeral > 0 ? totalJurosGeral.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—", styles: { halign: "center", fontStyle: "bold", fillColor: CINZA_TOTAL } },
  ]);

  // A4 landscape usable width = 297 - 14*2 = 269mm
  const colWidths: { [key: number]: any } = {
    0: { cellWidth: 64, halign: "center" },
    1: { cellWidth: 54, halign: "center" },
    2: { cellWidth: 22, halign: "center" },
    3: { cellWidth: 32, halign: "center" },
    4: { cellWidth: 40, halign: "center" },
    5: { cellWidth: 57, halign: "center" },
  };

  autoTable(doc, {
    head,
    body,
    startY: tableStartY,
    margin: { top: 32, left: margin, right: margin },
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
      fontSize: 9,
      halign: "center",
    },
    columnStyles: colWidths,
    didDrawPage: (data) => {
      desenharCabecalho(doc, data.pageNumber, logoGrandeB64, logoGateB64, window.location.origin);
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

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Primeira página: cabeçalho
  desenharCabecalho(doc, 1, logoGrandeB64, logoGateB64, link);

  // ── Tabela 1
  let currentY = 32;
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
      desenharCabecalho(doc, (doc.internal as any).getNumberOfPages(), logoGrandeB64, logoGateB64, link);
      currentY = 32;
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
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

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

  const link = `${window.location.origin}/?token=${tokenUsado}`;

  desenharCabecalho(doc, 1, logoGrandeB64, logoGateB64, link);

  const lancamentos = items as LancamentoItem[];
  let currentY = 32;

  currentY = gerarTabelaCorrecao(doc, lancamentos, currentY, 0, logoGrandeB64, logoGateB64);

  const temJuros = lancamentos.some(l => l.juros > 0);
  if (temJuros) {
    const lancamentosComJuros = lancamentos.filter(l => l.juros > 0);
    currentY += 10;
    const ph = doc.internal.pageSize.getHeight();
    if (currentY + 40 > ph - 20) {
      doc.addPage();
      desenharCabecalho(doc, (doc.internal as any).getNumberOfPages(), logoGrandeB64, logoGateB64, link);
      currentY = 32;
    }
    gerarTabelaJuros(doc, lancamentosComJuros, currentY, logoGrandeB64, logoGateB64);
  }

  adicionarRodape(doc, link);

  doc.save(`relatorio-token-${tokenUsado.slice(0, 8)}.pdf`);
}
