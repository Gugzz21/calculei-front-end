import { useIndices } from "../../hooks/useIndices";

interface IndiceCorrecaoProps {
  value: string;
  onChange: (value: string) => void;
}

function IndiceCorrecao({ value, onChange }: IndiceCorrecaoProps) {
  const { indiceCorrecaoOpcoes } = useIndices();
  return (
    <div className="flex flex-col gap-1">
      <strong className="text-[14px] text-gray-700 dark:text-gray-300 font-semibold">Índice de correção monetária</strong>
      <select
        className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 h-[45px] w-full px-3 rounded-lg text-sm text-gray-700 dark:text-gray-200 outline-none cursor-pointer transition-all duration-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 hover:border-slate-400 dark:hover:border-slate-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {indiceCorrecaoOpcoes.map(({ value: v, label }) => (
          <option key={v} value={v}>{label}</option>
        ))}
      </select>
    </div>
  );
}

export default IndiceCorrecao;