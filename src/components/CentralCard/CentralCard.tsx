import TipoCalculo from "./TipoCalculo";
import Data from "./Data";
import IndiceCorrecao from "./IndiceCorrecao";
import InputValor from "./InputValor";
import Descricao from "./Descricao";
import Juros from "../Juros";
import Calcular from "./Calcular";
import Limpar from "./Limpar";
import type { FormState, JurosState } from "../../App";

interface CentralCardProps {
  form: FormState;
  juros: JurosState;
  today: string;
  loading: boolean;
  erro: string | null;
  isFormValid: boolean;
  onFormChange: (field: keyof FormState, value: string) => void;
  onJurosChange: (field: keyof JurosState, value: string | boolean) => void;
  onCalcular: () => void;
  onLimpar: () => void;
}

function CentralCard({
  form,
  juros,
  today,
  loading,
  erro,
  isFormValid,
  onFormChange,
  onJurosChange,
  onCalcular,
  onLimpar,
}: CentralCardProps) {
  const selicSelecionada =
    form.indiceCorrecao === "selic" ||
    form.indiceCorrecao === "tjrj119602009ipcaeselic";

  return (
    <div className="flex flex-col mx-auto bg-slate-50 rounded-lg pb-6 w-[95%] md:w-full max-w-[1200px] h-auto md:ml-95 p-4 md:p-6 gap-5 shadow-sm border border-slate-400">
      <div className="text-gray-600 font-bold text-2xl md:text-3xl mb-4 md:mb-6">
        <h1 className="underline">Atualização Monetária</h1>
      </div>

      {/* Linha 1: Tipo de Cálculo + Índice de Correção */}
      <div className="flex flex-col md:flex-row w-full gap-2 md:gap-3">
        <div className="flex-1 w-full">
          <TipoCalculo
            value={form.tipoCalculo}
            onChange={(v) => onFormChange("tipoCalculo", v)}
          />
        </div>
        <div className="flex-1 w-full">
          <IndiceCorrecao
            value={form.indiceCorrecao}
            onChange={(v) => onFormChange("indiceCorrecao", v)}
          />
        </div>
      </div>

      {/* Linha 2: Valor + Data Inicial + Data do Cálculo + Descrição */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-end w-full">
        <div className="w-full md:w-auto">
          <InputValor
            value={form.valor}
            onChange={(v) => onFormChange("valor", v)}
          />
        </div>
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="w-full md:w-auto">
            <Data
              title="Data Inicial"
              value={form.dataInicial}
              onChange={(v) => onFormChange("dataInicial", v)}
              max={today}
            />
          </div>
          <div className="w-full md:w-auto">
            <Data
              title="Data do Cálculo"
              value={form.dataCalculo}
              onChange={(v) => onFormChange("dataCalculo", v)}
              max={today}
              min={form.dataInicial || undefined}
            />
          </div>
        </div>
        <div className="w-full md:w-auto">
          <Descricao
            value={form.descricao}
            onChange={(v) => onFormChange("descricao", v)}
          />
        </div>
      </div>

      <div className="text-[12px] mt-2 md:mt-4 text-gray-400">
        Todos os valores estão em Reais (R$) A presente calculadora virtual não
        substitui o cálculo realizado e homologado judicialmente.
      </div>

      {/* Linha 3: Juros */}
      <div className="flex flex-col gap-6 w-full">
        <Juros
          juros={juros}
          selicSelecionada={selicSelecionada}
          onJurosChange={onJurosChange}
          today={today}
          dataInicialForm={form.dataInicial}
        />
      </div>

      {/* Erro */}
      {erro && (
        <div className="text-red-600 text-sm font-semibold bg-red-50 border border-red-200 rounded-md px-4 py-2">
          ⚠ {erro}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 md:gap-6 justify-end w-full">
        <Calcular
          onClick={onCalcular}
          loading={loading}
          disabled={!isFormValid}
        />
        <Limpar onClick={onLimpar} />
      </div>
    </div>
  );
}

export default CentralCard;
