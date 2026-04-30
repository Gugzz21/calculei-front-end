import { useState, useRef } from "react";
import type { LancamentoItem } from "../../App";
import { usePagination } from "../../hooks/usePagination";

import Paginacao from "./Paginacao";
import TabelaLancamentos from "./TabelaLancamentos";
import BotoesExport from "./BotoesExport";
import ModalToken from "./ModalToken";
import ModalDuplicar from "./ModalDuplicar";
import { exportarParaPDF } from "./exportPDF";
import { baixarImagem } from "./exportImagem";

interface LancamentosProps {
  lancamentos: LancamentoItem[];
  loading?: boolean;
  onRemover: (id: number) => void;
  onEditar: (id: number) => void;
  onLimparTodos: () => void;
  onConfirmarDuplicacao: (idOriginal: number, datas: string[]) => void;
}

function Lancamentos({ lancamentos, loading = false, onRemover, onEditar, onLimparTodos, onConfirmarDuplicacao }: LancamentosProps) {
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
  const [modalToken, setModalToken] = useState<string | null>(null);
  const [duplicandoItem, setDuplicandoItem] = useState<LancamentoItem | null>(null);
  const [salvandoPDF, setSalvandoPDF] = useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleGerarPDF = async () => {
    setSalvandoPDF(true);
    try {
      await exportarParaPDF(lancamentos);
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
    try {
      const token = await baixarImagem(lancamentos);
      if (token) setModalToken(token);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido.";
      if (msg.includes("histórico")) {
        alert(`Imagem gerada, mas não foi possível salvar o token:\n${msg}`);
      } else {
        alert(`Erro ao gerar imagem: ${msg}`);
      }
    }
  };

  const handleRemover = (id: number, isLastInPage: boolean) => {
    onRemover(id);
    handleItemRemoved(isLastInPage);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {modalToken && <ModalToken token={modalToken} onClose={() => setModalToken(null)} />}
      <ModalDuplicar
        isOpen={!!duplicandoItem}
        onClose={() => setDuplicandoItem(null)}
        lancamentoBase={duplicandoItem}
        onConfirmar={(datas) => {
          if (duplicandoItem) onConfirmarDuplicacao(duplicandoItem.id, datas);
          setDuplicandoItem(null);
        }}
      />

      <div className="flex flex-col bg-slate-50 rounded-lg pb-6 w-full p-4 md:p-8 mt-6 gap-5 shadow-sm border border-slate-400 overflow-hidden">

        {/* Cabeçalho + paginação superior */}
        <div className="flex items-center justify-between text-gray-400 text-[18px] font-bold gap-3">
          <h1 className="text-[24px] text-[#1F2022] font-bold">Lançamentos</h1>
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

        {/* Botões de exportação */}
        <BotoesExport
          temLancamentos={lancamentos.length > 0}
          salvandoPDF={salvandoPDF}
          onGerarPDF={handleGerarPDF}
          onBaixarImagem={handleBaixarImagem}
        />

        {/* Conteúdo */}
        {lancamentos.length === 0 && !loading ? (
          <p className="text-sm text-gray-400 italic">
            Nenhum cálculo realizado ainda. Preencha os dados acima e clique em Calcular.
          </p>
        ) : (
          <div ref={tableRef} className="flex flex-col gap-4">
            <TabelaLancamentos
              currentItems={currentItems}
              lancamentos={lancamentos}
              startIndex={startIndex}
              currentPage={currentPage}
              totalPages={totalPages}
              onRemover={handleRemover}
              onEditar={onEditar}
              onLimparTodos={onLimparTodos}
              onDuplicar={setDuplicandoItem}
            />

            {/* Rodapé: info de paginação + seletor + paginação inferior */}
            {lancamentos.length > 0 && (
              <div className="flex flex-col md:flex-row justify-between items-center mt-4 border-t border-gray-200 pt-4 gap-4">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <span className="text-sm text-gray-500">
                    Mostrando{" "}
                    <span className="font-semibold text-gray-700">{startIndex + 1}</span>{" "}
                    até{" "}
                    <span className="font-semibold text-gray-700">
                      {Math.min(startIndex + itemsPerPage, lancamentos.length)}
                    </span>{" "}
                    de{" "}
                    <span className="font-semibold text-gray-700">{lancamentos.length}</span>{" "}
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
                      onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                    </select>
                  </div>
                </div>

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
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default Lancamentos;
