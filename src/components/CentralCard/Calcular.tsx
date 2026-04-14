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
        className={`flex justify-center items-center px-4 gap-3 w-full md:w-[288px] h-[40px] rounded-md font-semibold text-sm transition-colors
          ${isDisabled
            ? "bg-[#073365] text-white cursor-not-allowed"
            : "bg-[#073365] text-white hover:bg-gray-700 cursor-pointer"
          }`}
      >
        <Calculator className="w-5 h-5" />
        <span>{loading ? "Calculando..." : "Calcular"}</span>
      </button>
    </div>
  );
}

export default Calcular;