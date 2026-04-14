import TipoCalculo from "./TipoCalculo";
import Data from "./Data";
import IndiceCorrecao from "./IndiceCorrecao";
import InputValor from "./InputValor";
import Descricao from "./Descricao";
import Juros from "./Juros";
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
    <div className="flex flex-col bg-slate-50 rounded-lg pb-6 w-full p-4 md:p-8 gap-5 shadow-sm border border-slate-400">
      {/* Título */}
      <div className="text-[#1F2022] font-bold text-2xl md:text-3xl mb-2">
        <h1>Atualização Monetária</h1>
      </div>

      {/* Linha 1: Tipo de cálculo | Descrição | Data do cálculo */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-[20px] w-full">
        <div className="w-full md:w-auto">
          <TipoCalculo
            value={form.tipoCalculo}
            onChange={(v) => onFormChange("tipoCalculo", v)}
          />
        </div>
        <div className="w-full md:w-auto">
          <Descricao
            value={form.descricao}
            onChange={(v) => onFormChange("descricao", v)}
          />
        </div>
        <div className="w-full md:w-auto">
          <Data
            title="Data do cálculo"
            value={form.dataCalculo}
            onChange={(v) => onFormChange("dataCalculo", v)}
            max={today}
            min={form.dataInicial || undefined}
          />
        </div>
      </div>

      {/* Linha 2: Índice de correção | Valor | Data inicial | Aplicar juros? */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-[20px] items-start md:items-end w-full">
        <div className="w-full md:w-auto">
          <IndiceCorrecao
            value={form.indiceCorrecao}
            onChange={(v) => onFormChange("indiceCorrecao", v)}
          />
        </div>
        <div className="w-full md:w-auto">
          <InputValor
            value={form.valor}
            onChange={(v) => onFormChange("valor", v)}
          />
        </div>
        <div className="w-full md:w-auto">
          <Data
            title="Data inicial"
            value={form.dataInicial}
            onChange={(v) => onFormChange("dataInicial", v)}
            max={today}
          />
        </div>

        {/* Checkbox Aplicar juros? inline */}
        {!selicSelecionada && (
          <div className="flex items-center gap-3 mb-[12px] md:ml-[10px]">
            <input
              type="checkbox"
              id="aplicar-juros"
              checked={juros.enabled}
              onChange={(e) => onJurosChange("enabled", e.target.checked)}
              className="w-[18px] h-[18px] cursor-pointer"
            />
            <label
              htmlFor="aplicar-juros"
              className="text-[15px] text-[#333333] cursor-pointer select-none"
            >
              Aplicar juros?
            </label>
          </div>
        )}
      </div>

      {/* Painel expandido de juros (quando checkbox ativo) */}
      {juros.enabled && !selicSelecionada && (
        <Juros
          juros={juros}
          selicSelecionada={selicSelecionada}
          onJurosChange={onJurosChange}
          today={today}
          dataInicialForm={form.dataInicial}
        />
      )}

      {/* Erro */}
      {erro && (
        <div className="text-red-600 text-sm font-semibold bg-red-50 border border-red-200 rounded-md px-4 py-2">
          ⚠ {erro}
        </div>
      )}

      {/* Botões */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full">
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
