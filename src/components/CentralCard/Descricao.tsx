import { useState } from "react";
import { DESCRICAO_OPCOES } from "../../constants/dominios";

interface DescricaoProps {
  value: string;
  onChange: (value: string) => void;
  complementar: string;
  onComplementarChange: (value: string) => void;
}

<<<<<<< HEAD
function Descricao({ value, onChange, complementar, onComplementarChange }: DescricaoProps) {
=======
function Descricao({ value, onChange }: DescricaoProps) {
>>>>>>> feature/inicial
  const [forceOther, setForceOther] = useState(false);

  const isPredefined = (DESCRICAO_OPCOES.some(opt => opt.value === value) || value === "") && value !== "outros";
  const isOther = forceOther || (!isPredefined && value !== "");

  return (
    <div className="flex flex-col gap-1">
      <strong className="text-[14px] text-gray-700 dark:text-gray-300 font-semibold">Descrição</strong>

      {!isOther ? (
        <select
          className="bg-white dark:bg-[#010409] border border-slate-400 dark:border-[#21262d] h-[45px] w-full px-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-200 outline-none cursor-pointer transition-all duration-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 hover:border-slate-500 dark:hover:border-slate-500"
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
          <option value="" disabled>Selecione</option>
          {DESCRICAO_OPCOES.map(({ value: v, label }) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      ) : (
        <div className="flex items-center bg-white dark:bg-[#010409] border border-slate-400 dark:border-[#21262d] h-[45px] w-full px-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-200 transition-all duration-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 hover:border-slate-500 dark:hover:border-slate-500">
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
              onChange("");
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Campo complementar: nº processo, contratada, observações */}
    </div>
  );
}

export default Descricao;