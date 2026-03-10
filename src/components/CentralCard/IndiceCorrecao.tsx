import { useState } from "react";

function IndiceCorrecao() {
    const [selecionado, setSelecionado] = useState("cdparticular")
    return (
        <div className="flex flex-col">
            <strong className="text-[14px]">Índice de correção monetária</strong>
            <select
                className="bg-white border-black border-[1px]  h-[60px] flex justify-center items-center rounded-[5  px]"
                value={selecionado}
                onChange={(e) => setSelecionado(e.target.value)}
            >
                <option value="ipcae">IPCA-E</option>

                <option value="igpm">IGP-M</option>

                <option value="tr">TR</option>

                <option value="inpc">INPC</option>

                <option value="igpdi">IGP-DI</option>

                <option value="ipca">IPCA</option>

                <option value="ipcbr">IPC-BR</option>

                <option value="cdi">CDI</option>

                <option value="selic">SELIC</option>

                <option value="semcorrecaomonetaria">SEM CORREÇÃO MONETÁRIA</option>

                <option value="tjrj119602009ortnotnbnttrufiripcae">TJRJ 11.960/2009 (ORTN-OTN-BNT TR-UFIR-IPCA-E)</option>

                <option value="tjrj119602009ipcaeselic">TJRJ 11.960/2009 IPCA/SELIC</option>

                <option value="semcorrecaomonetaria">SEM CORREÇÃO MONETÁRIA</option>

            </select>
        </div>
    )
}

export default IndiceCorrecao;