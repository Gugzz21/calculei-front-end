import { useState } from "react";
import type { LancamentoItem } from "../../types";
import { formatBRL, formatPercent } from "../../utils/formatters";
import { formatDate } from "../../utils/dateUtils";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface LancamentoRowProps {
  item: LancamentoItem;
  index: number;
  onRemover: (id: number) => void;
  onEditar: (id: number) => void;
  onDuplicar: (item: LancamentoItem) => void;
  forceExpand?: boolean;
}

interface SubComponentProps extends LancamentoRowProps {
  isExpanded: boolean;
}

// ─── COMPONENTES AUXILIARES ───────────────────────────────────────────────────

function LancamentoRowDesktop({ item, isExpanded, onRemover, onEditar, onDuplicar }: SubComponentProps) {
  return (
    <div className="hidden md:contents text-[13px] text-slate-700 dark:text-slate-300">
      <div className="flex items-center justify-center text-slate-400 transition-transform duration-300 shrink-0" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
        <KeyboardArrowDownIcon fontSize="small" />
      </div>
      <div>{formatDate(item.dataInicial)}</div>
      <div>{formatDate(item.dataCalculo)}</div>
      <div>{formatBRL(item.valorPrincipal)}</div>
      <div className="truncate pr-2 text-gray-600 dark:text-gray-400" title={item.indiceCorrecao}>{item.indiceCorrecao}</div>
      <div>{formatPercent(item.percentualCorrecao)}</div>
      <div>{item.indiceJuros !== "—" ? "Sim" : "Não"}</div>
      <div>{formatBRL(item.total)}</div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={(e) => { e.stopPropagation(); onEditar(item.id); }}
          className="text-gray-500 hover:text-blue-600 transition-colors"
          title="Editar"
        >
          <EditIcon fontSize="small" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicar(item); }}
          className="text-gray-500 hover:text-blue-600 transition-colors"
          title="Duplicar"
        >
          <ContentCopyIcon fontSize="small" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onRemover(item.id); }}
          className="text-gray-500 hover:text-red-500 transition-colors"
          title="Remover"
        >
          <DeleteIcon fontSize="small" />
        </button>
      </div>
    </div>
  );
}

function LancamentoRowMobile({ item, isExpanded, onRemover, onEditar, onDuplicar }: SubComponentProps) {
  return (
    <div className="flex flex-col md:hidden text-[13px] text-slate-700 dark:text-slate-300 w-full gap-2">
      {/* Linha Superior: Ícone de expansão + Descrição + Ações */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 text-[14px]">
          <div className="flex items-center justify-center text-slate-400 transition-transform duration-300" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
            <KeyboardArrowDownIcon fontSize="small" />
          </div>
          {item.descricao}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); onEditar(item.id); }} className="p-1 text-gray-500 hover:text-blue-600 transition-colors">
            <EditIcon fontSize="small" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDuplicar(item); }} className="p-1 text-gray-500 hover:text-blue-600 transition-colors">
            <ContentCopyIcon fontSize="small" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onRemover(item.id); }} className="p-1 text-gray-500 hover:text-red-500 transition-colors">
            <DeleteIcon fontSize="small" />
          </button>
        </div>
      </div>

      {/* Grade de informações principais do Mobile */}
      <div className="grid grid-cols-2 gap-3 mt-1 ml-7">
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">Data inicial</span>
          <span className="text-[13px]">{formatDate(item.dataInicial)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">Data final</span>
          <span className="text-[13px]">{formatDate(item.dataCalculo)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">Valor original</span>
          <span className="text-[13px]">{formatBRL(item.valorPrincipal)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">Total devido</span>
          <span className="font-bold text-[13px] text-gray-800 dark:text-gray-100">{formatBRL(item.total)}</span>
        </div>
      </div>
    </div>
  );
}

function LancamentoRowExpanded({ item }: { item: LancamentoItem }) {
  return (
    <div className="overflow-hidden">
      <div className="px-6 md:pl-14 md:pr-4 py-5 md:py-6 bg-slate-50/50 dark:bg-[#0d1117]/50 shadow-inner border-t border-slate-100 dark:border-[#21262d] grid grid-cols-2 md:grid-cols-7 gap-x-4 gap-y-6">

        {/* Desktop: Descrição. Mobile: Oculto pois já está na linha principal */}
        <div className="hidden md:flex flex-col">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Descrição</span>
          <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">{item.descricao}</span>
        </div>

        {/* Mobile: Mostrar campos que foram cortados da grade principal */}
        <div className="flex flex-col md:hidden">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Índice</span>
          <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-[#21262d] rounded-md px-2 py-0.5 w-fit">{item.indiceCorrecao}</span>
        </div>
        <div className="flex flex-col md:hidden">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Correção</span>
          <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">{formatPercent(item.percentualCorrecao)}</span>
        </div>
        <div className="flex flex-col md:hidden">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Juros?</span>
          <span className={`text-[12px] font-semibold px-2 py-0.5 rounded-full w-fit ${item.indiceJuros !== "—" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-[#4da3ff]" : "bg-slate-100 dark:bg-[#0d1117] text-slate-500 dark:text-slate-400"}`}>
            {item.indiceJuros !== "—" ? "Sim" : "Não"}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Valor atualizado</span>
          <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">{formatBRL(item.valorAtualizado)}</span>
        </div>

        {item.indiceJuros !== "—" && (
          <>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Período de juros</span>
              <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                {item.dataInicioJuros ? `${formatDate(item.dataInicioJuros)} à ${formatDate(item.dataFimJuros)}` : "—"}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Dias de juros</span>
              <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                {item.diasJuros ? item.diasJuros : "—"}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Fator de juros</span>
              <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                {item.fatorJuros && item.fatorJuros !== 1 ? item.fatorJuros.toFixed(8) : "—"}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Acumulado juros(%)</span>
              <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                {item.percentualJurosAcumulado ? formatPercent(item.percentualJurosAcumulado) : "—"}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Juros (R$)</span>
              <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">{formatBRL(item.juros)}</span>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export default function LancamentoRow(props: LancamentoRowProps) {
  const [isExpanded, setIsExpanded] = useState(props.forceExpand || false);

  // Se forceExpand mudar dinamicamente ou para sempre forçar
  const isActuallyExpanded = props.forceExpand || isExpanded;

  return (
    <div className="flex flex-col bg-white dark:bg-[#0d1117] border-b border-slate-100 dark:border-[#21262d] transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-[#1e232b]/50">
      {/* ─── LINHA PRINCIPAL (Visível sempre) ─── */}
      <div
        className="flex flex-col md:grid md:grid-cols-[2.5rem_6rem_6rem_8rem_minmax(10rem,1fr)_7rem_4rem_8rem_6rem] md:items-center gap-3 md:gap-4 p-4 md:py-3 md:px-4 cursor-pointer select-none"
        onClick={() => !props.forceExpand && setIsExpanded(!isExpanded)}
      >
        <LancamentoRowDesktop {...props} isExpanded={isActuallyExpanded} />
        <LancamentoRowMobile {...props} isExpanded={isActuallyExpanded} />
      </div>

      {/* ─── ÁREA EXPANSÍVEL (Detalhes do Cálculo) ─── */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${isActuallyExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
      >
        <LancamentoRowExpanded item={props.item} />
      </div>
    </div>
  );
}
