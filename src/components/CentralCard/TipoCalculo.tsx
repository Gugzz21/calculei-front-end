import { TIPO_CALCULO_OPCOES } from "../../constants/dominios";
import InfoButton from "./InfoButton";

interface TipoCalculoProps {
  value: string;
  onChange: (value: string) => void;
  onOpenHelp: () => void;
}

function TipoCalculo({ value, onChange, onOpenHelp }: TipoCalculoProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2 items-center"><strong className="text-[14px] text-gray-700 dark:text-gray-300 font-semibold">
        Tipo de Cálculo 
      </strong><InfoButton onClick={onOpenHelp} /></div>
      <select
        className="bg-white dark:bg-[#010409] border border-slate-400 dark:border-[#21262d] h-[45px] w-full px-3 rounded-lg text-sm text-gray-700 dark:text-gray-200 outline-none cursor-pointer transition-all duration-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 hover:border-slate-500 dark:hover:border-slate-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled>Selecione</option>
        {TIPO_CALCULO_OPCOES.map(({ value: v, label }) => (
          <option key={v} value={v}>{label}</option>
        ))}
      </select>
    </div>
  );
}

export default TipoCalculo;
