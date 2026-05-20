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
} from "lucide-react";

interface OnboardingModalProps {
  onClose: () => void;
}

const STEPS = [
  {
    icon: ClipboardList,
    color: "text-indigo-500 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-900/30",
    border: "border-indigo-200 dark:border-indigo-700/50",
    title: "Bloco de entrada de dados",
    description:
      "Preencha o formulário com o Tipo de cálculo, o Índice de correção e a Descrição (você pode adicionar dados complementares como nº de processo ou contratada no campo abaixo). Em seguida, informe o Valor principal e as datas inicial e final do período a ser corrigido.",
    tips: [
      "Selecione o Tipo de cálculo para que o índice correto seja pré-selecionado automaticamente.",
      "O campo de observações aceita texto livre — útil para nº do processo ou nome da contratada.",
    ],
  },
  {
    icon: PercentSquare,
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/30",
    border: "border-blue-200 dark:border-blue-700/50",
    title: "Aplicar juros",
    description:
      "Você poderá aplicar juros após todos os campos estiverem preenchidos.\n\nSe desejar calcular juros além da correção monetária, marque a caixa \"Aplicar juros?\". O painel de juros abrirá: escolha o índice de juros (ex.: Taxa Legal, Código Civil, SELIC), defina o período e clique no botão azul Aplicar.",
    tips: [
      "Para índices como SELIC ou TJ/RJ 11.960/2009, os juros já estão embutidos — a opção de juros não aparecerá.",
      "Você pode adicionar múltiplos períodos de juros antes de calcular.",
    ],
  },
  {
    icon: Calculator,
    color: "text-green-500 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-900/30",
    border: "border-green-200 dark:border-green-700/50",
    title: "Calcular e adicionar lançamentos",
    description:
      "Clique em Calcular para gerar o resultado. O valor corrigido, os juros e o total devido serão exibidos na tabela abaixo. Você pode adicionar quantos lançamentos precisar, cada um com períodos e índices diferentes.",
    tips: [
      "Use Salvar alteração para editar um lançamento existente.",
      "O botão Limpar reseta apenas o formulário — os lançamentos já calculados continuam na tabela.",
    ],
  },
  {
    icon: TableProperties,
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/30",
    border: "border-amber-200 dark:border-amber-700/50",
    title: "Tabela de lançamentos",
    description:
      "Cada linha da tabela mostra: Data inicial, Data final, Valor principal, Índice, Percentual %, Valor corrigido, Juros e Total devido. Clique em qualquer linha para expandir e ver detalhes como a descrição completa, o período exato de juros, o acumulado e os dias calculados.",
    tips: [
      "Use os ícones de ação (lápis, cópia, lixeira) para editar, duplicar ou remover lançamentos.",
      "O rodapé da tabela exibe o total geral de todos os lançamentos.",
    ],
  },
  {
    icon: FileDown,
    color: "text-rose-500 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-900/30",
    border: "border-rose-200 dark:border-rose-700/50",
    title: "Relatórios e exportação",
    description:
      "Exporte os resultados em PDF, Excel ou Imagem clicando nos botões de exportação. Após gerar, um modal exibirá o link de recuperação do cálculo e o texto padronizado de menção ao Calculei — copie e utilize no documento ou peça judicial.",
    tips: [
      "O texto de menção já está formatado conforme o padrão do GATE/MPRJ.",
      "O PDF e o Excel incluem todos os lançamentos com seus detalhes.",
    ],
  },
  {
    icon: Link2,
    color: "text-teal-500 dark:text-teal-400",
    bg: "bg-teal-50 dark:bg-teal-900/30",
    border: "border-teal-200 dark:border-teal-700/50",
    title: "Link de recuperação",
    description:
      "Ao exportar, você receberá um link único para recuperar seu cálculo futuramente. Guarde esse link para retornar à sessão exata com todos os lançamentos calculados, sem precisar refazer o trabalho.",
    tips: [
      "O link fica disponível no modal que aparece após cada exportação.",
      "Copie e salve o link em um local seguro antes de fechar o modal.",
    ],
  },
];

export default function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#0d1117] rounded-2xl shadow-2xl w-full max-w-[560px] border border-gray-200 dark:border-[#30363d] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">

        {/* ── Cabeçalho ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100 dark:border-[#21262d]">
          <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
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

        {/* ── Progress bar ── */}
        <div className="h-1 bg-gray-100 dark:bg-[#21262d]">
          <div
            className="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* ── Conteúdo ── */}
        <div className="p-6 flex flex-col gap-5">
          {/* Ícone + título */}
          <div className="flex items-start gap-4">
            <div className={`flex items-center justify-center w-12 h-12 rounded-xl shrink-0 ${current.bg} border ${current.border}`}>
              <Icon size={24} className={current.color} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-tight">
                {current.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">
                {current.description}
              </p>
            </div>
          </div>

          {/* Dicas */}
          <div className={`rounded-xl border p-4 ${current.bg} ${current.border} flex flex-col gap-2`}>
            {current.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 size={14} className={`${current.color} shrink-0 mt-0.5`} />
                <span className="text-[13px] text-gray-700 dark:text-gray-300 leading-snug">{tip}</span>
              </div>
            ))}
          </div>

          {/* Indicadores de step (dots) */}
          <div className="flex items-center justify-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
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
