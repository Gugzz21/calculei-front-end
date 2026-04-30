import type { LancamentoItem } from "../../App";
import { formatBRL } from "./utils";
import LancamentoRow from "./LancamentoRow";

interface TabelaLancamentosProps {
  currentItems: LancamentoItem[];
  lancamentos: LancamentoItem[];   // todos (para totais e tfoot)
  startIndex: number;
  currentPage: number;
  totalPages: number;
  onRemover: (id: number, isLastInPage: boolean) => void;
  onEditar: (id: number) => void;
}

function TabelaLancamentos({
  currentItems,
  lancamentos,
  startIndex,
  currentPage,
  totalPages,
  onRemover,
  onEditar,
}: TabelaLancamentosProps) {

  const handleRemover = (id: number) => {
    onRemover(id, currentItems.length === 1);
  };

  return (
    <div className="flex flex-col w-full">
      {/* ─── CABEÇALHO (Visível apenas no Desktop) ─── */}
      <div className="hidden md:grid grid-cols-[2.5rem_minmax(0,1fr)_10rem_8rem_9rem_5rem] items-center gap-4 px-4 py-3 bg-gray-200/60 rounded-t-xl border border-gray-300 text-xs font-bold text-gray-600 uppercase tracking-wide">
        <div className="text-center"></div> {/* Espaço para ícone de expansão */}
        <div className="flex items-center gap-3">
          <div className="w-8 shrink-0 text-center">#</div>
          <div>Descrição</div>
        </div>
        <div>Datas</div>
        <div className="text-right">Principal</div>
        <div className="text-right">Total Geral</div>
        <div className="text-center">Ações</div>
      </div>

      {/* ─── CORPO DA TABELA (Lista de Rows) ─── */}
      <div className="flex flex-col gap-3 mt-3 md:mt-0 md:border-x md:border-gray-200 md:bg-gray-50/30 md:p-3">
        {currentItems.map((item, index) => (
          <LancamentoRow
            key={item.id}
            item={item}
            index={startIndex + index + 1}
            onRemover={handleRemover}
            onEditar={onEditar}
          />
        ))}
      </div>

      {/* ─── RODAPÉ (Total Geral) ─── */}
      {/* Exibe apenas na última página com mais de 1 item */}
      {lancamentos.length > 1 && currentPage === totalPages && (
        <div className="mt-4 flex flex-col md:flex-row items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
          <div className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-2 md:mb-0">
            Resumo Geral ({lancamentos.length} Lançamentos)
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 w-full md:w-auto">
            <div className="flex justify-between md:flex-col w-full md:w-auto md:items-end">
              <span className="text-xs text-blue-600/80 uppercase font-semibold">Total Principal</span>
              <span className="text-sm font-medium text-blue-800">
                {formatBRL(lancamentos.reduce((s, l) => s + l.valorPrincipal, 0))}
              </span>
            </div>

            <div className="flex justify-between md:flex-col w-full md:w-auto md:items-end">
              <span className="text-xs text-blue-600/80 uppercase font-semibold">Total Atualizado</span>
              <span className="text-sm font-medium text-blue-800">
                {formatBRL(lancamentos.reduce((s, l) => s + l.valorAtualizado, 0))}
              </span>
            </div>

            <div className="flex justify-between md:flex-col w-full md:w-auto md:items-end">
              <span className="text-xs text-purple-600/80 uppercase font-semibold">Total Juros</span>
              <span className="text-sm font-medium text-purple-700">
                {formatBRL(lancamentos.reduce((s, l) => s + l.juros, 0))}
              </span>
            </div>

            <div className="flex justify-between md:flex-col w-full md:w-auto md:items-end pt-2 md:pt-0 border-t border-emerald-200/50 md:border-0">
              <span className="text-[11px] text-emerald-600 uppercase font-bold">Valor Final Geral</span>
              <span className="text-lg font-bold text-emerald-700">
                {formatBRL(lancamentos.reduce((s, l) => s + l.total, 0))}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TabelaLancamentos;
