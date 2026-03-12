import { useState } from "react";
import Data from "./CentralCard/Data";

function Juros() {
    const [isEnabled, setIsEnabled] = useState(false);

    return (
        <div className="flex flex-col bg-slate-50 rounded-lg p-6 gap-5 border border-slate-200 shadow-sm w-full max-w-[800px] ml-95 mt-6">

            {/* Linha sempre visível: label "Juros" + switch */}
            <div className="flex items-center gap-3">
                <strong className="text-[13px] text-gray-700 font-semibold">Juros</strong>

                {/* Switch visual */}
                <button
                    type="button"
                    onClick={() => setIsEnabled(!isEnabled)}
                    className={`relative w-[42px] h-[24px] rounded-full transition-colors duration-300 focus:outline-none ${isEnabled ? "bg-blue-500" : "bg-gray-300"
                        }`}
                    aria-label="Ativar juros"
                >
                    <span
                        className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] bg-white rounded-full shadow transition-transform duration-300 ${isEnabled ? "translate-x-[18px]" : "translate-x-0"
                            }`}
                    />
                </button>
            </div>

            {/* Conteúdo que só aparece quando o switch está ligado */}
            {isEnabled && (
                <>
                    {/* Linha 1: Índice de juros + texto informativo */}
                    <div className="flex flex-row gap-6 items-start">
                        <div className="flex flex-col gap-1">
                            <strong className="text-[13px] text-gray-700 font-semibold">Índice de juros</strong>
                            <select className="bg-white border border-blue-400 h-[45px] w-[220px] px-3 rounded-md text-sm text-gray-700 outline-none cursor-pointer">
                                <option value="codigocivil">Juros do Código Civil - Lei nº 10406/02 (6% a.a até 10/01/2003; 12% a.a. a partir de 10/01/2003 a.a)</option>
                                <option value="jurossimples6">Juros Simples 6% a.a.</option>
                                <option value="jurossimples12">Juros Simples 12% a.a.</option>
                                <option value="selic">SELIC</option>
                                <option value="cdi">CDI</option>
                                <option value="poupanca">Poupança (Antiga + Nova)</option>
                            </select>
                        </div>

                        <p className="text-[12px] text-gray-500 mt-6 leading-relaxed">
                            Percentual de juros até 10/01/2003:<br />
                            6% ao ano ou 0,5% ao mês.<br />
                            Percentual de juros a partir de 11/01/2003:<br />
                            12% ao ano ou 1% ao mês.
                        </p>
                    </div>

                    {/* Linha 2: Datas + botão Aplicar */}
                    <div className="flex flex-row gap-6 items-end">
                        <Data title="Data de início dos juros" />
                        <Data title="Aplicar juros até" />

                        <button
                            type="button"
                            className="h-[45px] px-6 border border-blue-500 text-blue-600 text-sm font-semibold rounded-md hover:bg-blue-50 transition-colors"
                        >
                            APLICAR
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default Juros;