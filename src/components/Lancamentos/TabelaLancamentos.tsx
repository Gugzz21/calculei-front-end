import type { LancamentoItem } from "../../App";
import { formatBRL } from "./utils/utils";
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
}: TabelaLancamentosProps) {

  const handleRemover = (id: number) => {
    onRemover(id, currentItems.length === 1);
  };

  return (
    <div className="flex flex-col w-full border border-gray-300 rounded-lg overflow-hidden bg-white">
      {/* ─── CABEÇALHO (Visível apenas no Desktop) ─── */}
      <div className="hidden md:grid grid-cols-[2.5rem_6rem_6rem_8rem_minmax(10rem,1fr)_7rem_4rem_8rem_6rem] items-center gap-4 px-4 py-3 bg-[#e8eff8] border-b border-gray-300 text-[13px] font-bold text-gray-800">
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
            index={startIndex + index + 1}
            onRemover={handleRemover}
            onEditar={onEditar}
          />
        ))}
      </div>

      {/* ─── RODAPÉ (Total Geral) ─── */}
      {/* Exibe apenas na última página */}
      {lancamentos.length > 0 && currentPage === totalPages && (
        <>
          {/* Footer Desktop */}
          <div className="hidden md:grid grid-cols-[2.5rem_6rem_6rem_8rem_minmax(10rem,1fr)_7rem_4rem_8rem_6rem] items-center gap-4 px-4 py-4 bg-[#f8f9fa] border-t border-gray-300 text-sm font-bold text-gray-800">
            <div className="col-span-3 pl-12 text-[15px]">Total</div>
            <div>{formatBRL(lancamentos.reduce((s, l) => s + l.valorPrincipal, 0))}</div>
            <div className="col-span-3"></div>
            <div className="text-[15px]">{formatBRL(lancamentos.reduce((s, l) => s + l.total, 0))}</div>
            <div></div>
          </div>

          {/* Footer Mobile */}
          <div className="md:hidden mt-4 flex flex-col items-center justify-between bg-[#f8f9fa] border-t border-gray-300 p-4">
            <div className="w-full flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-gray-800">Total Valor</span>
              <span className="text-sm font-bold text-gray-800">{formatBRL(lancamentos.reduce((s, l) => s + l.valorPrincipal, 0))}</span>
            </div>
            <div className="w-full flex justify-between items-center">
              <span className="text-sm font-bold text-gray-800">Total Devido Geral</span>
              <span className="text-base font-bold text-gray-800">{formatBRL(lancamentos.reduce((s, l) => s + l.total, 0))}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default TabelaLancamentos;
