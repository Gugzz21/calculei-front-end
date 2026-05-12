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
        className="bg-white border border-gray-300 h-[45px] w-full px-3 rounded-md text-sm text-gray-700 outline-none cursor-pointer"
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
