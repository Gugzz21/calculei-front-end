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
  editandoId: number | null;
  onFormChange: (field: keyof FormState, value: string) => void;
  onJurosChange: (field: keyof JurosState, value: string | boolean | any[]) => void;
  onCalcular: () => void;
  onLimpar: () => void;
  onCancelarEdicao: () => void;
}

function CentralCard({
  form,
  juros,
  today,
  loading,
  erro,
  isFormValid,
  editandoId,
  onFormChange,
  onJurosChange,
  onCalcular,
  onLimpar,
  onCancelarEdicao,
}: CentralCardProps) {
  const selicSelecionada = form.indiceCorrecao === "selic";

  let totalDias = 0;
  if (form.dataInicial && form.dataCalculo) {
    const dInicial = new Date(form.dataInicial).getTime();
    const dCalculo = new Date(form.dataCalculo).getTime();
    totalDias = (dCalculo - dInicial) > 0 ? (dCalculo - dInicial) / (1000 * 60 * 60 * 24) : 0;
  }
  const valorNumerico = form.valor ? parseInt(form.valor, 10) / 100 : 0;
  const multaTotal = valorNumerico * 0.01 * totalDias;

  return (
    <div className="flex flex-col bg-white rounded-xl pb-6 p-3 sm:p-5 md:p-8 gap-5 shadow-md border border-slate-200">

      {/* ── Banner modo edição ─────────────────────────────────────── */}
      {editandoId !== null && (
        <div className="flex items-start sm:items-center justify-between bg-amber-50 border border-amber-300 rounded-lg px-3 py-2.5 gap-2">
          <div className="flex items-center gap-2 text-amber-800 text-xs sm:text-sm font-semibold">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editando lançamento — altere os campos e clique em Salvar alteração
          </div>
          <button
            onClick={onCancelarEdicao}
            className="text-amber-600 hover:text-amber-800 text-xs font-semibold underline shrink-0"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* ── Título ─────────────────────────────────────────────────── */}
      <div className="border-b border-slate-100 pb-3">
        <h1 className="text-[#1F2022] font-bold text-xl sm:text-2xl md:text-3xl">
          Atualização Monetária
        </h1>
      </div>

      {/* ── Linha 1: Tipo de cálculo | Índice de correção | Descrição ─ */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-5 w-full">
        <div className="w-full sm:flex-[10] md:flex-[13] min-w-0">
          <TipoCalculo
            value={form.tipoCalculo}
            onChange={(v) => onFormChange("tipoCalculo", v)}
          />
        </div>
        <div className="w-full sm:flex-[7] md:flex-[8] min-w-0">
          <IndiceCorrecao
            value={form.indiceCorrecao}
            onChange={(v) => onFormChange("indiceCorrecao", v)}
          />
        </div>
        <div className="w-full sm:flex-[8] md:flex-[10] min-w-0">
          <Descricao
            value={form.descricao}
            onChange={(v) => onFormChange("descricao", v)}
          />
        </div>
      </div>

      {/* ── Linha 2: Valor + checkbox | Datas | (Multa info) ────────── */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-5 items-start w-full">

        {/* Valor + checkbox "Aplicar juros?" */}
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <InputValor
            value={form.valor}
            onChange={(v) => onFormChange("valor", v)}
          />
          {!selicSelecionada && (
            <label
              htmlFor="aplicar-juros"
              className={`flex items-center gap-2 select-none group w-fit mt-1 ${
                isFormValid ? "cursor-pointer" : "cursor-not-allowed opacity-50"
              }`}
              title={!isFormValid ? "Preencha o Valor e as Datas primeiro" : ""}
            >
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  id="aplicar-juros"
                  checked={juros.enabled}
                  onChange={(e) => onJurosChange("enabled", e.target.checked)}
                  disabled={!isFormValid}
                  className="peer sr-only"
                />
                <div
                  className={`w-[18px] h-[18px] rounded-[4px] border-2 flex items-center justify-center transition-all duration-200 ${
                    juros.enabled
                      ? "bg-blue-600 border-blue-600"
                      : "bg-white border-gray-400 group-hover:border-blue-400"
                  }`}
                >
                  {juros.enabled && (
                    <svg className="w-[11px] h-[11px] text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </div>
              </div>
              <span className={`text-[13px] font-medium transition-colors duration-150 ${
                isFormValid ? "text-gray-600 group-hover:text-gray-800" : "text-gray-500"
              }`}>
                Aplicar juros?
              </span>
            </label>
          )}
        </div>

        {/* Data inicial */}
        <div className="w-full sm:w-auto">
          <Data
            title="Data inicial"
            value={form.dataInicial}
            onChange={(v) => onFormChange("dataInicial", v)}
            max={today}
          />
        </div>

        {/* Data do cálculo */}
        <div className="w-full sm:w-auto">
          <Data
            title="Data do cálculo"
            value={form.dataCalculo}
            onChange={(v) => onFormChange("dataCalculo", v)}
            max={today}
            min={form.dataInicial || undefined}
          />
        </div>

        {/* Cards informativos de multa diária */}
        {form.tipoCalculo === "multadiaria" && (
          <div className="w-full sm:w-auto flex flex-row flex-wrap gap-3 items-center sm:pt-6">
            <div className="text-sm font-medium text-gray-700 border border-[#E3D21A] bg-[#FFFADF] p-2 h-[60px] w-[148px] rounded-md">
              Total de dias: <br />{totalDias}
            </div>
            <div className="text-sm font-medium text-gray-700 border border-[#E3D21A] bg-[#FFFADF] p-2 h-[60px] w-[148px] rounded-md">
              Multa total: <br /> R$ {multaTotal.toFixed(2).replace(".", ",")}
            </div>
          </div>
        )}
      </div>

      {/* ── Painel de juros ─────────────────────────────────────────── */}
      {juros.enabled && !selicSelecionada && (
        <div className="border border-gray-300 rounded-lg p-3 sm:p-4">
          <Juros
            juros={juros}
            selicSelecionada={selicSelecionada}
            onJurosChange={onJurosChange}
            today={today}
            dataInicialForm={form.dataInicial}
            dataCalculoForm={form.dataCalculo}
          />
        </div>
      )}

      {/* ── Mensagem de erro ────────────────────────────────────────── */}
      {erro && (
        <div className="text-red-600 text-sm font-semibold bg-red-50 border border-red-200 rounded-md px-4 py-2">
          ⚠ {erro}
        </div>
      )}

      {/* ── Botões Calcular / Limpar ────────────────────────────────── */}
      <div className="flex flex-col gap-2 w-full">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-3 w-full">
          <Calcular
            onClick={onCalcular}
            loading={loading}
            disabled={
              !isFormValid ||
              (juros.enabled && !selicSelecionada && juros.aplicados.length === 0)
            }
            editMode={editandoId !== null}
          />
          <Limpar onClick={onLimpar} />
        </div>
        {juros.enabled && !selicSelecionada && juros.aplicados.length === 0 && (
          <div className="text-amber-600 text-xs sm:text-sm font-medium mt-1 bg-amber-50 border border-amber-200 p-2 rounded-md">
            ⚠️ Você marcou para aplicar juros. Clique em "Aplicar" logo acima antes de calcular.
          </div>
        )}
      </div>
    </div>
  );
}

export default CentralCard;
