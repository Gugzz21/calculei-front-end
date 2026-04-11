import Data from "./Data";
import type { JurosState } from "../../App";

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
  poupancanova: "Poupança Nova: Taxa Selic quando abaixo de 8,5% a.a., ou 0,5% a.m. + TR.",
  poupancaantiga: "Poupança Antiga: 0,5% a.m. até 03/05/2012; 0,5% a.m. + TR a partir de 04/05/2012.",
  poupanca: "Poupança (Antiga + Nova): 0,5% a.m. até 03/05/2012; Taxa Selic quando abaixo de 8,5% a.a., ou 0,5% a.m. + TR a partir de 04/05/2012.",
  taxalegal: "Taxa Legal: 1% a.m. até 10/01/2003; 0,5% a.m. de 11/01/2003 a 09/01/2006; 1% a.m. a partir de 10/01/2006.",
  especificartaxa: "Taxa a ser especificada pelo usuário.",
};

function Juros({ juros, selicSelecionada, onJurosChange, today, dataInicialForm }: JurosProps) {
  const { indice, dataInicio, dataFim, taxa } = juros;

  const jurosDesativado = selicSelecionada;
  if (jurosDesativado) return null;

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col md:flex-row flex-wrap gap-4 md:gap-6 items-start md:items-end w-full">

        {/* Índice de juros */}
        <div className="flex flex-col gap-1 w-full md:w-auto">
          <strong className="text-[13px] text-gray-700 font-semibold">Índice de juros</strong>
          <select
            value={indice}
            onChange={(e) => onJurosChange("indice", e.target.value)}
            className="bg-white border border-gray-300 h-[45px] w-full md:w-[280px] px-3 rounded-md text-sm text-gray-700 outline-none cursor-pointer"
          >
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
      </div>

      {/* Descrição do índice selecionado */}
      {indice && (
        <p className="text-[12px] text-gray-500 leading-relaxed">
          {JUROS_LABEL_DESCRICAO[indice]}
        </p>
      )}
    </div>
  );
}

export default Juros;