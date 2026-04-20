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
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 flex flex-col gap-5 border border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-[20px] font-bold text-gray-900">Imagem gerada com sucesso!</h2>
            <p className="text-sm text-gray-500 mt-1">  
              Guarde o token abaixo para recuperar seus lançamentos futuramente.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none ml-4 mt-1"
            title="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Seu Token de Recuperação
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-gray-100 border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 font-mono break-all">
              {token}
            </code>
            <button
              onClick={copiar}
              className={`shrink-0 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${copiado
                ? "bg-green-100 text-green-700 border border-green-300"
                : "bg-blue-50 text-blue-700 border border-blue-300 hover:bg-blue-100"
                }`}
            >
              {copiado ? "✓ Copiado" : "Copiar"}
            </button>
          </div>
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-1">
            ⚠️ Salve este código em local seguro. Sem ele não será possível recuperar os dados.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-700 transition-colors"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}

export default ModalToken;
