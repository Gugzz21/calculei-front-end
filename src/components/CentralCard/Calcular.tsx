import { Calculator, Save } from 'lucide-react';

interface CalcularProps {
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
  editMode?: boolean;
}

function Calcular({ onClick, loading, disabled, editMode = false }: CalcularProps) {
  const isDisabled = loading || disabled;

  const label = loading
    ? (editMode ? 'Salvando...' : 'Calculando...')
    : (editMode ? 'Salvar alteração' : 'Calcular');

  return (
    <div className="w-full sm:w-auto">
      <button
        onClick={onClick}
        disabled={isDisabled}
        title={disabled && !loading ? "Preencha todos os campos obrigatórios (valor, data inicial, data do cálculo)" : undefined}
        className={`flex justify-center items-center px-4 gap-3 w-full sm:w-[288px] h-[40px] rounded-md font-semibold text-sm transition-colors
          ${isDisabled
            ? "bg-[#f1f3f5] dark:bg-[#0d1117] text-[#adb5bd] dark:text-slate-400 cursor-not-allowed"
            : editMode
              ? "bg-amber-500 text-white hover:bg-amber-600 cursor-pointer"
              : "bg-[#073365] dark:bg-[#007aff] text-white hover:bg-[#062953] dark:hover:bg-[#0066d6] cursor-pointer"
          }`}
      >
        {editMode ? <Save className="w-5 h-5" /> : <Calculator className="w-5 h-5" />}
        <span>{label}</span>
      </button>
    </div>
  );
}

export default Calcular;