import { X, Info } from "lucide-react";

interface SobreModalProps {
  onClose: () => void;
}

export default function SobreModal({ onClose }: SobreModalProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#0d1117] rounded-2xl shadow-2xl w-full max-w-[500px] border border-gray-200 dark:border-[#30363d] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-[#21262d]">
          <div className="flex items-center gap-2">
            <Info size={20} className="text-blue-600 dark:text-[#007aff]" />
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Sobre o Sistema</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          <div className="flex flex-col items-center justify-center mb-6">
            <h3 className="text-2xl font-bold text-blue-900 dark:text-[#007aff] mb-1">Calculei</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
              Versão 2.0.0
            </span>
          </div>

          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300 text-center">
            <p>
              O Calculei é uma ferramenta desenvolvida para facilitar e padronizar
              a atualização monetária e o cálculo de juros de lançamentos.
            </p>
            <p>
              Desenvolvido pela equipe do Ministério Público do Estado do Rio de Janeiro (MPRJ)
              e Grupo de Apoio Técnico Especializado (GATE/MPRJ).
            </p>
          </div>
        </div>

        {/* Rodapé */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-[#161b22] border-t border-gray-100 dark:border-[#21262d] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}
