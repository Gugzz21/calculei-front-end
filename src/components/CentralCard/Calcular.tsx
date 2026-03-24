import { Calculator } from 'lucide-react';

interface CalcularProps {
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
}

function Calcular({ onClick, loading, disabled }: CalcularProps) {
  const isDisabled = loading || disabled;
  return (
    <div className="w-full md:w-auto">
      <button
        onClick={onClick}
        disabled={isDisabled}
        title={disabled && !loading ? "Preencha todos os campos obrigatórios (valor, data inicial, data do cálculo)" : undefined}
        className={`flex justify-center items-center px-4 gap-3 w-full md:w-[200px] h-[50px] mt-2 md:mt-6 rounded border-2 font-semibold text-sm transition-colors
          ${isDisabled
            ? "bg-blue-100 border-blue-300 text-blue-400 cursor-not-allowed"
            : "bg-blue-300 border-blue-800 text-blue-900 hover:bg-blue-400 cursor-pointer"
          }`}
      >
        <Calculator className="w-6 h-6" />
        <span className="underline decoration-2 underline-offset-4">{loading ? "Calculando..." : "Calcular"}</span>
      </button>
    </div>
  );
}

export default Calcular;