import { INDICE_CORRECAO_OPCOES } from "../../constants/dominios";

interface IndiceCorrecaoProps {
  value: string;
  onChange: (value: string) => void;
}

function IndiceCorrecao({ value, onChange }: IndiceCorrecaoProps) {
  return (
    <div className="flex flex-col gap-1">
      <strong className="text-[14px] text-gray-700 font-semibold">Índice de correção monetária</strong>
      <select
        className="bg-white border border-gray-300 h-[45px] w-full md:w-[330px] px-3 rounded-md text-sm text-gray-700 outline-none cursor-pointer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {INDICE_CORRECAO_OPCOES.map(({ value: v, label }) => (
          <option key={v} value={v}>{label}</option>
        ))}
      </select>
    </div>
  );
}

export default IndiceCorrecao;