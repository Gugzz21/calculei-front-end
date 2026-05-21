import { useState, useRef } from "react";
import { saveAs } from "file-saver";
import { usePagination } from "../../hooks/usePagination";
import { useCalculadoraContext } from "../../contexts/CalculadoraContext";
import type { LancamentoItem } from "../../types";
import Paginacao from "./Paginacao";
import TabelaLancamentos from "./TabelaLancamentos";
import BotoesExport from "./BotoesExport";
import ModalRelatorio from "./ModalRelatorio";
import ModalDuplicar from "./ModalDuplicar";
import { exportarParaPDF } from "./exportPDF";
import { baixarImagem } from "./exportImagem";
import { exportarParaExcel } from "./exportExcel";
import toast from "react-hot-toast";

function Lancamentos() {
  const {
    lancamentos,
    loading,
    handleRemoverLancamento,
    handleEditar,
    handleConfirmarDuplicacao,
    ufirValue
  } = useCalculadoraContext();

  const tableRef = useRef<HTMLDivElement>(null);

  // ── Paginação ──────────────────────────────────────────────────────────────
  const {
    currentPage,
    itemsPerPage,
    pageInput,
    totalPages,
    startIndex,
    setPageInput,
    handleGoToPage,
    handlePrevPage,
    handleNextPage,
    handleItemsPerPageChange,
    handleItemRemoved
  } = usePagination({ totalItems: lancamentos.length });

  const currentItems = lancamentos.slice(startIndex, startIndex + itemsPerPage);

  // ── Modais ─────────────────────────────────────────────────────────────────
  const [modalExport, setModalExport] = useState<{
    type: "pdf" | "imagem" | "excel";
    token: string;
    data?: any;
  } | null>(null);
  const [duplicandoItem, setDuplicandoItem] = useState<LancamentoItem | null>(null);
  const [salvandoPDF, setSalvandoPDF] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleGerarPDF = async () => {
    setSalvandoPDF(true);
    try {
      const { token, doc } = await exportarParaPDF(lancamentos, ufirValue);
      setModalExport({ type: "pdf", token, data: doc });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido.";
      if (msg.includes("histórico")) {
        alert(`PDF gerado, mas não foi possível salvar o token:\n${msg}`);
      } else {
        alert(`Erro ao gerar PDF: ${msg}`);
      }
    } finally {
      setSalvandoPDF(false);
    }
  };

  const handleBaixarImagem = async () => {
    setIsExporting(true);
    setTimeout(async () => {
      if (!exportRef.current) {
        setIsExporting(false);
        return;
      }
      try {
        const result = await baixarImagem(lancamentos, exportRef.current);
        if (result) {
          setModalExport({ type: "imagem", token: result.token, data: result.dataUrl });
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Erro desconhecido.";
        if (msg.includes("histórico")) {
          alert(`Imagem gerada, mas não foi possível salvar o token:\n${msg}`);
        } else {
          alert(`Erro ao gerar imagem: ${msg}`);
        }
      } finally {
        setIsExporting(false);
      }
    }, 300);
  };

  const handleRemover = (id: number, isLastInPage: boolean) => {
    if (window.confirm("Tem certeza que deseja remover este lançamento?")) {
      handleRemoverLancamento(id);
      handleItemRemoved(isLastInPage);
      toast.success("Lançamento removido com sucesso!");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {modalExport && (
        <ModalRelatorio
          type={modalExport.type}
          token={modalExport.token}
          onClose={() => setModalExport(null)}
          onDownload={() => {
            if (!modalExport.data) return;
            if (modalExport.type === "pdf") {
              modalExport.data.save("relatorio-lancamentos.pdf");
            } else if (modalExport.type === "excel") {
              saveAs(modalExport.data.blob, modalExport.data.filename);
            } else if (modalExport.type === "imagem") {
              const link = document.createElement("a");
              link.download = "tabela-lancamentos.jpg";
              link.href = modalExport.data;
              link.click();
            }
            setModalExport(null);
          }}
        />
      )}
      <ModalDuplicar
        isOpen={!!duplicandoItem}
        onClose={() => setDuplicandoItem(null)}
        lancamentoBase={duplicandoItem}
        onConfirmar={(datas) => {
          if (duplicandoItem) handleConfirmarDuplicacao(duplicandoItem.id, datas);
          setDuplicandoItem(null);
        }}
      />

      <div className="flex flex-col bg-slate-50 dark:bg-[#0d1117]/95 rounded-lg pb-6 w-full p-3 sm:p-5 md:p-8 gap-4 sm:gap-5 shadow-sm border border-slate-400 dark:border-[#21262d]/60 overflow-hidden transition-colors duration-200">

        {/* Cabeçalho + paginação superior */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl text-[#1F2022] dark:text-slate-100 font-bold shrink-0">Lançamentos</h1>
          <div className="flex justify-start sm:justify-end">
            <Paginacao
              currentPage={currentPage}
              totalPages={totalPages}
              pageInput={pageInput}
              onPageInput={setPageInput}
              onGoToPage={handleGoToPage}
              onPrev={handlePrevPage}
              onNext={handleNextPage}
            />
          </div>
        </div>

        {/* Botões de exportação */}
        <BotoesExport
          temLancamentos={lancamentos.length > 0}
          salvandoPDF={salvandoPDF}
          onGerarPDF={handleGerarPDF}
          onBaixarImagem={handleBaixarImagem}
          onExportarExcel={async () => {
            try {
              const { token, blob, filename } = await exportarParaExcel(lancamentos, ufirValue);
              setModalExport({ type: "excel", token, data: { blob, filename } });
            } catch (e) {
              toast.error("Erro ao gerar o Excel.");
              console.error(e);
            }
          }}
        />

        {/* Conteúdo */}
        {lancamentos.length === 0 && !loading ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">
            Nenhum cálculo realizado ainda. Preencha os dados acima e clique em Calcular.
          </p>
        ) : (
          <div ref={tableRef} className="flex flex-col gap-4">
            <TabelaLancamentos
              currentItems={currentItems}
              startIndex={startIndex}
              currentPage={currentPage}
              totalPages={totalPages}
              onRemover={handleRemover}
              onEditar={handleEditar}
              onDuplicar={setDuplicandoItem}
            />

            {/* Rodapé: info de paginação + seletor + paginação inferior */}
            {lancamentos.length > 0 && (
              <div className="flex flex-col gap-3 mt-4 border-t border-gray-200 dark:border-[#21262d] pt-4">
                {/* Linha de meta-info: total de registros + itens por página */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Mostrando{" "}
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{startIndex + 1}</span>{" "}
                    até{" "}
                    <span className="font-semibold text-gray-700 dark:text-gray-200">
                      {Math.min(startIndex + itemsPerPage, lancamentos.length)}
                    </span>{" "}
                    de{" "}
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{lancamentos.length}</span>{" "}
                    registros
                  </span>

                  <div className="flex items-center gap-2">
                    <label htmlFor="itemsPerPage" className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      Itens por página:
                    </label>
                    <select
                      id="itemsPerPage"
                      className="bg-white dark:bg-[#010409] border border-gray-300 dark:border-[#21262d] rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500 text-gray-700 dark:text-gray-200"
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                    </select>
                  </div>
                </div>

                {/* Paginação inferior */}
                <div className="flex justify-start sm:justify-end">
                  <Paginacao
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageInput={pageInput}
                    onPageInput={setPageInput}
                    onGoToPage={handleGoToPage}
                    onPrev={handlePrevPage}
                    onNext={handleNextPage}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Componente Oculto para Exportação de Imagem ── */}
      {isExporting && (
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
          <div ref={exportRef} className="w-[1200px] bg-white p-8">
            <h2 className="text-[24px] text-[#1F2022] font-bold mb-6">Relatório de Lançamentos</h2>
            <TabelaLancamentos
              currentItems={lancamentos}
              startIndex={0}
              currentPage={1}
              totalPages={1}
              onRemover={() => { }}
              onEditar={() => { }}
              onDuplicar={() => { }}
              forceExpand={true}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default Lancamentos;
