import type { LancamentoItem } from "../../App";
import { formatBRL } from "../../utils/formatters";
import LancamentoRow from "./LancamentoRow";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";

interface TabelaLancamentosProps {
  currentItems: LancamentoItem[];
  lancamentos: LancamentoItem[];   // todos (para totais e tfoot)
  startIndex: number;
  currentPage: number;
  totalPages: number;
  onRemover: (id: number, isLastInPage: boolean) => void;
  onEditar: (id: number) => void;
  onLimparTodos: () => void;
  onDuplicar: (item: LancamentoItem) => void;
  forceExpand?: boolean;
}

function TabelaLancamentos({
  currentItems,
  lancamentos,
  startIndex,
  currentPage,
  totalPages,
  onRemover,
  onEditar,
  onLimparTodos,
  onDuplicar,
  forceExpand,
}: TabelaLancamentosProps) {

  const handleRemover = (id: number) => {
    onRemover(id, currentItems.length === 1);
  };

  return (
    <div className="flex flex-col w-full border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm overflow-hidden bg-white dark:bg-slate-700 transition-colors duration-200">
      {/* ─── CABEÇALHO (Visível apenas no Desktop) ─── */}
      <div className="hidden md:grid grid-cols-[2.5rem_6rem_6rem_8rem_minmax(10rem,1fr)_7rem_4rem_8rem_6rem] items-center gap-4 px-4 py-3 bg-slate-50/80 dark:bg-slate-600/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-500 text-xs font-semibold text-slate-500 dark:text-slate-200 uppercase tracking-wider">
        <div className="text-center"></div> {/* Espaço para ícone de expansão */}
        <div>Data inicial</div>
        <div>Data final</div>
        <div>Valor</div>
        <div>Índice</div>
        <div>Correção</div>
        <div>Juros</div>
        <div>Total devido</div>
        <div className="flex justify-end pr-1 text-gray-500">
          <button
            onClick={onLimparTodos}
            className="p-1 hover:text-red-600 transition-colors rounded"
            title="Limpar todos os lançamentos"
          >
            <DeleteOutlinedIcon fontSize="small" />
          </button>
        </div>
      </div>

      {/* ─── CORPO DA TABELA (Lista de Rows) ─── */}
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
      {/* Exibe apenas na última página */}
      {lancamentos.length > 0 && currentPage === totalPages && (
        <>
          {/* Footer Desktop */}
          <div className="hidden md:grid grid-cols-[2.5rem_6rem_6rem_8rem_minmax(10rem,1fr)_7rem_4rem_8rem_6rem] items-center gap-4 px-4 py-4 bg-blue-50/30 dark:bg-blue-900/20 border-t border-slate-200 dark:border-slate-700 text-sm font-bold text-blue-900 dark:text-blue-300">
            <div className="col-span-3 pl-12 text-[15px]">Total</div>
            <div>{formatBRL(lancamentos.reduce((s, l) => s + l.valorPrincipal, 0))}</div>
            <div className="col-span-3"></div>
            <div className="text-[15px]">{formatBRL(lancamentos.reduce((s, l) => s + l.total, 0))}</div>
            <div></div>
          </div>

          {/* Footer Mobile */}
          <div className="md:hidden mt-4 flex flex-col items-center justify-between bg-blue-50/30 dark:bg-blue-900/20 border-t border-slate-200 dark:border-slate-700 p-4">
            <div className="w-full flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Valor</span>
              <span className="text-sm font-bold text-blue-900 dark:text-blue-300">{formatBRL(lancamentos.reduce((s, l) => s + l.valorPrincipal, 0))}</span>
            </div>
            <div className="w-full flex justify-between items-center">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Devido Geral</span>
              <span className="text-base font-bold text-blue-900 dark:text-blue-300">{formatBRL(lancamentos.reduce((s, l) => s + l.total, 0))}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default TabelaLancamentos;
