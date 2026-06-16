import { useState } from "react";
import {
  ClipboardList,
  PercentSquare,
  Calculator,
  TableProperties,
  FileDown,
  Link2,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useCalculadoraContext } from "../contexts/CalculadoraContext";

interface OnboardingModalProps {
  onClose: () => void;
}

// ── Tipos ──────────────────────────────────────────────────────────────────────

interface ExemploPreenchido {
  label: string;
  descricao: string;
  descricaoComplementar: string;
  tipoCalculo: string;
  indiceCorrecao: string;
  valor: string;          // raw digits (centavos sem separador) para a máscara
  dataInicial: string;    // YYYY-MM-DD
  dataCalculo: string;
  comJuros: boolean;      // se deve ativar o painel de juros
  jurosIndice?: string;
  jurosTaxa?: string;
  jurosDataInicio?: string;
  jurosDataFim?: string;
}

/*
 * Exemplos pré-definidos.
 * Por que valores fixos em vez de dinâmicos?
 *   O tutorial serve para ensinar o fluxo, não para produzir um cálculo real.
 *   Valores fixos garantem que o exemplo seja sempre consistente e demonstrativo.
 *   A data de cálculo é "hoje" para garantir que a validação de "data futura"
 *   não impeça o usuário de calcular durante o tutorial.
 */
const HOJE = new Date().toISOString().split("T")[0];

const EXEMPLOS: ExemploPreenchido[] = [
  {
    label: "Ressarcimento simples (sem juros)",
    descricao: "ressarcimento",
    descricaoComplementar: "Exemplo tutorial",
    tipoCalculo: "cdparticular",
    indiceCorrecao: "ipca",
    valor: "1000000",        // R$ 10.000,00 em centavos (raw digits)
    dataInicial: "2020-01-01",
    dataCalculo: HOJE,
    comJuros: false,
  },
  {
    label: "Dano ao erário + juros legais",
    descricao: "danoaerario",
    descricaoComplementar: "Exemplo com juros",
    tipoCalculo: "cdparticular",
    indiceCorrecao: "ipca",
    valor: "500000",         // R$ 5.000,00
    dataInicial: "2021-06-01",
    dataCalculo: HOJE,
    comJuros: true,
    jurosIndice: "taxalegal",
    jurosTaxa: "12,00",
    jurosDataInicio: "2021-06-01",
    jurosDataFim: HOJE,
  },
  {
    label: "Precatório — TJ/RJ 11.960/2009",
    descricao: "precatorio",
    descricaoComplementar: "Exemplo Fazenda Pública",
    tipoCalculo: "precatorios",
    indiceCorrecao: "tjrj11960",
    valor: "2000000",        // R$ 20.000,00
    dataInicial: "2019-03-15",
    dataCalculo: HOJE,
    comJuros: false,
  },
];

// ── Passos do tutorial ─────────────────────────────────────────────────────────

const STEPS = [
  {
    icon: Sparkles,
    color: "text-violet-500 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-900/30",
    border: "border-violet-200 dark:border-violet-700/50",
    title: "Comece com um exemplo pronto",
    description:
      "Para facilitar o aprendizado, escolha um dos exemplos abaixo e clique em \"Preencher\". Os campos do formulário serão preenchidos automaticamente — basta clicar em Calcular para ver o resultado na tabela.",
    tips: [
      "O exemplo \"Dano ao erário + juros legais\" mostra como os juros são aplicados e como aparecem na tabela.",
      "Você pode modificar qualquer campo depois de preencher — o exemplo é apenas um ponto de partida.",
    ],
    hasExemplos: true,
  },
  {
    icon: ClipboardList,
    color: "text-indigo-500 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-900/30",
    border: "border-indigo-200 dark:border-indigo-700/50",
    title: "Bloco de entrada de dados",
    description:
      "Preencha o formulário com o Tipo de cálculo, o Índice de correção e a Descrição. Informe o Valor principal e as datas do período a corrigir.",
    tips: [
      "Selecione o Tipo de cálculo para que o índice correto seja pré-selecionado automaticamente.",
      "O campo de observações aceita texto livre — útil para nº do processo ou nome da contratada.",
    ],
    hasExemplos: false,
  },
  {
    icon: PercentSquare,
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/30",
    border: "border-blue-200 dark:border-blue-700/50",
    title: "Aplicar juros",
    description:
      "Após preencher todos os campos, marque 'Aplicar juros?' para abrir o painel de juros. Escolha o índice (ex.: Taxa Legal, Código Civil), defina o período e clique em Aplicar. O valor dos juros será calculado separadamente e exibido na coluna Juros da tabela.",
    tips: [
      "Para SELIC e TJ/RJ 11.960/2009, os juros já estão embutidos — o checkbox não aparecerá.",
      "Você pode adicionar múltiplos períodos de juros antes de calcular.",
    ],
    hasExemplos: false,
  },
  {
    icon: Calculator,
    color: "text-green-500 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-900/30",
    border: "border-green-200 dark:border-green-700/50",
    title: "Calcular e gerenciar lançamentos",
    description:
      "Clique em Calcular para gerar o resultado. O lançamento aparece na tabela com valor corrigido, juros e total devido. Clique na linha para expandir e ver os detalhes. Use os ícones de ação: ✏️ editar, 📋 duplicar e 🗑️ remover.",
    tips: [
      "Editar reabre o formulário com os dados do lançamento — altere e clique em Salvar alteração.",
      "O botão Limpar reseta apenas o formulário — os lançamentos calculados permanecem na tabela.",
    ],
    hasExemplos: false,
  },
  {
    icon: TableProperties,
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/30",
    border: "border-amber-200 dark:border-amber-700/50",
    title: "Tabela de lançamentos",
    description:
      "Cada linha exibe: Data inicial, Data final, Valor principal, Índice, Fator de correção, Valor corrigido, Juros e Total devido. Expanda a linha para ver a seção de Juros com período, dias, fator acumulado e valor.",
    tips: [
      "Quando há juros, o collapse mostra cada período de juros com seus detalhes.",
      "O rodapé exibe o total geral de todos os lançamentos.",
    ],
    hasExemplos: false,
  },
  {
    icon: FileDown,
    color: "text-rose-500 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-900/30",
    border: "border-rose-200 dark:border-rose-700/50",
    title: "Relatórios e exportação",
    description:
      "Exporte em PDF, Excel ou Imagem. Após gerar, um modal exibirá o link de recuperação e o texto padronizado de menção ao Calculei.",
    tips: [
      "O PDF e o Excel incluem todos os lançamentos com seus detalhes de juros.",
      "O texto de menção já está formatado conforme o padrão do GATE/MPRJ.",
    ],
    hasExemplos: false,
  },
  {
    icon: Link2,
    color: "text-teal-500 dark:text-teal-400",
    bg: "bg-teal-50 dark:bg-teal-900/30",
    border: "border-teal-200 dark:border-teal-700/50",
    title: "Link de recuperação",
    description:
      "Ao exportar, você receberá um link único para recuperar seu cálculo futuramente. Guarde-o para retornar à sessão exata com todos os lançamentos.",
    tips: [
      "O link fica disponível no modal após cada exportação.",
      "Copie e salve o link antes de fechar o modal.",
    ],
    hasExemplos: false,
  },
];

// ── Componente ─────────────────────────────────────────────────────────────────

export default function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [step, setStep]           = useState(0);
  const [exemploIdx, setExemploIdx] = useState(1); // padrão: "Dano ao erário + juros" para mostrar juros
  const [aplicado, setAplicado]   = useState(false);

  const { handleFormChange, handleJurosChange } = useCalculadoraContext();

  const current = STEPS[step];
  const Icon    = current.icon;
  const isLast  = step === STEPS.length - 1;

  /*
   * Preencher o formulário com o exemplo selecionado.
   *
   * Por que chamar handleFormChange em vez de setar o estado diretamente?
   *   handleFormChange é o handler do contexto que garante side-effects como
   *   a pré-seleção automática do índice ao mudar o tipoCalculo. Usar a API
   *   pública do contexto mantém a consistência do estado.
   *
   * Por que usar handleJurosChange para os juros?
   *   O painel de juros tem seu próprio estado em JurosState no contexto.
   *   handleJurosChange é o único caminho para ativar o painel e configurar
   *   o índice de juros sem violar o encapsulamento do contexto.
   *
   * Nota: `aplicados` (períodos de juros) não é preenchido aqui porque
   *   o usuário precisa clicar em "Aplicar" no painel — isso faz parte do
   *   fluxo que queremos ensinar.
   */
  function aplicarExemplo() {
    const ex = EXEMPLOS[exemploIdx];

    handleFormChange("tipoCalculo",            ex.tipoCalculo);
    handleFormChange("indiceCorrecao",         ex.indiceCorrecao);
    handleFormChange("descricao",              ex.descricao);
    handleFormChange("descricaoComplementar",  ex.descricaoComplementar);
    handleFormChange("valor",                  ex.valor);
    handleFormChange("dataInicial",            ex.dataInicial);
    handleFormChange("dataCalculo",            ex.dataCalculo);

    if (ex.comJuros) {
      handleJurosChange("enabled",    true);
      handleJurosChange("indice",     ex.jurosIndice  ?? "taxalegal");
      handleJurosChange("taxa",       ex.jurosTaxa    ?? "12,00");
      handleJurosChange("dataInicio", ex.jurosDataInicio ?? ex.dataInicial);
      handleJurosChange("dataFim",    ex.jurosDataFim    ?? ex.dataCalculo);
    } else {
      handleJurosChange("enabled", false);
    }

    setAplicado(true);
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#0d1117] rounded-2xl shadow-2xl w-full max-w-[580px] border border-gray-200 dark:border-[#30363d] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">

        {/* ── Cabeçalho ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100 dark:border-[#21262d]">
          <span className="text-xs font-bold text-gray-400 dark:text-gray-500 tracking-widest">
            Tutorial — Passo {step + 1} de {STEPS.length}
          </span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full p-1"
            title="Fechar tutorial"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Barra de progresso ── */}
        <div className="h-1 bg-gray-100 dark:bg-[#21262d]">
          <div
            className="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* ── Conteúdo ── */}
        <div className="p-6 flex flex-col gap-5">

          {/* Ícone + título + descrição */}
          <div className="flex items-start gap-4">
            <div className={`flex items-center justify-center w-12 h-12 rounded-xl shrink-0 ${current.bg} border ${current.border}`}>
              <Icon size={24} className={current.color} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-tight">
                {current.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed whitespace-pre-line">
                {current.description}
              </p>
            </div>
          </div>

          {/* ── Seletor de exemplos (somente no passo 0) ── */}
          {current.hasExemplos && (
            <div className="flex flex-col gap-3">
              {/* Opções de exemplo */}
              <div className="flex flex-col gap-2">
                {EXEMPLOS.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => { setExemploIdx(i); setAplicado(false); }}
                    className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      exemploIdx === i
                        ? "border-violet-400 dark:border-violet-500 bg-violet-50 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200"
                        : "border-gray-200 dark:border-[#30363d] bg-white dark:bg-[#161b22] text-gray-700 dark:text-gray-300 hover:border-violet-300 dark:hover:border-violet-600"
                    }`}
                  >
                    {/* Indicador de seleção */}
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                      exemploIdx === i
                        ? "border-violet-500 bg-violet-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}>
                      {exemploIdx === i && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="truncate">{ex.label}</span>
                      {ex.comJuros && (
                        <span className="text-[11px] font-normal text-blue-600 dark:text-blue-400">
                          ✦ Inclui juros — ótimo para ver como a seção de juros funciona
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Botão Preencher */}
              <button
                onClick={aplicarExemplo}
                className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                  aplicado
                    ? "bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300"
                    : "bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600 text-white shadow"
                }`}
              >
                {aplicado
                  ? <><CheckCircle2 size={16} /> Preenchido! Feche o tutorial e clique em Calcular</>
                  : <><Sparkles size={16} /> Preencher formulário com este exemplo</>
                }
              </button>
            </div>
          )}

          {/* ── Dicas (passos sem exemplos) ── */}
          {!current.hasExemplos && (
            <div className={`rounded-xl border p-4 ${current.bg} ${current.border} flex flex-col gap-2`}>
              {current.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 size={14} className={`${current.color} shrink-0 mt-0.5`} />
                  <span className="text-[13px] text-gray-700 dark:text-gray-300 leading-snug">{tip}</span>
                </div>
              ))}
            </div>
          )}

          {/* Indicadores de step (dots) */}
          <div className="flex items-center justify-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => { setStep(i); setAplicado(false); }}
                className={`rounded-full transition-all duration-200 ${
                  i === step
                    ? "w-5 h-2 bg-blue-500 dark:bg-blue-400"
                    : "w-2 h-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                }`}
                title={`Ir para passo ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* ── Navegação ── */}
        <div className="flex items-center justify-between px-6 pb-6 gap-3">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
            Anterior
          </button>

          {isLast ? (
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-xl text-sm font-bold shadow transition-all active:scale-95"
            >
              <CheckCircle2 size={16} />
              Concluir tutorial
            </button>
          ) : (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-xl text-sm font-bold shadow transition-all active:scale-95"
            >
              Próximo
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
