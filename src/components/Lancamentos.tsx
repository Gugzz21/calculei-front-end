import type { LancamentoItem } from "../App";

interface LancamentosProps {
  lancamentos: LancamentoItem[];
  onRemover: (id: number) => void;
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function formatPercent(value: number): string {
  return `${Number(value).toFixed(4)}%`;
}

function Lancamentos({ lancamentos, onRemover }: LancamentosProps) {
  return (
    <div className="flex flex-col mx-auto bg-slate-50 rounded-lg pb-6 w-[95%] md:w-full max-w-[1200px] h-auto md:ml-95 p-4 md:p-6 mt-6 gap-5 shadow-sm border border-slate-200 overflow-hidden">
      <h1 className="text-[18px] text-gray-700 font-semibold">Lançamentos</h1>

      {lancamentos.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Nenhum cálculo realizado ainda. Preencha os dados acima e clique em Calcular.</p>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm text-gray-700 min-w-[900px]">
            <thead>
              <tr className="border-b-2 border-gray-300 text-left text-[11px] text-gray-500 uppercase">
                <th className="pb-2 pr-4">Descrição</th>
                <th className="pb-2 pr-4">Data Inicial</th>
                <th className="pb-2 pr-4">Valor Principal</th>
                <th className="pb-2 pr-4">Data do Cálculo</th>
                <th className="pb-2 pr-4">Índice de Correção</th>
                <th className="pb-2 pr-4">Valor Atualizado</th>
                <th className="pb-2 pr-4">Dias</th>
                <th className="pb-2 pr-4">% Correção</th>
                <th className="pb-2 pr-4">Juros</th>
                <th className="pb-2 pr-4">Total</th>
                <th className="pb-2">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {lancamentos.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 pr-4 font-medium">{l.descricao}</td>
                  <td className="py-3 pr-4">{formatDate(l.dataInicial)}</td>
                  <td className="py-3 pr-4">{formatBRL(l.valorPrincipal)}</td>
                  <td className="py-3 pr-4">{formatDate(l.dataCalculo)}</td>
                  <td className="py-3 pr-4">{l.indiceCorrecao}</td>
                  <td className="py-3 pr-4 text-blue-700 font-semibold">{formatBRL(l.valorAtualizado)}</td>
                  <td className="py-3 pr-4">{l.dias}</td>
                  <td className="py-3 pr-4">{formatPercent(l.percentualCorrecao)}</td>
                  <td className="py-3 pr-4">{formatBRL(l.juros)}</td>
                  <td className="py-3 pr-4 text-green-700 font-bold">{formatBRL(l.total)}</td>
                  <td className="py-3">
                    <button
                      onClick={() => onRemover(l.id)}
                      className="text-red-400 hover:text-red-600 transition-colors text-xs font-semibold px-2 py-1 rounded border border-red-200 hover:border-red-400"
                      title="Remover lançamento"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Totais */}
            {lancamentos.length > 1 && (
              <tfoot>
                <tr className="border-t-2 border-gray-400 text-sm font-bold text-gray-700 bg-gray-50">
                  <td className="pt-3 pr-4" colSpan={2}>Total Geral</td>
                  <td className="pt-3 pr-4">{formatBRL(lancamentos.reduce((s, l) => s + l.valorPrincipal, 0))}</td>
                  <td className="pt-3 pr-4" colSpan={2}></td>
                  <td className="pt-3 pr-4 text-blue-700">{formatBRL(lancamentos.reduce((s, l) => s + l.valorAtualizado, 0))}</td>
                  <td className="pt-3 pr-4">{lancamentos.reduce((s, l) => s + l.dias, 0)}</td>
                  <td className="pt-3 pr-4"></td>
                  <td className="pt-3 pr-4">{formatBRL(lancamentos.reduce((s, l) => s + l.juros, 0))}</td>
                  <td className="pt-3 pr-4 text-green-700">{formatBRL(lancamentos.reduce((s, l) => s + l.total, 0))}</td>
                  <td className="pt-3"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  );
}

export default Lancamentos;