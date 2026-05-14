import { useRef } from "react";

interface InputValorProps {
  value: string; // raw digits string
  onChange: (value: string) => void;
}

function InputValor({ value, onChange }: InputValorProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const formatCurrency = (digits: string): string => {
    if (!digits) return "";
    const number = parseInt(digits, 10);
    return (number / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight"];
    if (allowedKeys.includes(e.key)) {
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        onChange(value.slice(0, -1));
      }
      return;
    }
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    onChange(value + e.key);
  };

  const handleClear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col gap-1 w-full md:w-auto">
      <strong className="text-[14px] text-gray-700 font-semibold">Valor</strong>
      <div className="bg-white border border-slate-300 h-[45px] flex items-center px-3 gap-2 rounded-lg w-full md:w-[220px] transition-all duration-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 hover:border-slate-400">
        <input
          ref={inputRef}
          type="text"
          id="valor"
          value={formatCurrency(value)}
          onKeyDown={handleKeyDown}
          onChange={() => { }}
          placeholder="R$ 0,00"
          className="flex-1 min-w-0 outline-none bg-transparent text-sm text-gray-700"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-red-500 transition-colors text-xs shrink-0"
            aria-label="Limpar valor"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

export default InputValor;