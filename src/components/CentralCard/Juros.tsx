import { useState } from "react";
import Data from "./Data";
import type { JurosState } from "../../types";
import { calcularJuros } from "../../services/api";
import { JUROS_DESCRICAO } from "../../constants/dominios";
import { PercentIcon } from "lucide-react";
import { useIndices } from "../../hooks/useIndices";

interface JurosProps {
  juros: JurosState;
  selicSelecionada: boolean;
  onJurosChange: (field: keyof JurosState, value: string | boolean | any[]) => void;
  today: string;
  dataInicialForm: string;
  dataCalculoForm: string;
}

function Juros({ juros, selicSelecionada, onJurosChange, today, dataInicialForm, dataCalculoForm }: JurosProps) {
  const { indice, taxa, aplicados = [] } = juros;
  const dataInicio = juros.dataInicio || dataInicialForm;
  const dataFim    = juros.dataFim    || dataCalculoForm;

  const [loading, setLoading]       = useState(false);
  const [erroLocal, setErroLocal]   = useState<string | null>(null);
  
  const { jurosIndiceOpcoes } = useIndices();

  if (selicSelecionada) return null;

  const handleAplicar = async () => {
    if (!dataInicio || !dataFim) {
      setErroLocal("Informe as datas de início e fim dos juros.");
      return;
    }
    if (dataFim <= dataInicio) {
      setErroLocal("A data final deve ser maior que a data inicial.");
      return;
    }

    setErroLocal(null);
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 400));

      const novosAplicados: any[] = [];


      const addAplicado = async (idx: string, dInicio: string, dFim: string, taxaAtual: string) => {
        const resp = await calcularJuros(
          idx,
          { valor: 100, dateInit: dInicio, dateFim: dFim },
          parseFloat(taxaAtual.replace(",", "."))
        );
        if (resp) {
          novosAplicados.push({
            id:         Date.now() + Math.random(),
            indice:     idx,
            taxa:       taxaAtual,
            dataInicio: dInicio,
            dataFim:    dFim,
            dias:       resp.dias || 0,
            fator:      resp.fatorAcumulado || 0,
            percentual: resp.percentualAcumulado || 0,
          });
        }
      };

      await addAplicado(indice, dataInicio, dataFim, taxa);

      onJurosChange("aplicados", [...aplicados, ...novosAplicados]);
    } catch (e: any) {
      setErroLocal(e.message || "Erro ao calcular juros");
    } finally {
      setLoading(false);
    }
  };

  const handleRemover = (id: number) => {
    onJurosChange("aplicados", aplicados.filter((a) => a.id !== id));
  };

  const mostraTaxa = ["jurossimples6", "jurossimples12", "especificartaxa"].includes(indice);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col md:flex-row flex-wrap gap-4 items-start md:items-end w-full">

        {/* Índice de juros */}
        <div className="flex flex-col gap-1 w-full md:w-auto">
          <strong className="text-[13px] text-gray-700 dark:text-gray-300 font-semibold">Índice de juros</strong>
          <select
            value={indice}
            onChange={(e) => onJurosChange("indice", e.target.value)}
            className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 h-[45px] w-full sm:w-[330px] px-3 rounded-md text-sm text-gray-700 dark:text-gray-200 outline-none cursor-pointer"
          >
            {jurosIndiceOpcoes.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Taxa de juros (condicional) */}
        {mostraTaxa && (
          <div className="flex flex-col gap-1 w-full md:w-auto">
            <strong className="text-[13px] text-gray-700 dark:text-gray-300 font-semibold">Taxa de juros</strong>
            <div className="relative">
              <input
                type="text"
                value={taxa}
                onChange={(e) => onJurosChange("taxa", e.target.value.replace(/[^\d,]/g, ""))}
                className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 h-[45px] w-full md:w-[220px] pl-3 pr-16 rounded-md text-sm text-gray-700 dark:text-gray-200 outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none">
                % a.a.
              </span>
            </div>
          </div>
        )}

        <div className="w-full md:w-auto">
          <Data
            title="Data de início dos juros"
            value={dataInicio}
            onChange={(v) => onJurosChange("dataInicio", v)}
            max={today}
            min={dataInicialForm || undefined}
          />
        </div>

        <div className="w-full md:w-auto">
          <Data
            title="Aplicar juros até"
            value={dataFim}
            onChange={(v) => onJurosChange("dataFim", v)}
            max={today}
            min={dataInicio || dataInicialForm || undefined}
          />
        </div>

        <div className="w-full md:w-auto pb-[2px]">
          <button
            type="button"
            onClick={handleAplicar}
            disabled={loading}
            className="flex items-center justify-center h-[45px] px-6 gap-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md text-sm text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
            <PercentIcon size={18} />
            {loading ? "Aplicando..." : "Aplicar"}
          </button>
        </div>
      </div>

      {/* Descrição do índice selecionado */}
      {JUROS_DESCRICAO[indice] && (
        <div className="bg-[#eaecf0] dark:bg-slate-800 border border-[#979797] dark:border-slate-600 w-[66%] mt-[6px] rounded-md p-3">
          <p className="text-[13px] text-gray-600 dark:text-gray-300 leading-relaxed">
            *{JUROS_DESCRICAO[indice]}
          </p>
        </div>
      )}

      {erroLocal && (
        <p className="text-red-600 text-sm font-semibold">{erroLocal}</p>
      )}

      {/* Tabela de juros aplicados */}
      {aplicados.length > 0 && (
        <div className="w-full overflow-x-auto mt-2 border border-[#d2daee] dark:border-slate-600 rounded-md">
          <table className="w-full min-w-[500px] text-left text-[13px]">
            <thead>
              <tr className="bg-[#e4ebf7] dark:bg-slate-700 text-[#1F2022] dark:text-gray-100">
                <th className="py-3 px-4 font-semibold w-[15%]">Data inicial</th>
                <th className="py-3 px-4 font-semibold w-[15%]">Data final</th>
                <th className="py-3 px-4 font-semibold w-[15%]">Dias</th>
                <th className="py-3 px-4 font-semibold w-[15%]">Fator</th>
                <th className="py-3 px-4 font-semibold w-[20%]">% Acumulado</th>
                <th className="py-3 px-4 font-semibold w-[10%] text-center"></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800">
              {aplicados.map((item) => (
                <tr key={item.id} className="border-t border-[#d2daee] dark:border-slate-600 text-gray-800 dark:text-gray-200">
                  <td className="py-3 px-4">{new Date(item.dataInicio + "T12:00:00").toLocaleDateString("pt-BR")}</td>
                  <td className="py-3 px-4">{new Date(item.dataFim   + "T12:00:00").toLocaleDateString("pt-BR")}</td>
                  <td className="py-3 px-4">{item.dias}</td>
                  <td className="py-3 px-4">{item.taxa ? item.taxa.replace(/,00$/, "") : "—"}</td>
                  <td className="py-3 px-4">{item.percentual.toFixed(2).replace(".", ",")}%</td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemover(item.id)}
                      className="text-gray-500 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Juros;