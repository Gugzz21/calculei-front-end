import { useState, useRef } from "react";

function InputValor() {
    const [rawValue, setRawValue] = useState("");
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
        // Permite: Backspace, Delete, Tab, setas
        const allowedKeys = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight"];
        if (allowedKeys.includes(e.key)) {
            if (e.key === "Backspace" || e.key === "Delete") {
                e.preventDefault();
                setRawValue((prev) => prev.slice(0, -1));
            }
            return;
        }
        // Bloqueia qualquer coisa que não seja dígito
        if (!/^\d$/.test(e.key)) {
            e.preventDefault();
            return;
        }
        // Adiciona o dígito
        e.preventDefault();
        setRawValue((prev) => prev + e.key);
    };

    const handleClear = () => {
        setRawValue("");
        inputRef.current?.focus();
    };

    return (
        <div className="flex flex-col gap-1">
            <strong className="text-[13px] text-gray-700 font-semibold">Valor</strong>
            <div className="bg-white border border-blue-400 h-[45px] flex items-center px-3 gap-2 rounded-md w-[340px]">
                <input
                    ref={inputRef}
                    type="text"
                    id="valor"
                    value={formatCurrency(rawValue)}
                    onKeyDown={handleKeyDown}
                    onChange={() => { }} 
                    placeholder="R$ 0,00"
                    className="flex-1 outline-none bg-transparent text-sm text-gray-700"
                />
                {rawValue && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="text-gray-400 hover:text-red-500 transition-colors text-xs"
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