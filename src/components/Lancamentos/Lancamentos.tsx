import { useState, useRef, useMemo, useCallback } from "react";
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

  const currentItems = useMemo(
    () => lancamentos.slice(startIndex, startIndex + itemsPerPage),
    [lancamentos, startIndex, itemsPerPage]
  );

  // ── Modais ─────────────────────────────────────────────────────────────────
  const [modalExport, setModalExport] = useState<{
    type: "pdf" | "imagem" | "excel";
    token: string;
    data?: any;
  } | null>(null);
  const [duplicandoItem, setDuplicandoItem] = useState<LancamentoItem | null>(null);
  const [salvandoPDF, setSalvandoPDF] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleGerarPDF = useCallback(async () => {
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
  }, [lancamentos, ufirValue]);

  const handleBaixarImagem = useCallback(async () => {
    if (!exportRef.current) return;
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
    }
  }, [lancamentos]);

  const handleRemover = useCallback((id: number, isLastInPage: boolean) => {
    if (window.confirm("Tem certeza que deseja remover este lançamento?")) {
      handleRemoverLancamento(id);
      handleItemRemoved(isLastInPage);
      toast.success("Lançamento removido com sucesso!");
    }
  }, [handleRemoverLancamento, handleItemRemoved]);

  const handleExportarExcel = useCallback(async () => {
    try {
      const { token, blob, filename } = await exportarParaExcel(lancamentos, ufirValue);
      setModalExport({ type: "excel", token, data: { blob, filename } });
    } catch (e) {
      toast.error("Erro ao gerar o Excel.");
      console.error(e);
    }
  }, [lancamentos, ufirValue]);

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

      <div id="tour-tabela" className="flex flex-col bg-slate-100 dark:bg-[#0d1117]/95 rounded-lg pb-6 w-full p-3 sm:p-5 md:p-8 gap-4 sm:gap-5 shadow-sm border border-slate-500 dark:border-[#21262d]/60 overflow-hidden transition-colors duration-200">

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
          onExportarExcel={handleExportarExcel}
        />

        {/* Conteúdo */}
        {loading && lancamentos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 bg-white dark:bg-[#161b22] border border-slate-300 dark:border-[#30363d] rounded-lg shadow-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent border-[#073365] dark:border-[#007aff]"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold animate-pulse">Buscando dados e realizando os cálculos...</p>
          </div>
        ) : lancamentos.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">
            Nenhum cálculo realizado ainda. Preencha os dados acima e clique em Calcular.
          </p>
        ) : (
          <div ref={tableRef} className="relative flex flex-col gap-4">
            {loading && (
              <div className="absolute inset-0 bg-white/70 dark:bg-[#0d1117]/70 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-lg">
                <div className="flex flex-col items-center gap-2 bg-white dark:bg-[#161b22] px-6 py-4 rounded-xl shadow-lg border border-slate-300 dark:border-slate-800">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-t-transparent border-[#073365] dark:border-[#007aff]"></div>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Atualizando...</span>
                </div>
              </div>
            )}
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
              <div className="flex flex-col gap-3 mt-4 border-t border-gray-200 dark:border-[#21262d] pt-4 exclude-from-print">
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
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px", opacity: 0, pointerEvents: 'none' }}>
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
    </>
  );
}

export default Lancamentos;
