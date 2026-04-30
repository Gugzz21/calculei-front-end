import { useState } from "react";
import type { LancamentoItem } from "../../App";
import { formatBRL, formatPercent } from "../../utils/formatters";
import { formatDate } from "../../utils/dateUtils";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditIcon from "@mui/icons-material/Edit";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface LancamentoRowProps {
  item: LancamentoItem;
  index: number;
  onRemover: (id: number) => void;
  onEditar: (id: number) => void;
  onDuplicar: (item: LancamentoItem) => void;
}

interface SubComponentProps extends LancamentoRowProps {
  isExpanded: boolean;
}

// ─── COMPONENTES AUXILIARES ───────────────────────────────────────────────────

function LancamentoRowDesktop({ item, isExpanded, onRemover, onEditar, onDuplicar }: SubComponentProps) {
  return (
    <div className="hidden md:contents text-[13px] text-gray-700">
      <div className="flex items-center justify-center text-gray-600 transition-colors shrink-0">
        {isExpanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
      </div>
      <div>{formatDate(item.dataInicial)}</div>
      <div>{formatDate(item.dataCalculo)}</div>
      <div>{formatBRL(item.valorPrincipal)}</div>
      <div className="truncate pr-2 text-gray-600" title={item.indiceCorrecao}>{item.indiceCorrecao}</div>
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
          <DeleteOutlinedIcon fontSize="small" />
        </button>
      </div>
    </div>
  );
}

function LancamentoRowMobile({ item, isExpanded, onRemover, onEditar, onDuplicar }: SubComponentProps) {
  return (
    <div className="flex flex-col md:hidden text-[13px] text-gray-700 w-full gap-2">
      {/* Linha Superior: Ícone de expansão + Descrição + Ações */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-gray-800 text-[14px]">
          <div className="flex items-center justify-center text-gray-500">
            {isExpanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
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
            <DeleteOutlinedIcon fontSize="small" />
          </button>
        </div>
      </div>

      {/* Grade de informações principais do Mobile */}
      <div className="grid grid-cols-2 gap-3 mt-1 ml-7">
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-gray-800">Data inicial</span>
          <span className="text-[13px]">{formatDate(item.dataInicial)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-gray-800">Data final</span>
          <span className="text-[13px]">{formatDate(item.dataCalculo)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-gray-800">Valor original</span>
          <span className="text-[13px]">{formatBRL(item.valorPrincipal)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-gray-800">Total devido</span>
          <span className="font-bold text-[13px] text-gray-800">{formatBRL(item.total)}</span>
        </div>
      </div>
    </div>
  );
}

function LancamentoRowExpanded({ item }: { item: LancamentoItem }) {
  return (
    <div className="overflow-hidden">
      <div className="px-6 md:pl-14 md:pr-4 py-4 md:py-6 bg-white border-t border-gray-100 grid grid-cols-2 md:grid-cols-7 gap-x-4 gap-y-6">

        {/* Desktop: Descrição. Mobile: Oculto pois já está na linha principal */}
        <div className="hidden md:flex flex-col">
          <span className="text-[12px] font-bold text-gray-800 mb-1">Descrição</span>
          <span className="text-[13px] text-gray-600">{item.descricao}</span>
        </div>

        {/* Mobile: Mostrar campos que foram cortados da grade principal */}
        <div className="flex flex-col md:hidden">
          <span className="text-[12px] font-bold text-gray-800 mb-1">Índice</span>
          <span className="text-[13px] text-gray-600">{item.indiceCorrecao}</span>
        </div>
        <div className="flex flex-col md:hidden">
          <span className="text-[12px] font-bold text-gray-800 mb-1">Correção</span>
          <span className="text-[13px] text-gray-600">{formatPercent(item.percentualCorrecao)}</span>
        </div>
        <div className="flex flex-col md:hidden">
          <span className="text-[12px] font-bold text-gray-800 mb-1">Juros?</span>
          <span className="text-[13px] text-gray-600">{item.indiceJuros !== "—" ? "Sim" : "Não"}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[12px] font-bold text-gray-800 mb-1">Valor atualizado</span>
          <span className="text-[13px] text-gray-600">{formatBRL(item.valorAtualizado)}</span>
        </div>

        {item.indiceJuros !== "—" && (
          <>
            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-gray-800 mb-1">Período de juros</span>
              <span className="text-[13px] text-gray-600">
                {item.dataInicioJuros ? `${formatDate(item.dataInicioJuros)} à ${formatDate(item.dataFimJuros)}` : "—"}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-gray-800 mb-1">Dias de juros</span>
              <span className="text-[13px] text-gray-600">
                {item.diasJuros ? item.diasJuros : "—"}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-gray-800 mb-1">Fator de juros</span>
              <span className="text-[13px] text-gray-600">
                {item.fatorJuros && item.fatorJuros !== 1 ? item.fatorJuros.toFixed(6) : "—"}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-gray-800 mb-1">Acumulado juros(%)</span>
              <span className="text-[13px] text-gray-600">
                {item.percentualJurosAcumulado ? formatPercent(item.percentualJurosAcumulado) : "—"}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[12px] font-bold text-gray-800 mb-1">Juros (R$)</span>
              <span className="text-[13px] text-gray-600">{formatBRL(item.juros)}</span>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export default function LancamentoRow(props: LancamentoRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col bg-white border-b border-gray-200 transition-all hover:bg-gray-50/50">
      {/* ─── LINHA PRINCIPAL (Visível sempre) ─── */}
      <div
        className="flex flex-col md:grid md:grid-cols-[2.5rem_6rem_6rem_8rem_minmax(10rem,1fr)_7rem_4rem_8rem_6rem] md:items-center gap-3 md:gap-4 p-4 md:py-3 md:px-4 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <LancamentoRowDesktop {...props} isExpanded={isExpanded} />
        <LancamentoRowMobile {...props} isExpanded={isExpanded} />
      </div>

      {/* ─── ÁREA EXPANSÍVEL (Detalhes do Cálculo) ─── */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <LancamentoRowExpanded item={props.item} />
      </div>
    </div>
  );
}
