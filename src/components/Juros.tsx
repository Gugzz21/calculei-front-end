import Data from "./CentralCard/Data";
import type { JurosState } from "../App";

interface JurosProps {
  juros: JurosState;
  selicSelecionada: boolean;
  onJurosChange: (field: keyof JurosState, value: string | boolean) => void;
  today: string;
  dataInicialForm: string;
}

const JUROS_LABEL_DESCRICAO: Record<string, string> = {
  codigocivil: "6% ao ano ou 0,5% ao mês até 10/01/2003; 12% ao ano ou 1% ao mês a partir de 11/01/2003.",
  jurossimples6: "Juros simples de 6% ao ano (0,5% ao mês).",
  jurossimples12: "Juros simples de 12% ao ano (1% ao mês).",
  selic: "Taxa SELIC acumulada no período, conforme Banco Central do Brasil.",
  cdi: "Taxa CDI acumulada no período, conforme Banco Central do Brasil.",
  poupanca: "Poupança Nova: Taxa Selic quando abaixo de 8,5% a.a., ou 0,5% a.m. + TR.",
};

function Juros({ juros, selicSelecionada, onJurosChange, today, dataInicialForm }: JurosProps) {
  const { enabled, indice, dataInicio, dataFim } = juros;

  // Quando SELIC é o índice de correção, desativa o toggle de juros também
  const jurosDesativado = selicSelecionada;

  return (
    <div className="">
      {/* Linha sempre visível: label "Juros" + switch */}
      <div className="flex flex-col gap-3">
        <strong className="text-[14px] text-gray-700 font-semibold">
          Juros
          {jurosDesativado && (
            <span className="ml-2 text-[11px] text-orange-500 font-normal">
              (desativado — SELIC já inclui juros)
            </span>
          )}
        </strong>

        {/* Switch visual */}
        <button
          type="button"
          onClick={() => !jurosDesativado && onJurosChange("enabled", !enabled)}
          disabled={jurosDesativado}
          className={`relative w-[42px] h-[24px] rounded-full transition-colors duration-300 focus:outline-none
            ${jurosDesativado ? "bg-gray-200 cursor-not-allowed" : enabled ? "bg-blue-500" : "bg-gray-300 cursor-pointer"}`}
          aria-label="Ativar juros"
        >
          <span
            className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] bg-white rounded-full shadow transition-transform duration-300 
              ${enabled && !jurosDesativado ? "translate-x-[18px]" : "translate-x-0"}`}
          />
        </button>
      </div>

      {/* Conteúdo que só aparece quando o switch está ligado e juros não está desativado */}
      {enabled && !jurosDesativado && (
        <div className="flex flex-col gap-4 mt-4 w-full">
          <div className="flex flex-col md:flex-row flex-wrap gap-4 md:gap-6 items-start md:items-end w-full">

            {/* Índice de juros */}
            <div className="flex flex-col gap-1 w-full md:w-auto">
              <strong className="text-[13px] text-gray-700 font-semibold">Índice de juros</strong>
              <select
                value={indice}
                onChange={(e) => onJurosChange("indice", e.target.value)}
                className="bg-white border border-blue-400 h-[45px] w-full md:w-[280px] px-3 rounded-md text-sm text-gray-700 outline-none cursor-pointer"
              >
                <option value="codigocivil">Juros do Código Civil - Lei nº 10406/02</option>
                <option value="jurossimples6">Juros Simples 6% a.a.</option>
                <option value="jurossimples12">Juros Simples 12% a.a.</option>
                <option value="selic">SELIC</option>
                <option value="cdi">CDI</option>
                <option value="poupanca">Poupança (Nova)</option>
              </select>
            </div>

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
          </div>

          {/* Descrição do índice selecionado */}
          {indice && (
            <p className="text-[12px] text-gray-500 leading-relaxed">
              {JUROS_LABEL_DESCRICAO[indice]}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default Juros;