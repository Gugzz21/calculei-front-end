import type { LancamentoItem } from "../../App";
import { formatBRL, formatDate, formatPercent, gerarUUID } from "./utils";
import { salvarHistorico } from "../../services/api";

/**
 * Gera e baixa uma imagem JPEG da tabela de lançamentos usando Canvas.
 * Também salva os dados no backend e retorna o token gerado.
 */
export async function baixarImagem(lancamentos: LancamentoItem[]): Promise<string> {
  if (lancamentos.length === 0) {
    alert("Nenhum lançamento para exportar.");
    return "";
  }

  // ── Gera token ANTES de tudo ────────────────────────────────────────────────
  const token = gerarUUID();
  const link = `${window.location.origin}/?token=${token}`;

  const cols = [
    { label: "Descrição",        width: 140, align: "left"   as const },
    { label: "Datas",            width: 95,  align: "left"   as const },
    { label: "Valor Principal",  width: 105, align: "right"  as const },
    { label: "Índice",           width: 90,  align: "left"   as const },
    { label: "Valor Atualizado", width: 110, align: "right"  as const },
    { label: "Dias",             width: 48,  align: "center" as const },
    { label: "%Correção",        width: 80,  align: "right"  as const },
    { label: "Ind. Juros",       width: 90,  align: "left"   as const },
    { label: "Juros",            width: 95,  align: "right"  as const },
    { label: "Total",            width: 105, align: "right"  as const },
  ];

  const scale     = 2;
  const padX      = 28;
  const padY      = 24;
  const rowH      = 32;
  const headH     = 38;
  const titleH    = 56;
  const hasTotals = lancamentos.length > 1;
  const tableW    = cols.reduce((s, c) => s + c.width, 0);
  const canvasW   = tableW + padX * 2;
  const canvasH   = padY + titleH + headH + rowH * lancamentos.length + (hasTotals ? rowH : 0) + padY;

  const canvas = document.createElement("canvas");
  canvas.width  = canvasW * scale;
  canvas.height = canvasH * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  // Fundo branco
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Título
  ctx.fillStyle = "#1e293b";
  ctx.font = "bold 15px Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Relatório de Lançamentos", padX, padY + 20);
  ctx.fillStyle = "#6b7280";
  ctx.font = "11px Arial, sans-serif";
  ctx.fillText(`Total de registros: ${lancamentos.length}`, padX, padY + 38);

  /** Desenha texto dentro de uma célula com clip */
  const drawCell = (
    text: string, cx: number, cy: number, cw: number, ch: number,
    align: "left" | "center" | "right"
  ) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx + 2, cy, cw - 4, ch);
    ctx.clip();
    const tx = align === "right" ? cx + cw - 8
      : align === "center"       ? cx + cw / 2
      :                            cx + 8;
    ctx.textAlign = align;
    if (text.includes("\n")) {
      const lines = text.split("\n");
      ctx.font = "9px Arial, sans-serif";
      ctx.fillText(lines[0], tx, cy + ch / 2 - 2);
      ctx.fillText(lines[1], tx, cy + ch / 2 + 10);
    } else {
      ctx.fillText(text, tx, cy + ch / 2 + 4);
    }
    ctx.restore();
  };

  // Cabeçalho
  let y = padY + titleH;
  ctx.fillStyle = "#d1d5db";
  ctx.fillRect(padX, y, tableW, headH);
  ctx.strokeStyle = "#9ca3af";
  ctx.lineWidth = 0.5;
  ctx.strokeRect(padX, y, tableW, headH);
  ctx.fillStyle = "#111827";
  ctx.font = "bold 9.5px Arial, sans-serif";
  let x = padX;
  for (const col of cols) {
    if (x > padX) {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + headH); ctx.stroke();
    }
    drawCell(col.label.toUpperCase(), x, y, col.width, headH, col.align);
    x += col.width;
  }

  // Linhas de dados
  y += headH;
  for (let i = 0; i < lancamentos.length; i++) {
    const l = lancamentos[i];
    ctx.fillStyle = i % 2 === 0 ? "#ffffff" : "#f8fafc";
    ctx.fillRect(padX, y, tableW, rowH);
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 0.5;
    ctx.strokeRect(padX, y, tableW, rowH);

    const vals = [
      l.descricao,
      `I: ${formatDate(l.dataInicial)}\nC: ${formatDate(l.dataCalculo)}`,
      formatBRL(l.valorPrincipal),
      l.indiceCorrecao,
      formatBRL(l.valorAtualizado),
      String(l.dias),
      formatPercent(l.percentualCorrecao),
      l.indiceJuros,
      formatBRL(l.juros),
      formatBRL(l.total),
    ];

    x = padX;
    for (let j = 0; j < cols.length; j++) {
      if (x > padX) {
        ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + rowH); ctx.stroke();
      }
      ctx.fillStyle = j === 5 ? "#1d4ed8" : j === 9 ? "#15803d" : "#374151";
      ctx.font = j === 0 || j === 9 ? "bold 10px Arial, sans-serif" : "10px Arial, sans-serif";
      drawCell(vals[j], x, y, cols[j].width, rowH, cols[j].align);
      x += cols[j].width;
    }
    y += rowH;
  }

  // Linha de totais
  if (hasTotals) {
    const tP = lancamentos.reduce((s, l) => s + l.valorPrincipal, 0);
    const tA = lancamentos.reduce((s, l) => s + l.valorAtualizado, 0);
    const tD = lancamentos.reduce((s, l) => s + l.dias, 0);
    const tJ = lancamentos.reduce((s, l) => s + l.juros, 0);
    const tG = lancamentos.reduce((s, l) => s + l.total, 0);

    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(padX, y, tableW, rowH);
    ctx.strokeStyle = "#9ca3af"; ctx.lineWidth = 1;
    ctx.strokeRect(padX, y, tableW, rowH);

    const totVals = [
      "Total Geral", "", formatBRL(tP), "", formatBRL(tA),
      String(tD), "", "", formatBRL(tJ), formatBRL(tG),
    ];
    x = padX;
    for (let j = 0; j < cols.length; j++) {
      if (x > padX) {
        ctx.strokeStyle = "#9ca3af"; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + rowH); ctx.stroke();
      }
      ctx.fillStyle = j === 5 ? "#1d4ed8" : j === 9 ? "#15803d" : "#111827";
      ctx.font = "bold 10px Arial, sans-serif";
      drawCell(totVals[j], x, y, cols[j].width, rowH, cols[j].align);
      x += cols[j].width;
    }
  }

  // ── Download da imagem ──────────────────────────────────────────────────────
  await new Promise<void>((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) { alert("Erro ao gerar imagem."); resolve(); return; }
      const url  = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = "tabela-lancamentos.jpg";
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      resolve();
    }, "image/jpeg", 0.95);
  });

  // ── Salvar no backend ───────────────────────────────────────────────────────
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

  return link;
}
