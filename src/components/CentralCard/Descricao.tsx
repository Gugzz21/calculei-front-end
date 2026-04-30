import { DESCRICAO_OPCOES } from "../../constants/dominios";

interface DescricaoProps {
  value: string;
  onChange: (value: string) => void;
}

function Descricao({ value, onChange }: DescricaoProps) {
  return (
    <div className="flex flex-col gap-1">
      <strong className="text-[14px] text-gray-700 font-semibold">Descrição</strong>
      <select
        className="bg-white border border-gray-300 h-[45px] w-full md:w-[400px] px-2.5 rounded-md text-sm text-gray-700 outline-none cursor-pointer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {DESCRICAO_OPCOES.map(({ value: v, label }) => (
          <option key={v} value={v}>{label}</option>
        ))}
      </select>
    </div>
  );
}

export default Descricao;