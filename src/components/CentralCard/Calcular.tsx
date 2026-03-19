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
        className={`w-full md:w-[200px] h-[50px] mt-2 md:mt-6 rounded border-[2px] font-semibold text-sm transition-colors
          ${isDisabled
            ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed"
            : "bg-blue-100 border-blue-400 text-blue-700 hover:bg-blue-200 cursor-pointer"
          }`}
      >
        {loading ? "Calculando..." : "Calcular"}
      </button>
    </div>
  );
}

export default Calcular;