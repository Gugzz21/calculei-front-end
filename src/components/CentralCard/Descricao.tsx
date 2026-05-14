import { useState } from "react";
import { DESCRICAO_OPCOES } from "../../constants/dominios";

interface DescricaoProps {
  value: string;
  onChange: (value: string) => void;
}

function Descricao({ value, onChange }: DescricaoProps) {
  const [forceOther, setForceOther] = useState(false);

  // Consider it "custom" if it's not in the predefined list, or if it is exactly "outros", or if user forced it
  const isPredefined = DESCRICAO_OPCOES.some(opt => opt.value === value) && value !== "outros";
  const isOther = forceOther || !isPredefined;

  return (
    <div className="flex flex-col gap-1">
      <strong className="text-[14px] text-gray-700 font-semibold">Descrição</strong>

      {!isOther ? (
        <select
          className="bg-white border border-slate-300 h-[45px] w-full px-2.5 rounded-lg text-sm text-gray-700 outline-none cursor-pointer transition-all duration-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 hover:border-slate-400"
          value={value}
          onChange={(e) => {
            if (e.target.value === "outros") {
              setForceOther(true);
              onChange("");
            } else {
              onChange(e.target.value);
            }
          }}
        >
          {DESCRICAO_OPCOES.map(({ value: v, label }) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      ) : (
        <div className="flex items-center bg-white border border-slate-300 h-[45px] w-full px-2.5 rounded-lg text-sm text-gray-700 transition-all duration-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 hover:border-slate-400">
          <input
            type="text"
            className="flex-1 outline-none bg-transparent"
            placeholder="Digite a descrição..."
            value={value === "outros" ? "" : value}
            onChange={(e) => onChange(e.target.value)}
            autoFocus
          />
          <button
            type="button"
            className="text-gray-400 hover:text-red-500 ml-2 font-bold"
            title="Voltar à lista de opções"
            onClick={() => {
              setForceOther(false);
              onChange(DESCRICAO_OPCOES[0].value);
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default Descricao;