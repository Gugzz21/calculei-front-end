import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { LancamentoItem } from "../App";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useRef } from 'react';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import MdPictureAsPdf from '@mui/icons-material/PictureAsPdf';

interface LancamentosProps {
  lancamentos: LancamentoItem[];
  loading?: boolean;
  onRemover: (id: number) => void;
}


function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function formatPercent(value: number): string {
  return `${Number(value).toFixed(4)}%`;
}

function Lancamentos({
  lancamentos,
  loading = false,
  onRemover,
}: LancamentosProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const tableRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.max(1, Math.ceil(lancamentos.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = lancamentos.slice(startIndex, startIndex + itemsPerPage);

  const [pageInput, setPageInput] = useState(currentPage.toString());

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const exportarParaPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.setTextColor(40);
    doc.text('Relatório de Lançamentos', 14, 15);

    const colunas = [
      'Descrição', 'Data Inicial', 'Data Calculo', 'Valor Principal',
      'Índice', 'Valor Atualizado', 'Dias', '% Correção', 'Juros', 'Total'
    ];

    const linhas = lancamentos.map((l) => [
      l.descricao,
      `Data Inicial: ${formatDate(l.dataInicial)}\nData Cálculo: ${formatDate(l.dataCalculo)}`,
      formatBRL(l.valorPrincipal),
      l.indiceCorrecao,
      formatBRL(l.valorAtualizado),
      l.dias.toString(),
      formatPercent(l.percentualCorrecao),
      formatBRL(l.juros),
      formatBRL(l.total),
    ]);

    const columnStyles: { [key: number]: any } = {
      0: { cellWidth: 'auto', halign: 'left' },
      1: { cellWidth: 35, halign: 'left', fontSize: 7 }, // Coluna de Datas com fonte menor
      2: { cellWidth: 28, halign: 'right' },
      3: { cellWidth: 30, halign: 'left' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 15, halign: 'center' },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 28, halign: 'right' },
      8: { cellWidth: 28, halign: 'right' },
    };

    autoTable(doc, {
      head: [colunas],
      body: linhas,
      startY: 25,
      margin: { left: 14, right: 14 },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        valign: 'middle',
        // --- AQUI ESTÁ A MUDANÇA ---
        lineWidth: 0.1,           // Espessura da linha
        lineColor: [180, 180, 180] // Cor da linha (cinza médio)
      },
      headStyles: {
        fillColor: [209, 213, 219],
        textColor: 0,
        fontStyle: 'bold',
        lineWidth: 0.2,           // Linha um pouco mais grossa no cabeçalho
      },
      columnStyles: columnStyles,
      // Desativei o alternateRowStyles para a linha separadora aparecer melhor em todos os itens
      alternateRowStyles: {
        fillColor: [255, 255, 255]
      }
    });

    if (lancamentos.length > 1) {
      const finalY = (doc as any).lastAutoTable.finalY;

      const totals = {
        principal: lancamentos.reduce((s, l) => s + l.valorPrincipal, 0),
        atualizado: lancamentos.reduce((s, l) => s + l.valorAtualizado, 0),
        dias: lancamentos.reduce((s, l) => s + l.dias, 0),
        juros: lancamentos.reduce((s, l) => s + l.juros, 0),
        total: lancamentos.reduce((s, l) => s + l.total, 0),
      };

      autoTable(doc, {
        body: [[
          'TOTAL GERAL', '', formatBRL(totals.principal), '',
          formatBRL(totals.atualizado), totals.dias.toString(), '',
          formatBRL(totals.juros), formatBRL(totals.total),
        ]],
        startY: finalY,
        margin: { left: 14, right: 14 },
        styles: {
          fontSize: 8,
          fontStyle: 'bold',
          fillColor: [243, 244, 246],
          textColor: [0, 0, 0],
          lineWidth: 0.1,           // Linha no total para fechar a tabela
          lineColor: [180, 180, 180]
        },
        columnStyles: columnStyles,
      });
    }

    const totalPages = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
    }

    doc.save('relatorio-lancamentos.pdf');
  };

  const baixarImagem = () => {
    if (lancamentos.length === 0) {
      alert('Nenhum lançamento para exportar.');
      return;
    }

    // Definição das colunas: label, largura (px), alinhamento
    const cols = [
      { label: 'Descrição', width: 160, align: 'left' as const },
      { label: 'Datas', width: 100, align: 'left' as const },
      { label: 'Valor Principal', width: 110, align: 'right' as const },
      { label: 'Índice', width: 110, align: 'left' as const },
      { label: 'Valor Atualizado', width: 115, align: 'right' as const },
      { label: 'Dias', width: 55, align: 'center' as const },
      { label: '%Correção', width: 85, align: 'right' as const },
      { label: 'Juros', width: 100, align: 'right' as const },
      { label: 'Total', width: 110, align: 'right' as const },
    ];

    const scale = 2;
    const padX = 28;
    const padY = 24;
    const rowH = 32;
    const headH = 38;
    const titleH = 56;
    const hasTotals = lancamentos.length > 1;
    const tableW = cols.reduce((s, c) => s + c.width, 0);
    const canvasW = tableW + padX * 2;
    const canvasH = padY + titleH + headH + rowH * lancamentos.length + (hasTotals ? rowH : 0) + padY;

    const canvas = document.createElement('canvas');
    canvas.width = canvasW * scale;
    canvas.height = canvasH * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);

    // ── fundo branco ──────────────────────────────────────────
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // ── título ────────────────────────────────────────────────
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 15px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Relatório de Lançamentos', padX, padY + 20);
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px Arial, sans-serif';
    ctx.fillText(`Total de registros: ${lancamentos.length}`, padX, padY + 38);

    // helper: desenha texto com clipping na célula
    const drawCell = (
      text: string, cx: number, cy: number, cw: number, ch: number,
      align: 'left' | 'center' | 'right'
    ) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(cx + 2, cy, cw - 4, ch);
      ctx.clip();
      const tx = align === 'right' ? cx + cw - 8
        : align === 'center' ? cx + cw / 2
          : cx + 8;
      ctx.textAlign = align;

      if (text.includes('\n')) {
        const lines = text.split('\n');
        ctx.font = '9px Arial, sans-serif'; // Fonte menor para datas múltiplas
        ctx.fillText(lines[0], tx, cy + ch / 2 - 2);
        ctx.fillText(lines[1], tx, cy + ch / 2 + 10);
      } else {
        ctx.fillText(text, tx, cy + ch / 2 + 4);
      }
      ctx.restore();
    };

    // ── cabeçalho ────────────────────────────────────────────
    let y = padY + titleH;
    ctx.fillStyle = '#d1d5db';
    ctx.fillRect(padX, y, tableW, headH);
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(padX, y, tableW, headH);

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 10px Arial, sans-serif';
    let x = padX;
    for (const col of cols) {
      // linha vertical separando colunas
      if (x > padX) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + headH);
        ctx.stroke();
      }
      drawCell(col.label.toUpperCase(), x, y, col.width, headH, col.align);
      x += col.width;
    }

    // ── linhas de dados ───────────────────────────────────────
    y += headH;
    for (let i = 0; i < lancamentos.length; i++) {
      const l = lancamentos[i];
      ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#f8fafc';
      ctx.fillRect(padX, y, tableW, rowH);
      ctx.strokeStyle = '#cbd5e1';
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
        formatBRL(l.juros),
        formatBRL(l.total),
      ];

      x = padX;
      for (let j = 0; j < cols.length; j++) {
        if (x > padX) {
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + rowH);
          ctx.stroke();
        }
        ctx.fillStyle = j === 5 ? '#1d4ed8' : j === 9 ? '#15803d' : '#374151';
        ctx.font = (j === 0 || j === 9) ? 'bold 11px Arial, sans-serif' : '11px Arial, sans-serif';
        drawCell(vals[j], x, y, cols[j].width, rowH, cols[j].align);
        x += cols[j].width;
      }
      y += rowH;
    }

    // ── linha de totais ───────────────────────────────────────
    if (hasTotals) {
      const tPrincipal = lancamentos.reduce((s, l) => s + l.valorPrincipal, 0);
      const tAtualizado = lancamentos.reduce((s, l) => s + l.valorAtualizado, 0);
      const tDias = lancamentos.reduce((s, l) => s + l.dias, 0);
      const tJuros = lancamentos.reduce((s, l) => s + l.juros, 0);
      const tGeral = lancamentos.reduce((s, l) => s + l.total, 0);

      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(padX, y, tableW, rowH);
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1;
      ctx.strokeRect(padX, y, tableW, rowH);

      const totVals = [
        'Total Geral', '', formatBRL(tPrincipal), '',
        formatBRL(tAtualizado), String(tDias), '',
        formatBRL(tJuros), formatBRL(tGeral),
      ];
      x = padX;
      for (let j = 0; j < cols.length; j++) {
        if (x > padX) {
          ctx.strokeStyle = '#9ca3af';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + rowH);
          ctx.stroke();
        }
        ctx.fillStyle = j === 5 ? '#1d4ed8' : j === 9 ? '#15803d' : '#111827';
        ctx.font = 'bold 11px Arial, sans-serif';
        drawCell(totVals[j], x, y, cols[j].width, rowH, cols[j].align);
        x += cols[j].width;
      }
    }

    // ── download ──────────────────────────────────────────────
    canvas.toBlob((blob) => {
      if (!blob) { alert('Erro ao gerar imagem.'); return; }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'tabela-lancamentos.jpg';
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 'image/jpeg', 0.95);
  };

  return (
    <div className="flex flex-col bg-slate-50 rounded-lg pb-6 w-full p-4 md:p-8 mt-6 gap-5 shadow-sm border border-slate-400 overflow-hidden">
      <div className="flex items-center justify-between text-gray-400 text-[18px] font-bold gap-3">
        <h1 className="text-[24px] text-[#1F2022] font-bold">
          Lançamentos
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Ir para:</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={() => {
                let p = parseInt(pageInput);
                if (isNaN(p) || p < 1) p = 1;
                if (p > totalPages) p = totalPages;
                setCurrentPage(p);
                setPageInput(p.toString());
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  let p = parseInt(e.currentTarget.value);
                  if (isNaN(p) || p < 1) p = 1;
                  if (p > totalPages) p = totalPages;
                  setCurrentPage(p);
                  setPageInput(p.toString());
                }
              }}
              className="w-16 h-8 text-center border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className={`flex items-center justify-center w-8 h-8 rounded border ${currentPage === 1
                ? "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
                : "border-gray-300 text-gray-700 bg-white hover:bg-gray-100"
                } transition-colors`}
              title="Página Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`w-8 h-8 rounded border text-sm font-medium ${currentPage === idx + 1
                    ? "border-blue-500 bg-blue-50 text-blue-600"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className={`flex items-center justify-center w-8 h-8 rounded border ${currentPage === totalPages
                ? "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
                : "border-gray-300 text-gray-700 bg-white hover:bg-gray-100"
                } transition-colors`}
              title="Próxima Página"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-start">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={exportarParaPDF}
            disabled={lancamentos.length === 0}
            title="Gerar PDF"
            className={`w-[150px] h-[40px] flex items-center justify-center gap-2 px-5 py-2 rounded-md transition-all font-medium shadow-sm ${lancamentos.length === 0
              ? "bg-[#f1f3f5] border border-[#d2d6dc] text-[#adb5bd] cursor-not-allowed"
              : "bg-white border border-[#ADB4C2] text-[#1F2022] hover:bg-slate-50 cursor-pointer"
              }`}
          >
            <MdPictureAsPdf className="h-[20px] w-[20px]" />
            <span className="text-[14px]">Gerar PDF</span>
          </button>
          <button
            type="button"
            onClick={baixarImagem}
            disabled={lancamentos.length === 0}
            title="Printar e copiar"
            className={`w-[200px] h-[40px] flex items-center justify-center gap-2 px-5 py-2 rounded-md transition-all font-medium shadow-sm ${lancamentos.length === 0
              ? "bg-[#f1f3f5] border border-[#d2d6dc] text-[#adb5bd] cursor-not-allowed"
              : "bg-white border border-[#ADB4C2] text-[#1F2022] hover:bg-slate-50 cursor-pointer"
              }`}
          >
            <ImageOutlinedIcon className="h-[20px] w-[20px]" />
            <span className="text-[14px]">Printar e salvar</span>
          </button>
        </div>
      </div>

      {lancamentos.length === 0 && !loading ? (
        <p className="text-sm text-gray-400 italic">
          Nenhum cálculo realizado ainda. Preencha os dados acima e clique em
          Calcular.
        </p>
      ) : (
        <div ref={tableRef} className="flex flex-col gap-4">
          <div className="overflow-x-auto w-full">
            <table className="text-sm text-gray-700 w-full">
              <thead>
                <tr className="border-b-2 border-gray-300 text-left text-[12px] text-black bg-gray-300 uppercase divide-x divide-slate-500">
                  <th className="pb-2 pt-2 pl-2 pr-4 underline px-6">
                    #
                  </th>
                  <th className="pb-2 pt-2 pr-4 underline px-6">
                    Descrição
                  </th>
                  <th className="pb-2 pt-2 pr-4 underline px-6">
                    Data
                  </th>
                  <th className="pb-2 pt-2 pr-4 underline px-6">
                    Valor Principal
                  </th>
                  <th className="pb-2 pt-2 pr-4 underline px-6">
                    Índice de Correção
                  </th>
                  <th className="pb-2 pt-2 pr-4 underline px-6">%Correção</th>
                  <th className="pb-2 pt-2 pr-4 underline px-6">
                    Valor Atualizado
                  </th>
                  <th className="pb-2 pt-2 pr-4 underline px-6">Dias</th>

                  <th className="pb-2 pt-2 pr-4 underline px-6">Juros</th>
                  <th className="pb-2 pt-2 pr-4 underline px-6">Total</th>
                  <th className="pb-2 pt-2 pr-4 underline px-6">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-500">
                {currentItems.map((l, index) => (
                  <tr
                    key={l.id}
                    className="hover:bg-gray-50 transition-colors divide-x divide-slate-500"
                  >
                    <td className="py-3 pl-4 pr-6 font-medium">
                      {startIndex + index + 1}
                    </td>
                    <td className="py-3 pl-4 pr-6 font-medium">
                      {l.descricao}
                    </td>
                    <td className="py-3 pl-4 pr-6 text-[11px] leading-tight">
                      <div className="flex flex-col">
                        <span className="text-gray-600 font-medium">Data Inicial: {formatDate(l.dataInicial)}</span>
                        <span className="text-gray-600 font-bold">Data Cálculo: {formatDate(l.dataCalculo)}</span>
                      </div>
                    </td>
                    <td className="py-3 pl-4 pr-6">
                      {formatBRL(l.valorPrincipal)}
                    </td>
                    <td className="py-3 pl-4 pr-6">{l.indiceCorrecao}</td>
                    <td className="py-3 pl-4 pr-6">
                      {formatPercent(l.percentualCorrecao)}
                    </td>
                    <td className="py-3 pl-4 pr-6 text-blue-700 font-semibold">
                      {formatBRL(l.valorAtualizado)}
                    </td>
                    <td className="py-3 pl-4 pr-6">{l.dias}</td>

                    <td className="py-3 pl-4 pr-6">{formatBRL(l.juros)}</td>

                    <td className="py-3 pl-4 pr-6 text-green-700 font-bold">
                      {formatBRL(l.total)}
                    </td>
                    <td className="py-3 pl-4 pr-6">
                      <button
                        onClick={() => {
                          onRemover(l.id);
                          if (currentItems.length === 1 && currentPage > 1) {
                            setCurrentPage((prev) => prev - 1);
                          }
                        }}
                        className="text-red-400 hover:text-red-600 transition-colors text-xs font-semibold px-2 py-1 rounded border border-red-200 hover:border-red-400"
                        title="Remover lançamento"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

              {lancamentos.length > 1 && currentPage === totalPages && (
                <tfoot>
                  <tr className="border-t-2 border-gray-400 text-sm font-bold text-gray-700 bg-gray-100 divide-x divide-slate-400">
                    <td className="py-3 pl-4 pr-6" colSpan={3}>
                      Total Geral
                    </td>
                    <td className="py-3 pl-4 pr-6">
                      {formatBRL(
                        lancamentos.reduce((s, l) => s + l.valorPrincipal, 0),
                      )}
                    </td>
                    <td className="py-3 pl-4 pr-6" colSpan={2}></td>
                    <td className="py-3 pl-4 pr-6 text-blue-700">
                      {formatBRL(
                        lancamentos.reduce((s, l) => s + l.valorAtualizado, 0),
                      )}
                    </td>
                    <td className="py-3 pl-4 pr-6 text-center">
                      {lancamentos.reduce((s, l) => s + l.dias, 0)}
                    </td>
                    <td className="py-3 pl-4 pr-6">
                      {formatBRL(lancamentos.reduce((s, l) => s + l.juros, 0))}
                    </td>
                    <td className="py-3 pl-4 pr-6 text-green-700">
                      {formatBRL(lancamentos.reduce((s, l) => s + l.total, 0))}
                    </td>
                    <td className="py-3 pl-4 pr-6"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {lancamentos.length > 0 && (
            <div className="flex flex-col md:flex-row justify-between items-center mt-4 border-t border-gray-200 pt-4 gap-4">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <span className="text-sm text-gray-500">
                  Mostrando{" "}
                  <span className="font-semibold text-gray-700">
                    {startIndex + 1}
                  </span>{" "}
                  até{" "}
                  <span className="font-semibold text-gray-700">
                    {Math.min(startIndex + itemsPerPage, lancamentos.length)}
                  </span>{" "}
                  de{" "}
                  <span className="font-semibold text-gray-700">
                    {lancamentos.length}
                  </span>{" "}
                  registros
                </span>

                <div className="flex items-center gap-2">
                  <label htmlFor="itemsPerPage" className="text-sm text-gray-500">
                    Itens por página:
                  </label>
                  <select
                    id="itemsPerPage"
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500 text-gray-700"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Ir para:</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    onBlur={() => {
                      let p = parseInt(pageInput);
                      if (isNaN(p) || p < 1) p = 1;
                      if (p > totalPages) p = totalPages;
                      setCurrentPage(p);
                      setPageInput(p.toString());
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        let p = parseInt(e.currentTarget.value);
                        if (isNaN(p) || p < 1) p = 1;
                        if (p > totalPages) p = totalPages;
                        setCurrentPage(p);
                        setPageInput(p.toString());
                      }
                    }}
                    className="w-16 h-8 text-center border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handlePrev}
                    disabled={currentPage === 1}
                    className={`flex items-center justify-center w-8 h-8 rounded border ${currentPage === 1
                      ? "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
                      : "border-gray-300 text-gray-700 bg-white hover:bg-gray-100"
                      } transition-colors`}
                    title="Página Anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(idx + 1)}
                        className={`w-8 h-8 rounded border text-sm font-medium ${currentPage === idx + 1
                          ? "border-blue-500 bg-blue-50 text-blue-600"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                          }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    className={`flex items-center justify-center w-8 h-8 rounded border ${currentPage === totalPages
                      ? "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
                      : "border-gray-300 text-gray-700 bg-white hover:bg-gray-100"
                      } transition-colors`}
                    title="Próxima Página"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Lancamentos;