import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { LancamentoItem } from "../App";
import { FaFilePdf, FaImage } from "react-icons/fa";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import React, { useRef } from 'react';
import { toJpeg } from 'html-to-image';

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
      'Descrição', 'Data Inicial', 'Valor Principal', 'Data Cálculo',
      'Índice', 'Valor Atualizado', 'Dias', '% Correção', 'Juros', 'Total'
    ];

    const linhas = lancamentos.map((l) => [
      l.descricao,
      formatDate(l.dataInicial),
      formatBRL(l.valorPrincipal),
      formatDate(l.dataCalculo),
      l.indiceCorrecao,
      formatBRL(l.valorAtualizado),
      l.dias.toString(),
      formatPercent(l.percentualCorrecao),
      formatBRL(l.juros),
      formatBRL(l.total),
    ]);

    const columnStyles: { [key: number]: any } = {
      0: { cellWidth: 'auto', halign: 'left' },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 28, halign: 'right' },
      3: { cellWidth: 25, halign: 'center' },
      4: { cellWidth: 30, halign: 'left' },
      5: { cellWidth: 28, halign: 'right' },
      6: { cellWidth: 15, halign: 'center' },
      7: { cellWidth: 22, halign: 'right' },
      8: { cellWidth: 28, halign: 'right' },
      9: { cellWidth: 28, halign: 'right' },
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
          'TOTAL GERAL', '', formatBRL(totals.principal), '', '',
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

  const baixarImagem = async () => {
    console.log('baixarImagem chamado');
    const elemento = tableRef.current;
    if (!elemento) {
      console.warn('tableRef.current é null');
      alert('Nenhuma tabela encontrada. Adicione lançamentos primeiro.');
      return;
    }
    try {
      const dataUrl = await toJpeg(elemento, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = 'tabela-lancamentos.jpg';
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('Download iniciado.');
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      alert('Erro ao gerar imagem: ' + String(error));
    }
  };

  return (
    <div className="flex flex-col bg-slate-50 rounded-lg pb-6 w-full p-4 md:p-8 mt-6 gap-5 shadow-sm border border-slate-400 overflow-hidden">
      <div className="flex items-center justify-end text-gray-400 text-[18px] font-bold">
        <h1>Página {currentPage} de {totalPages}</h1>
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-[24px] text-gray-700 font-bold underline">
          Lançamentos
        </h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={exportarParaPDF}
            title="Exportar para PDF"
            className="p-0 m-0 bg-transparent border-none cursor-pointer flex items-center"
          >
            <FaFilePdf className="text-red-600 hover:text-red-700 transition-colors h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={baixarImagem}
            title="Baixar como Imagem (JPG)"
            className="p-0 m-0 bg-transparent border-none cursor-pointer flex items-center"
          >
            <FaImage className="text-blue-600 hover:text-blue-800 transition-colors h-6 w-6" />
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
                    Descrição
                  </th>
                  <th className="pb-2 pt-2 pr-4 underline px-6">
                    Data Inicial
                  </th>
                  <th className="pb-2 pt-2 pr-4 underline px-6">
                    Valor Principal
                  </th>
                  <th className="pb-2 pt-2 pr-4 underline px-6">
                    Data do Cálculo
                  </th>
                  <th className="pb-2 pt-2 pr-4 underline px-6">
                    Índice de Correção
                  </th>
                  <th className="pb-2 pt-2 pr-4 underline px-6">
                    Valor Atualizado
                  </th>
                  <th className="pb-2 pt-2 pr-4 underline px-6">Dias</th>
                  <th className="pb-2 pt-2 pr-4 underline px-6">%Correção</th>
                  <th className="pb-2 pt-2 pr-4 underline px-6">Juros</th>
                  <th className="pb-2 pt-2 pr-4 underline px-6">Total</th>
                  <th className="pb-2 pt-2 pr-4 underline px-6">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-500">
                {currentItems.map((l) => (
                  <tr
                    key={l.id}
                    className="hover:bg-gray-50 transition-colors divide-x divide-slate-500"
                  >
                    <td className="py-3 pl-4 pr-6 font-medium">
                      {l.descricao}
                    </td>
                    <td className="py-3 pl-4 pr-6">
                      {formatDate(l.dataInicial)}
                    </td>
                    <td className="py-3 pl-4 pr-6">
                      {formatBRL(l.valorPrincipal)}
                    </td>
                    <td className="py-3 pl-4 pr-6">
                      {formatDate(l.dataCalculo)}
                    </td>
                    <td className="py-3 pl-4 pr-6">{l.indiceCorrecao}</td>
                    <td className="py-3 pl-4 pr-6 text-blue-700 font-semibold">
                      {formatBRL(l.valorAtualizado)}
                    </td>
                    <td className="py-3 pl-4 pr-6">{l.dias}</td>
                    <td className="py-3 pl-4 pr-6">
                      {formatPercent(l.percentualCorrecao)}
                    </td>
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
                    <td className="py-3 pl-4 pr-6" colSpan={2}>
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
                    <td className="py-3 pl-4 pr-6">
                      {lancamentos.reduce((s, l) => s + l.dias, 0)}
                    </td>
                    <td className="py-3 pl-4 pr-6"></td>
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