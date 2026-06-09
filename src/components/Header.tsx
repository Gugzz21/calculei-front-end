import { useState } from "react";
import { Calculator, HelpCircle, X, BookOpen, FileText, Info } from "lucide-react";
import DarkmodeButton from "./DarkmodeButton";
import OnboardingModal from "./OnboardingModal";
import SobreModal from "./SobreModal";
import IT1062 from "../assets/IT_1062_2020.pdf";

function Header() {
  const [showAjudaModal, setShowAjudaModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSobreModal, setShowSobreModal] = useState(false);

  return (
    <>
      <header className="flex bg-white dark:bg-[#0d1117] w-full h-[65px] items-center shadow-sm z-10 sticky top-0 transition-colors duration-200 border-b border-transparent dark:border-[#21262d]">
        <div className="flex justify-between items-center w-full max-w-[1400px] mx-auto px-4 md:px-8">

          {/* Logo */}
          <h1 className="text-blue-900 dark:text-[#007aff] text-xl sm:text-2xl md:text-3xl font-bold flex gap-2 items-center shrink-0">
            <Calculator className="text-blue-900 dark:text-[#007aff] w-6 h-6 md:w-[30px] md:h-[30px]" />
            Calculei
          </h1>

          {/* Ações do header */}
          <div className="flex items-center gap-3">
            <DarkmodeButton />
            <button
              id="btn-ajuda"
              onClick={() => setShowAjudaModal(true)}
              className="flex items-center gap-1.5 border border-slate-300 dark:border-[#21262d] rounded-full px-3 py-1.5 text-[13px] text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
            >
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Ajuda</span>
            </button>
          </div>

        </div>
      </header>

      {/* ── Modal de Ajuda ── */}
      {showAjudaModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#0d1117] rounded-2xl shadow-2xl w-full max-w-[400px] border border-gray-200 dark:border-[#30363d] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-[#21262d]">
              <div className="flex items-center gap-2">
                <HelpCircle size={20} className="text-blue-500" />
                <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">Central de Ajuda</h2>
              </div>
              <button
                onClick={() => setShowAjudaModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Opções */}
            <div className="p-6 flex flex-col gap-3">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                O que você gostaria de fazer?
              </p>

              {/* Botão Tutorial */}
              <button
                id="btn-tutorial"
                onClick={() => {
                  setShowAjudaModal(false);
                  setShowOnboarding(true);
                }}
                className="flex items-center gap-3 w-full px-4 py-3.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50 rounded-xl text-left hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors group"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-800/50 shrink-0">
                  <BookOpen size={18} className="text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 group-hover:text-blue-900 dark:group-hover:text-blue-100">
                    Tutorial interativo
                  </p>
                  <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-0.5">
                    Aprenda a usar o Calculei passo a passo
                  </p>
                </div>
              </button>

              {/* Botão Diretriz Técnica */}
              <a
                href={IT1062}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowAjudaModal(false)}
                className="flex items-center gap-3 w-full px-4 py-3.5 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700/50 rounded-xl text-left hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors group"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-100 dark:bg-green-800/50 shrink-0">
                  <FileText size={18} className="text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-800 dark:text-green-200 group-hover:text-green-900 dark:group-hover:text-green-100">
                    Diretriz Técnica
                  </p>
                  <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-0.5">
                    Acesse a documentação técnica (PDF)
                  </p>
                </div>
              </a>

              {/* Botão Sobre */}
              <button
                onClick={() => {
                  setShowAjudaModal(false);
                  setShowSobreModal(true);
                }}
                className="flex items-center gap-3 w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-700 shrink-0">
                  <Info size={18} className="text-slate-600 dark:text-slate-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-slate-100">
                    Sobre
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Informações sobre o sistema e versão
                  </p>
                </div>
              </button>

              {/* Fechar */}
              <button
                onClick={() => setShowAjudaModal(false)}
                className="w-full px-4 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors text-center mt-1"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de Onboarding ── */}
      {showOnboarding && (
        <OnboardingModal onClose={() => setShowOnboarding(false)} />
      )}

      {/* ── Modal Sobre ── */}
      {showSobreModal && (
        <SobreModal onClose={() => setShowSobreModal(false)} />
      )}
    </>
  );
}

export default Header;
