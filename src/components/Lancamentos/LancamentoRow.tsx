import { useState } from "react";
import type { LancamentoItem } from "../../types";
import { formatBRL } from "../../utils/formatters";
import { formatDate } from "../../utils/dateUtils";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { TABLE_GRID_COLS } from "./TabelaLancamentos";

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

// ─── COMPONENTE DESKTOP ───────────────────────────────────────────────────────
// Nova ordem: expand | Data inicial | Data final | Valor principal | Índice | Fator de correção | Valor corrigido | Juros | Total devido | ações

function formatFatorCorrecao(value: number): string {
  const formatted = Number(value).toFixed(8).replace(".", ",");
  return `${formatted} %`;
}

function formatPercent2(value: number): string {
  const formatted = Number(value).toFixed(2).replace(".", ",");
  return `${formatted}%`;
}

function LancamentoRowDesktop({ item, isExpanded, onRemover, onEditar, onDuplicar }: SubComponentProps) {
  const temJuros = item.indiceJuros !== "—";
  return (
    <div className="hidden md:contents text-[13px] text-slate-700 dark:text-slate-300">
      {/* expand icon */}
      <div
        className="flex items-center justify-center text-slate-400 transition-transform duration-300 shrink-0"
        style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
      >
        <KeyboardArrowDownIcon fontSize="small" />
      </div>
      {/* Data inicial */}
      <div>{formatDate(item.dataInicial)}</div>
      {/* Data final */}
      <div>{formatDate(item.dataCalculo)}</div>
      {/* Valor principal */}
      <div>{formatBRL(item.valorPrincipal)}</div>
      {/* Índice */}
      <div className="truncate pr-2 text-gray-600 dark:text-gray-400" title={item.indiceCorrecao}>
        {item.indiceCorrecao}
      </div>
      {/* Fator de correção */}
      <div>{formatFatorCorrecao(item.percentualCorrecao)}</div>
      {/* Valor corrigido */}
      <div>{formatBRL(item.valorAtualizado)}</div>
      {/* Juros */}
      <div className={temJuros ? "text-blue-700 dark:text-blue-300 font-medium" : "text-slate-400 dark:text-slate-600"}>
        {temJuros ? formatBRL(item.juros) : "—"}
      </div>
      {/* Total devido */}
      <div className="font-semibold">{formatBRL(item.total)}</div>
      {/* Ações */}
      <div className="flex items-center justify-center gap-2">
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

// ─── COMPONENTE MOBILE ────────────────────────────────────────────────────────

function LancamentoRowMobile({ item, isExpanded, onRemover, onEditar, onDuplicar }: SubComponentProps) {
  return (
    <div className="flex flex-col md:hidden text-[13px] text-slate-700 dark:text-slate-300 w-full gap-2">
      {/* Linha Superior */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 text-[14px]">
          <div
            className="flex items-center justify-center text-slate-400 transition-transform duration-300"
            style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
          >
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

      {/* Grade de informações principais */}
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

// ─── COLAPSE EXPANDIDO ────────────────────────────────────────────────────────

function LancamentoRowExpanded({ item }: { item: LancamentoItem }) {
  const temJuros = item.indiceJuros !== "—";

  return (
    <div className="overflow-hidden">
      <div className="px-6 md:pl-12 md:pr-4 py-4 md:py-5 bg-slate-50/50 dark:bg-[#0d1117]/50 shadow-inner border-t border-slate-100 dark:border-[#21262d]">

        {/* ── Descrição ── */}
        <div className="flex flex-col gap-0.5 mb-4">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Descrição</span>
          <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
            {item.descricao}
            {item.descricaoComplementar && (
              <span className="text-slate-500 dark:text-slate-400 italic"> ({item.descricaoComplementar})</span>
            )}
          </span>
        </div>

        {/* ── Mobile: campos omitidos na grade principal ── */}
        <div className="grid grid-cols-2 md:hidden gap-x-4 gap-y-4 mb-4">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Índice</span>
            <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-[#21262d] rounded-md px-2 py-0.5 w-fit">
              {item.indiceCorrecao}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Fator de correção</span>
            <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">{formatFatorCorrecao(item.percentualCorrecao)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Valor corrigido</span>
            <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">{formatBRL(item.valorAtualizado)}</span>
          </div>
          {temJuros && (
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Juros (R$)</span>
              <span className="text-[13px] font-medium text-blue-700 dark:text-blue-300">{formatBRL(item.juros)}</span>
            </div>
          )}
        </div>

        {/* ── Seção de Juros ── */}
        {temJuros && (
          <div className="border border-blue-200 dark:border-blue-900/50 rounded-lg bg-blue-50/70 dark:bg-blue-900/20 p-3 md:p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Total de dias de juros:
              </span>
              <span className="text-[13px] font-semibold text-blue-700 dark:text-blue-300">
                {item.diasJuros ?? "—"} dias
              </span>
            </div>

            {item.itensJuros && item.itensJuros.length > 0 ? (
              <div className="flex flex-col gap-4 divide-y divide-blue-200/50 dark:divide-blue-900/30">
                {item.itensJuros.map((sub, sIdx) => (
                  <div key={sIdx} className={`grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-3 ${sIdx > 0 ? "pt-3" : ""}`}>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Período de juros</span>
                      <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                        {sub.dataInicio ? `${formatDate(sub.dataInicio)} a ${formatDate(sub.dataFim)}` : "—"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Dias de juros</span>
                      <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">{sub.dias}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Fator de juros</span>
                      <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                        {sub.taxa.includes("%") ? sub.taxa : `${sub.taxa}%`}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Acumulado juros(%)</span>
                      <span className="text-[13px] font-medium text-blue-700 dark:text-blue-300">{formatPercent2(sub.percentual)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Juros</span>
                      <span className="text-[13px] font-semibold text-blue-700 dark:text-blue-300">{formatBRL(sub.valor)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-x-6 gap-y-3">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Período de juros</span>
                  <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                    {item.dataInicioJuros ? `${formatDate(item.dataInicioJuros)} a ${formatDate(item.dataFimJuros)}` : "—"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Dias de juros</span>
                  <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">{item.diasJuros ?? "—"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Fator de juros</span>
                  <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">—</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Acumulado juros(%)</span>
                  <span className="text-[13px] font-medium text-blue-700 dark:text-blue-300">
                    {item.percentualJurosAcumulado != null ? formatPercent2(item.percentualJurosAcumulado) : "—"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Juros</span>
                  <span className="text-[13px] font-semibold text-blue-700 dark:text-blue-300">{formatBRL(item.juros)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export default function LancamentoRow(props: LancamentoRowProps) {
  const [isExpanded, setIsExpanded] = useState(props.forceExpand || false);
  const isActuallyExpanded = props.forceExpand || isExpanded;

  return (
    <div className="flex flex-col bg-white dark:bg-[#0d1117] border-b border-slate-100 dark:border-[#21262d] transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-[#1e232b]/50">

      {/* ─── LINHA PRINCIPAL ─── */}
      <div
        className={`flex flex-col md:grid ${TABLE_GRID_COLS} md:items-center gap-3 md:gap-3 p-4 md:py-3 md:px-4 cursor-pointer select-none`}
        onClick={() => !props.forceExpand && setIsExpanded(!isExpanded)}
      >
        <LancamentoRowDesktop {...props} isExpanded={isActuallyExpanded} />
        <LancamentoRowMobile {...props} isExpanded={isActuallyExpanded} />
      </div>

      {/* ─── ÁREA EXPANSÍVEL ─── */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
          isActuallyExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <LancamentoRowExpanded item={props.item} />
      </div>
    </div>
  );
}
