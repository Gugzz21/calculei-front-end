import { useState, useEffect, useRef } from "react";
import type { LancamentoItem } from "../../App";

import Paginacao from "./Paginacao";
import TabelaLancamentos from "./TabelaLancamentos";
import BotoesExport from "./BotoesExport";
import ModalRecuperar from "./ModalRecuperar";
import { exportarParaPDF } from "./exportPDF";
import { baixarImagem } from "./exportImagem";

interface LancamentosProps {
  lancamentos: LancamentoItem[];
  loading?: boolean;
  onRemover: (id: number) => void;
  onRecuperar: (itensRecuperados: LancamentoItem[]) => void;
}

function Lancamentos({ lancamentos, loading = false, onRemover, onRecuperar }: LancamentosProps) {
  // ── Paginação ──────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [pageInput, setPageInput] = useState("1");
  const tableRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.max(1, Math.ceil(lancamentos.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = lancamentos.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const handleGoToPage = (p: number) => {
    setCurrentPage(p);
    setPageInput(p.toString());
  };

  // ── Modais ─────────────────────────────────────────────────────────────────
  const [modalRecuperar, setModalRecuperar] = useState(false);
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

  const handleBaixarImagem = () => baixarImagem(lancamentos);

  const handleRemover = (id: number, isLastInPage: boolean) => {
    onRemover(id);
    if (isLastInPage && currentPage > 1) setCurrentPage((p) => p - 1);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {modalRecuperar &&
        <ModalRecuperar
          onClose={() =>
            setModalRecuperar(false)}
          onRecuperar={(itens) => {
            onRecuperar(itens);
            setModalRecuperar(false);
          }}
        />}

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
            onPrev={() => currentPage > 1 && setCurrentPage((p) => p - 1)}
            onNext={() => currentPage < totalPages && setCurrentPage((p) => p + 1)}
          />
        </div>

        {/* Botões de exportação */}
        <BotoesExport
          temLancamentos={lancamentos.length > 0}
          salvandoPDF={salvandoPDF}
          onGerarPDF={handleGerarPDF}
          onBaixarImagem={handleBaixarImagem}
          onRecuperarToken={() => setModalRecuperar(true)}
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

                <Paginacao
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageInput={pageInput}
                  onPageInput={setPageInput}
                  onGoToPage={handleGoToPage}
                  onPrev={() => currentPage > 1 && setCurrentPage((p) => p - 1)}
                  onNext={() => currentPage < totalPages && setCurrentPage((p) => p + 1)}
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
