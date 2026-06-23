import { useState } from "react";

interface ModalTokenProps {
  token: string;
  onClose: () => void;
}

function ModalToken({ token, onClose }: ModalTokenProps) {
  const [copiado, setCopiado] = useState(false);

  const copiar = () => {
    navigator.clipboard.writeText(token).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#010409] rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 flex flex-col gap-5 border border-gray-200 dark:border-[#21262d]">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-[20px] font-bold text-gray-900 dark:text-slate-100">Imagem gerada com sucesso!</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Guarde o link abaixo para recuperar seus lançamentos futuramente.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl font-bold leading-none ml-4 mt-1"
            title="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Seu Link de Recuperação
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-gray-100 dark:bg-[#0d1117] border border-gray-300 dark:border-[#21262d] rounded-lg px-3 py-3 text-sm text-gray-800 dark:text-gray-200 font-mono break-all line-clamp-2">
              {token}
            </code>
            <button
              onClick={copiar}
              className={`shrink-0 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${copiado
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-800"
                : "bg-blue-50 dark:bg-[#007aff]/20 text-blue-700 dark:text-[#007aff] border border-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                }`}
            >
              {copiado ? "✓ Copiado" : "Copiar"}
            </button>
          </div>
          <p className="text-sm text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg px-3 py-2 mt-1">
            ⚠️ Salve este link em local seguro. Basta colá-lo no navegador para recuperar os dados.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ModalToken;
