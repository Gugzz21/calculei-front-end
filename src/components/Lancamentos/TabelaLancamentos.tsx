import { useMemo, useCallback, useRef, useEffect } from "react";
import { formatBRL } from "../../utils/formatters";
import LancamentoRow from "./LancamentoRow";
import { useCalculadoraContext } from "../../contexts/CalculadoraContext";
import type { LancamentoItem } from "../../types";
import DeleteIcon from "@mui/icons-material/Delete";

// ─── Constante de grid compartilhada com LancamentoRow ───────────────────────
// expand | Data inicial | Data final | Valor principal | Índice | Fator de correção | Valor corrigido | Juros | Total devido | ações
export const TABLE_GRID_COLS =
  "md:grid-cols-[2rem_6rem_6rem_8rem_minmax(8rem,1fr)_10rem_9rem_7rem_8rem_5rem]";

interface TabelaLancamentosProps {
  currentItems: LancamentoItem[];
  startIndex: number;
  currentPage: number;
  totalPages: number;
  onRemover: (id: number, isLastInPage: boolean) => void;
  onEditar: (id: number) => void;
  onDuplicar: (item: LancamentoItem) => void;
  forceExpand?: boolean;
}

function TabelaLancamentos({
  currentItems,
  startIndex,
  currentPage,
  totalPages,
  onRemover,
  onEditar,
  onDuplicar,
  forceExpand,
}: TabelaLancamentosProps) {
  const { lancamentos, handleLimparTodosLancamentos } = useCalculadoraContext();

  // Memoizar todos os totais em um único reduce em vez de 6 independentes.
  // Sem useMemo, cada render percorre toda a lista 6 vezes (3 desktop + 3 mobile).
  const totais = useMemo(() => lancamentos.reduce(
    (acc, l) => ({
      valorPrincipal: acc.valorPrincipal + l.valorPrincipal,
      valorAtualizado: acc.valorAtualizado + l.valorAtualizado,
      juros: acc.juros + l.juros,
      total: acc.total + l.total,
    }),
    { valorPrincipal: 0, valorAtualizado: 0, juros: 0, total: 0 }
  ), [lancamentos]);

  const itemsLengthRef = useRef(currentItems.length);
  useEffect(() => {
    itemsLengthRef.current = currentItems.length;
  }, [currentItems.length]);

  const handleRemover = useCallback((id: number) => {
    onRemover(id, itemsLengthRef.current === 1);
  }, [onRemover]);

  return (
    <div id="tabela-lancamentos" className="flex flex-col w-full border border-slate-300 dark:border-[#21262d] rounded-xl shadow-sm overflow-hidden bg-white dark:bg-[#0d1117] transition-colors duration-200">

      {/* ─── CABEÇALHO (Visível apenas no Desktop) ─── */}
      <div className={`hidden md:grid ${TABLE_GRID_COLS} items-center gap-3 px-4 py-3 bg-slate-200 dark:bg-slate-600/80 backdrop-blur-sm border-b border-slate-300 dark:border-[#21262d] text-xs font-semibold text-slate-600 dark:text-slate-200 whitespace-nowrap`}>
        <div /> {/* Ícone expand */}
        <div>Data inicial</div>
        <div>Data final</div>
        <div>Valor principal</div>
        <div>Índice</div>
        <div>Fator de correção</div>
        <div>Valor corrigido</div>
        <div>Juros</div>
        <div>Total devido</div>
        <div className="flex justify-end pr-1 exclude-from-print">
          <button
            onClick={() => {
              if (window.confirm("Tem certeza que deseja apagar TODOS os lançamentos? Esta ação não pode ser desfeita.")) {
                handleLimparTodosLancamentos();
              }
            }}
            className="p-1 text-slate-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded"
            title="Limpar todos os lançamentos"
          >
            <DeleteIcon fontSize="small" />
          </button>
        </div>
      </div>

      {/* ─── CORPO ─── */}
      <div className="flex flex-col md:block">
        {currentItems.map((item, index) => (
          <LancamentoRow
            key={item.id}
            item={item}
            index={startIndex + index}
            onRemover={handleRemover}
            onEditar={onEditar}
            onDuplicar={onDuplicar}
            forceExpand={forceExpand}
          />
        ))}
      </div>

      {/* ─── RODAPÉ (Total Geral) ─── */}
      {lancamentos.length > 0 && currentPage === totalPages && (
        <>
          {/* Footer Desktop */}
          <div className={`hidden md:grid ${TABLE_GRID_COLS} items-center gap-3 px-4 py-4 bg-blue-50 dark:bg-[#007aff]/10 border-t border-slate-300 dark:border-[#21262d] text-sm font-bold text-blue-900 dark:text-[#4da3ff]`}>
            <div className="col-span-3 pl-8 text-[15px]">Total</div>
            <div>{formatBRL(totais.valorPrincipal)}</div>
            <div className="col-span-2" />
            <div>{formatBRL(totais.valorAtualizado)}</div>
            <div>{formatBRL(totais.juros)}</div>
            <div className="text-[15px]">{formatBRL(totais.total)}</div>
            <div />
          </div>

          {/* Footer Mobile */}
          <div className="md:hidden flex flex-col bg-blue-50 dark:bg-[#007aff]/10 border-t border-slate-300 dark:border-[#21262d] p-4 gap-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Valor</span>
              <span className="text-sm font-bold text-blue-900 dark:text-[#4da3ff]">{formatBRL(totais.valorPrincipal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Devido Geral</span>
              <span className="text-base font-bold text-blue-900 dark:text-[#4da3ff]">{formatBRL(totais.total)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default TabelaLancamentos;
