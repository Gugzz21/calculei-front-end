import { useState } from "react";
import Data from "./Data";
import type { JurosState } from "../../App";
import { calcularJuros } from "../../services/api";

interface JurosProps {
  juros: JurosState;
  selicSelecionada: boolean;
  onJurosChange: (field: keyof JurosState, value: string | boolean | any[]) => void;
  today: string;
  dataInicialForm: string;
  dataCalculoForm: string;
}

const JUROS_LABEL_DESCRICAO: Record<string, string> = {
  codigo: "6% ao ano ou 0,5% ao mês até 10/01/2003; 12% ao ano ou 1% ao mês a partir de 11/01/2003.",
  jurossimples6: "Juros simples de 6% ao ano (0,5% ao mês).",
  jurossimples12: "Juros simples de 12% ao ano (1% ao mês).",
  selic: "Taxa SELIC acumulada no período, conforme Banco Central do Brasil.",
  cdi: "Taxa CDI acumulada no período, conforme Banco Central do Brasil.",
  poupancanova: "Poupança Nova: Taxa Selic quando abaixo de 8,5% a.a., ou 0,5% a.m. + TR.",
  poupancaantiga: "Poupança Antiga: 0,5% a.m. até 03/05/2012; 0,5% a.m. + TR a partir de 04/05/2012.",
  poupanca: "Poupança (Antiga + Nova): 0,5% a.m. até 03/05/2012; Taxa Selic quando abaixo de 8,5% a.a., ou 0,5% a.m. + TR a partir de 04/05/2012.",
  taxalegal: "Taxa Legal: 1% a.m. até 10/01/2003; 0,5% a.m. de 11/01/2003 a 09/01/2006; 1% a.m. a partir de 10/01/2006.",
  especificartaxa: "Taxa a ser especificada pelo usuário.",
};

function Juros({ juros, selicSelecionada, onJurosChange, today, dataInicialForm, dataCalculoForm }: JurosProps) {
  const { indice, taxa, aplicados = [] } = juros;
  const dataInicio = juros.dataInicio || dataInicialForm;
  const dataFim = juros.dataFim || dataCalculoForm;

  const [loading, setLoading] = useState(false);
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  const jurosDesativado = selicSelecionada;
  if (jurosDesativado) return null;

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
      const novosAplicados: any[] = [];
      const dataCorte = "2003-01-10";
      const dataInicioPosCorte = "2003-01-11";

      const addAplicado = async (
        idx: string,
        dInicio: string,
        dFim: string,
        taxaAtual: string
      ) => {
        const resp = await calcularJuros(
          idx,
          { valor: 100, dateInit: dInicio, dateFim: dFim },
          parseFloat(taxaAtual.replace(",", "."))
        );
        if (resp) {
          novosAplicados.push({
            id: Date.now() + Math.random(),
            indice: idx,
            taxa: taxaAtual,
            dataInicio: dInicio,
            dataFim: dFim,
            dias: resp.dias || 0,
            fator: resp.fatorAcumulado || 0,
            percentual: resp.percentualAcumulado || 0,
          });
        }
      };

      if (indice === "codigo" || indice === "codigocivil") {
        if (dataFim <= dataCorte) {
          // Apenas a primeira fase (6%)
          await addAplicado("jurossimples6", dataInicio, dataFim, "6,00");
        } else if (dataInicio >= dataInicioPosCorte) {
          // Apenas a segunda fase (12%)
          await addAplicado("jurossimples12", dataInicio, dataFim, "12,00");
        } else {
          // Divide em duas fases
          await addAplicado("jurossimples6", dataInicio, dataCorte, "6,00");
          await addAplicado("jurossimples12", dataInicioPosCorte, dataFim, "12,00");
        }
      } else {
        await addAplicado(indice, dataInicio, dataFim, taxa);
      }

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

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col md:flex-row flex-wrap gap-4 items-start md:items-end w-full">

        {/* Índice de juros */}
        <div className="flex flex-col gap-1 w-full md:w-auto">
          <strong className="text-[13px] text-gray-700 font-semibold">Índice de juros</strong>
          <select
            value={indice}
            onChange={(e) => onJurosChange("indice", e.target.value)}
            className="bg-white border border-gray-300 h-[45px] w-full md:w-[330px] px-3 rounded-md text-sm text-gray-700 outline-none cursor-pointer"
          >
            <option value="codigo">Código Civil</option>
            <option value="jurossimples6">Juros Simples 6% a.a.</option>
            <option value="jurossimples12">Juros Simples 12% a.a.</option>
            <option value="selic">SELIC</option>
            <option value="cdi">CDI</option>
            <option value="poupancanova">Poupança Nova</option>
            <option value="poupancaantiga">Poupança Antiga</option>
            <option value="poupanca">Poupança (Antiga + Nova)</option>
            <option value="taxalegal">TAXA LEGAL</option>
            <option value="especificartaxa">Especificar Taxa</option>
          </select>
        </div>

        {/* Taxa de juros (condicional) */}
        {(indice === 'jurossimples6' || indice === 'jurossimples12' || indice === 'especificartaxa') && (
          <div className="flex flex-col gap-1 w-full md:w-auto">
            <strong className="text-[13px] text-gray-700 font-semibold">Taxa de juros</strong>
            <div className="relative">
              <input
                type="text"
                value={taxa}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^\d,]/g, "");
                  onJurosChange("taxa", val);
                }}
                className="bg-white border border-gray-300 h-[45px] w-full md:w-[220px] pl-3 pr-16 rounded-md text-sm text-gray-700 outline-none"
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
            className="flex items-center justify-center h-[45px] px-6 gap-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
            {loading ? "Aplicando..." : "Aplicar"}
          </button>
        </div>
      </div>

      {/* Descrição do índice selecionado */}
      {indice && (
        <div className="bg-gray-100 border border-gray-200 rounded-md p-3">
          <p className="text-[13px] text-gray-600 leading-relaxed">
            *{JUROS_LABEL_DESCRICAO[indice]}
          </p>
        </div>
      )}

      {erroLocal && (
        <p className="text-red-600 text-sm font-semibold">{erroLocal}</p>
      )}

      {/* Tabela de juros aplicados */}
      {aplicados.length > 0 && (
        <div className="w-full overflow-x-auto mt-2 border border-[#d2daee] rounded-md">
          <table className="w-full min-w-[500px] text-left text-[13px]">
            <thead>
              <tr className="bg-[#e4ebf7] text-[#1F2022]">
                <th className="py-3 px-4 font-semibold w-[15%]">Data inicial</th>
                <th className="py-3 px-4 font-semibold w-[15%]">Data final</th>
                <th className="py-3 px-4 font-semibold w-[15%]">Dias</th>
                <th className="py-3 px-4 font-semibold w-[15%]">Fator</th>
                <th className="py-3 px-4 font-semibold w-[20%]">% Acumulado</th>
                <th className="py-3 px-4 font-semibold w-[10%] text-center"></th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {aplicados.map((item) => (
                <tr key={item.id} className="border-t border-[#d2daee]">
                  <td className="py-3 px-4">{new Date(item.dataInicio + "T12:00:00").toLocaleDateString('pt-BR')}</td>
                  <td className="py-3 px-4">{new Date(item.dataFim + "T12:00:00").toLocaleDateString('pt-BR')}</td>
                  <td className="py-3 px-4">{item.dias}</td>
                  <td className="py-3 px-4">{item.taxa ? item.taxa.replace(/,00$/, "") : "—"}</td>
                  <td className="py-3 px-4">{(item.percentual).toFixed(2).replace(".", ",")}%</td>
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