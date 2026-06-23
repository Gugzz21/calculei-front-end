import { useState, useMemo, useCallback } from "react";
import TipoCalculo from "./TipoCalculo";
import Data from "./Data";
import IndiceCorrecao from "./IndiceCorrecao";
import InputValor from "./InputValor";
import Descricao from "./Descricao";
import Juros from "./Juros";
import Calcular from "./Calcular";
import Limpar from "./Limpar";
import InfoModal from "./InfoModal";
import { useCalculadoraContext } from "../../contexts/CalculadoraContext";

function CentralCard() {
  const [helpContext, setHelpContext] = useState<'tipoCalculo' | 'indiceCorrecao' | 'jurosIndice' | null>(null);

  const {
    form,
    juros,
    today,
    loading,
    erro,
    isFormValid,
    editandoId,
    handleFormChange,
    handleJurosChange,
    handleCalcular,
    handleLimpar,
    handleCancelarEdicao
  } = useCalculadoraContext();

  const jurosEmbutidos = form.indiceCorrecao === "selic";

  // Cálculos de data/multa: memoizados para evitar re-execução a cada render.
  // Só recalcula quando as datas ou o valor mudam.
  const { totalDias, multaTotal } = useMemo(() => {
    let dias = 0;
    if (form.dataInicial && form.dataCalculo) {
      const dInicial = new Date(form.dataInicial + "T00:00:00").getTime();
      const dCalculo = new Date(form.dataCalculo + "T00:00:00").getTime();
      dias = (dCalculo - dInicial) > 0 ? Math.floor((dCalculo - dInicial) / 86400000) : 0;
    }
    const valorNumerico = form.valor ? parseInt(form.valor, 10) / 100 : 0;
    return { totalDias: dias, multaTotal: valorNumerico * 0.01 * dias };
  }, [form.dataInicial, form.dataCalculo, form.valor]);

  // Callbacks memoizados para evitar recriação de funções a cada render.
  // Sem useCallback, cada render cria novas referências, forçando re-render dos filhos.
  const handleTipoCalculo    = useCallback((v: string) => handleFormChange("tipoCalculo", v), [handleFormChange]);
  const handleIndiceCorrecao = useCallback((v: string) => handleFormChange("indiceCorrecao", v), [handleFormChange]);
  const handleDescricao      = useCallback((v: string) => handleFormChange("descricao", v), [handleFormChange]);
  const handleComplementar   = useCallback((v: string) => handleFormChange("descricaoComplementar", v), [handleFormChange]);
  const handleValor          = useCallback((v: string) => handleFormChange("valor", v), [handleFormChange]);
  const handleDataInicial    = useCallback((v: string) => handleFormChange("dataInicial", v), [handleFormChange]);
  const handleDataCalculo    = useCallback((v: string) => handleFormChange("dataCalculo", v), [handleFormChange]);
  const handleOpenTipoCalculo    = useCallback(() => setHelpContext('tipoCalculo'), []);
  const handleOpenIndiceCorrecao = useCallback(() => setHelpContext('indiceCorrecao'), []);
  const handleOpenJurosIndice    = useCallback(() => setHelpContext('jurosIndice'), []);
  const handleCloseHelp          = useCallback(() => setHelpContext(null), []);
  const handleJurosEnabled   = useCallback((e: React.ChangeEvent<HTMLInputElement>) =>
    handleJurosChange("enabled", e.target.checked), [handleJurosChange]);

  return (
    <div id="tour-inclusao" className="flex flex-col bg-white/95 dark:bg-[#0d1117]/95 backdrop-blur-sm rounded-2xl pb-6 p-4 sm:p-6 md:p-8 gap-5 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-300/60 dark:border-[#21262d]/60 transition-colors duration-200">

      {/* ── Banner modo edição ─────────────────────────────────────── */}
      {editandoId !== null && (
        <div className="flex items-start sm:items-center justify-between bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700/50 rounded-lg px-3 py-2.5 gap-2">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 text-sm sm:text-sm font-semibold">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editando lançamento — altere os campos e clique em Salvar alteração
          </div>
          <button
            onClick={handleCancelarEdicao}
            className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 text-sm font-semibold underline shrink-0"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* ── Título ─────────────────────────────────────────────────── */}
      <div className="border-b border-slate-100 dark:border-[#21262d]/50 pb-3">
        <h1 className="text-slate-800 dark:text-slate-100 font-extrabold tracking-tight text-xl sm:text-2xl md:text-3xl">
          Atualização Monetária
        </h1>
      </div>

      {/* ── Linha 1: Tipo de cálculo | Índice de correção | Descrição ─ */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-5 w-full">
        <div id="tour-tipo-calculo" className="w-full sm:flex-[10] md:flex-[13] min-w-0">
          <TipoCalculo
            value={form.tipoCalculo}
            onChange={handleTipoCalculo}
            onOpenHelp={handleOpenTipoCalculo}
          />
        </div>
        <div id="tour-indice-juros" className="w-full sm:flex-[7] md:flex-[8] min-w-0">
          <IndiceCorrecao
            value={form.indiceCorrecao}
            onChange={handleIndiceCorrecao}
            onOpenHelp={handleOpenIndiceCorrecao}
            tipoCalculo={form.tipoCalculo}
          />
        </div>
        <div className="w-full sm:flex-[8] md:flex-[10] min-w-0">
          <Descricao
            value={form.descricao}
            onChange={handleDescricao}
            complementar={form.descricaoComplementar}
            onComplementarChange={handleComplementar}
          />
        </div>
      </div>

      {/* ── Linha 2: Valor + checkbox | Datas | (Multa info) ────────── */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-5 items-start w-full">

        {/* Valor + checkbox "Aplicar juros?" */}
        <div id="tour-valor-principal" className="flex flex-col gap-2 w-full sm:w-auto">
          <InputValor
            value={form.valor}
            onChange={handleValor}
          />
          {!jurosEmbutidos && (
            <label
              htmlFor="aplicar-juros"
              className={`flex items-center gap-2 select-none group w-fit mt-1 ${isFormValid ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                }`}
              title={!isFormValid ? "Preencha o Valor e as Datas primeiro" : ""}
            >
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  id="aplicar-juros"
                  checked={juros.enabled}
                  onChange={handleJurosEnabled}
                  disabled={!isFormValid}
                  className="peer sr-only"
                />
                <div
                  className={`w-[18px] h-[18px] rounded-[4px] border-2 flex items-center justify-center transition-all duration-200 ${juros.enabled
                      ? "bg-[#007aff] border-[#007aff]"
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
              <span className={`text-sm font-medium transition-colors duration-150 ${isFormValid ? "text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-100" : "text-gray-500 dark:text-gray-600"
                }`}>
                Aplicar juros?
              </span>
            </label>
          )}
        </div>

        {/* Data inicial */}
        <div id="tour-datas" className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-auto">
          <Data
            title="Data inicial"
            value={form.dataInicial}
            onChange={handleDataInicial}
            max={today}
          />
        </div>

        {/* Data do cálculo */}
        <div className="w-full sm:w-auto">
          <Data
            title="Data do cálculo"
            value={form.dataCalculo}
            onChange={handleDataCalculo}
            max={today}
            min={form.dataInicial || undefined}
          />
        </div>
        </div>

        {/* Cards informativos de multa diária */}
        {form.tipoCalculo === "multadiaria" && (
          <div className="w-full sm:w-auto flex flex-row flex-wrap gap-3 items-center sm:pt-6">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-200 border border-[#E3D21A] dark:border-[#E3D21A]/50 bg-[#FFFADF] dark:bg-[#FFFADF]/10 p-2 h-[60px] w-[148px] rounded-md">
              Total de dias: <br />{totalDias}
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-200 border border-[#E3D21A] dark:border-[#E3D21A]/50 bg-[#FFFADF] dark:bg-[#FFFADF]/10 p-2 h-[60px] w-[148px] rounded-md">
              Multa total: <br /> R$ {multaTotal.toFixed(2).replace(".", ",")}
            </div>
          </div>
        )}
      </div>

      {/* ── Painel de juros ─────────────────────────────────────────── */}
        {juros.enabled && !jurosEmbutidos && (
        <div className="border border-gray-300 dark:border-[#21262d] rounded-lg p-3 sm:p-4 bg-slate-100/30 dark:bg-[#010409]/30">
          <Juros onOpenHelp={handleOpenJurosIndice} />
        </div>
      )}

      {/* ── Mensagem de erro ────────────────────────────────────────── */}
      {erro && (
        <div className="text-red-600 text-sm font-semibold bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-md px-4 py-2">
          ⚠️ {erro}
        </div>
      )}

      {/* ── Botões Calcular / Limpar ────────────────────────────────── */}
      <div className="flex flex-col gap-2 w-full">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-3 w-full">
          <div id="tour-btn-calcular" className="w-full sm:w-auto">
            <Calcular
              onClick={handleCalcular}
              loading={loading}
              disabled={
                !isFormValid ||
                (juros.enabled && !jurosEmbutidos && juros.aplicados.length === 0)
              }
              editMode={editandoId !== null}
            />
          </div>
          <Limpar onClick={handleLimpar} />
        </div>
        {juros.enabled && !jurosEmbutidos && juros.aplicados.length === 0 && (
          <div className="text-amber-600 text-sm sm:text-sm font-medium mt-1 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 p-2 rounded-md">
            ⚠️ Você marcou para aplicar juros. Clique em "Aplicar" logo acima antes de calcular.
          </div>
        )}
      </div>

      {/* ── Modal de Ajuda Centralizado ── */}
      {helpContext && (
        <InfoModal
          isOpen={true}
          onClose={handleCloseHelp}
          context={helpContext}
          selectedValue={
            helpContext === 'tipoCalculo' ? form.tipoCalculo :
            helpContext === 'indiceCorrecao' ? form.indiceCorrecao :
            juros.indice
          }
        />
      )}
    </div>
  );
}

export default CentralCard;
