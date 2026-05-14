import { TIPO_CALCULO_OPCOES } from "../../constants/dominios";

interface TipoCalculoProps {
  value: string;
  onChange: (value: string) => void;
}

function TipoCalculo({ value, onChange }: TipoCalculoProps) {
  return (
    <div className="flex flex-col gap-1">
      <strong className="text-[14px] text-gray-700 font-semibold">
        Tipo de Cálculo
      </strong>
      <select
        className="bg-white border border-slate-300 h-[45px] w-full px-3 rounded-lg text-sm text-gray-700 outline-none cursor-pointer transition-all duration-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 hover:border-slate-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {TIPO_CALCULO_OPCOES.map(({ value: v, label }) => (
          <option key={v} value={v}>{label}</option>
        ))}
      </select>
    </div>
  );
}

export default TipoCalculo;
