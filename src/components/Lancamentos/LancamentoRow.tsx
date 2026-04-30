import { useState } from "react";
import type { LancamentoItem } from "../../App";
import { formatBRL, formatDate, formatPercent } from "./utils";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditIcon from "@mui/icons-material/Edit";

interface LancamentoRowProps {
  item: LancamentoItem;
  index: number;
  onRemover: (id: number) => void;
  onEditar: (id: number) => void;
}

function LancamentoRow({ item, index, onRemover, onEditar }: LancamentoRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden transition-all shadow-sm hover:shadow-md">
      {/* ─── LINHA PRINCIPAL (Visível sempre) ─── */}
      <div
        className="flex flex-col md:grid md:grid-cols-[2.5rem_minmax(0,1fr)_10rem_8rem_9rem_5rem] md:items-center gap-4 p-4 cursor-pointer select-none hover:bg-gray-50/50 transition-colors group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Mobile: Linha Superior (Ícone + # + Descrição) | Desktop: Coluna 1 & 2 */}
        <div className="flex items-start md:contents">
          {/* Col 1: Ícone de Expansão */}
          <div className="flex items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors mt-[2px] md:mt-0 shrink-0">
            {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </div>

          {/* Col 2: Info Base (# e Descrição) */}
          <div className="flex items-start md:items-center gap-3 flex-1 md:flex-none w-full">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold text-xs shrink-0">
              {index}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-gray-800 text-sm md:text-base leading-tight">
                {item.descricao}
              </span>
              <span className="text-xs text-gray-500 mt-1 md:hidden">
                De {formatDate(item.dataInicial)} até {formatDate(item.dataCalculo)}
              </span>
            </div>
          </div>
        </div>

        {/* Col 3: Datas (Desktop) */}
        <div className="hidden md:flex flex-col">
          <span className="text-xs text-gray-500">Inicial: {formatDate(item.dataInicial)}</span>
          <span className="text-xs font-semibold text-gray-700">Cálculo: {formatDate(item.dataCalculo)}</span>
        </div>

        {/* Mobile: Linha Inferior (Valores e Ações) | Desktop: Coluna 4, 5 & 6 */}
        <div className="flex items-center justify-between md:contents w-full mt-2 md:mt-0 ml-7 md:ml-0">

          {/* Col 4: Principal */}
          <div className="flex flex-col md:items-end">
            <span className="text-[10px] text-gray-400 uppercase font-semibold md:hidden">Valor Original</span>
            <span className="text-sm font-medium text-gray-600">{formatBRL(item.valorPrincipal)}</span>
          </div>

          {/* Col 5: Total Calculado */}
          <div className="flex flex-col md:items-end">
            <span className="text-[10px] text-green-600/70 uppercase font-bold md:hidden">Total Calculado</span>
            <span className="text-base font-bold text-green-600">{formatBRL(item.total)}</span>
          </div>

          {/* Col 6: Ações */}
          <div className="flex items-center justify-end md:justify-center gap-1 shrink-0">

            {/* Botão Editar */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditar(item.id);
              }}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Editar lançamento"
            >
              <EditIcon fontSize="small" />
            </button>

            {/* Botão Remover */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemover(item.id);
              }}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Remover lançamento"
            >
              <DeleteOutlinedIcon fontSize="small" />
            </button>

          </div>
        </div>
      </div>

      {/* ─── ÁREA EXPANSÍVEL (Detalhes do Cálculo) ─── */}
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="p-4 pt-0 bg-gray-50/50 border-t border-gray-100 flex flex-col md:flex-row gap-6">

            {/* Bloco Correção Monetária */}
            <div className="flex-1 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Correção Monetária</h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex flex-col">
                  <span className="text-[11px] text-gray-500">Índice</span>
                  <span className="text-sm font-semibold text-gray-800">{item.indiceCorrecao}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-gray-500">% Aplicado</span>
                  <span className="text-sm font-semibold text-gray-800">{formatPercent(item.percentualCorrecao)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-gray-500">Dias Corridos</span>
                  <span className="text-sm font-semibold text-gray-800">{item.dias} dias</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-blue-600">Valor Atualizado</span>
                  <span className="text-sm font-bold text-blue-700">{formatBRL(item.valorAtualizado)}</span>
                </div>
              </div>
            </div>

            {/* Bloco Juros */}
            <div className="flex-1 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Juros de Mora</h4>
              {item.indiceJuros !== "—" ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-gray-500">Índice</span>
                    <span className="text-sm font-semibold text-indigo-700">{item.indiceJuros}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-gray-500">Período</span>
                    <span className="text-xs font-semibold text-gray-700 mt-0.5">
                      {item.dataInicioJuros ? `${formatDate(item.dataInicioJuros)} até ${formatDate(item.dataFimJuros)}` : "—"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-amber-600">Valor dos Juros</span>
                    <span className="text-sm font-bold text-amber-700">{formatBRL(item.juros)}</span>
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center text-sm text-gray-400 italic pb-2">
                  Nenhum juros aplicado neste lançamento.
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default LancamentoRow;
