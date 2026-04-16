import type { LancamentoItem } from "../../App";
import { formatBRL, formatDate, formatPercent } from "./utils";

interface TabelaLancamentosProps {
  currentItems: LancamentoItem[];
  lancamentos: LancamentoItem[];   // todos (para totais e tfoot)
  startIndex: number;
  currentPage: number;
  totalPages: number;
  onRemover: (id: number, isLastInPage: boolean) => void;
}

function TabelaLancamentos({
  currentItems,
  lancamentos,
  startIndex,
  currentPage,
  totalPages,
  onRemover,
}: TabelaLancamentosProps) {
  return (
    <div className="overflow-x-auto w-full">
      <table className="text-sm text-gray-700 w-full">
        <thead>
          <tr className="border-b-2 border-gray-300 text-left text-[12px] text-black bg-gray-300 uppercase divide-x divide-slate-500">
            <th className="pb-2 pt-2 pl-2 pr-4 underline px-6">#</th>
            <th className="pb-2 pt-2 pr-4 underline px-6">Descrição</th>
            <th className="pb-2 pt-2 pr-4 underline px-6">Data</th>
            <th className="pb-2 pt-2 pr-4 underline px-6">Valor Principal</th>
            <th className="pb-2 pt-2 pr-4 underline px-6">Índice Correção</th>
            <th className="pb-2 pt-2 pr-4 underline px-6">%Correção</th>
            <th className="pb-2 pt-2 pr-4 underline px-6">Valor Atualizado</th>
            <th className="pb-2 pt-2 pr-4 underline px-6">Dias</th>
            <th className="pb-2 pt-2 pr-4 underline px-6">Índice Juros</th>
            <th className="pb-2 pt-2 pr-4 underline px-6">Juros</th>
            <th className="pb-2 pt-2 pr-4 underline px-6">Total</th>
            <th className="pb-2 pt-2 pr-4 underline px-6">Ações</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-500">
          {currentItems.map((l, index) => (
            <tr
              key={l.id}
              className="hover:bg-gray-50 transition-colors divide-x divide-slate-500"
            >
              <td className="py-3 pl-4 pr-6 font-medium">{startIndex + index + 1}</td>
              <td className="py-3 pl-4 pr-6 font-medium">{l.descricao}</td>
              <td className="py-3 pl-4 pr-6 text-[11px] leading-tight">
                <div className="flex flex-col">
                  <span className="text-gray-600 font-medium">
                    Inicial: {formatDate(l.dataInicial)}
                  </span>
                  <span className="text-gray-600 font-bold">
                    Cálculo: {formatDate(l.dataCalculo)}
                  </span>
                </div>
              </td>
              <td className="py-3 pl-4 pr-6">{formatBRL(l.valorPrincipal)}</td>
              <td className="py-3 pl-4 pr-6">{l.indiceCorrecao}</td>
              <td className="py-3 pl-4 pr-6">{formatPercent(l.percentualCorrecao)}</td>
              <td className="py-3 pl-4 pr-6 text-blue-700 font-semibold">
                {formatBRL(l.valorAtualizado)}
              </td>
              <td className="py-3 pl-4 pr-6 text-center">{l.dias}</td>

              {/* Índice de Juros */}
              <td className="py-3 pl-4 pr-6 text-[11px] leading-tight">
                {l.indiceJuros !== "—" ? (
                  <div className="flex flex-col">
                    <span className="font-semibold text-indigo-700">{l.indiceJuros}</span>
                    {l.dataInicioJuros && (
                      <span className="text-gray-500">
                        {formatDate(l.dataInicioJuros)} → {formatDate(l.dataFimJuros)}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>

              <td className="py-3 pl-4 pr-6">{formatBRL(l.juros)}</td>
              <td className="py-3 pl-4 pr-6 text-green-700 font-bold">{formatBRL(l.total)}</td>
              <td className="py-3 pl-4 pr-6">
                <button
                  onClick={() => onRemover(l.id, currentItems.length === 1)}
                  className="text-red-400 hover:text-red-600 transition-colors text-xs font-semibold px-2 py-1 rounded border border-red-200 hover:border-red-400"
                  title="Remover lançamento"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>

        {/* Total Geral — exibe apenas na última página com mais de 1 item */}
        {lancamentos.length > 1 && currentPage === totalPages && (
          <tfoot>
            <tr className="border-t-2 border-gray-400 text-sm font-bold text-gray-700 bg-gray-100 divide-x divide-slate-400">
              <td className="py-3 pl-4 pr-6" colSpan={3}>Total Geral</td>
              <td className="py-3 pl-4 pr-6">
                {formatBRL(lancamentos.reduce((s, l) => s + l.valorPrincipal, 0))}
              </td>
              <td className="py-3 pl-4 pr-6" colSpan={2}></td>
              <td className="py-3 pl-4 pr-6 text-blue-700">
                {formatBRL(lancamentos.reduce((s, l) => s + l.valorAtualizado, 0))}
              </td>
              <td className="py-3 pl-4 pr-6 text-center">
                {lancamentos.reduce((s, l) => s + l.dias, 0)}
              </td>
              <td className="py-3 pl-4 pr-6"></td>
              <td className="py-3 pl-4 pr-6">
                {formatBRL(lancamentos.reduce((s, l) => s + l.juros, 0))}
              </td>
              <td className="py-3 pl-4 pr-6 text-green-700">
                {formatBRL(lancamentos.reduce((s, l) => s + l.total, 0))}
              </td>
              <td className="py-3 pl-4 pr-6"></td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

export default TabelaLancamentos;
