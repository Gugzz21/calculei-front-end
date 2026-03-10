import { useState } from "react"

function TipoCalculo() {
    const [selecionado, setSelecionado] = useState("tributario")

    return (
        <div className="flex flex-col">
            <strong className="text-[14px]">Tipo de Cálculo</strong>
            <select
                className="bg-white border-black border-[1px]  h-[60px] flex justify-center items-center rounded-[5  px]"
                value={selecionado}
                onChange={(e) => setSelecionado(e.target.value)}
            >
                <option value="cdparticular">Créditos / Débitos Entre Particulares</option> 

                <option value="cfazenda">Créditos da Fazenda Pública</option> 

                <option value="dfazendatributario">Débitos da Fazenda Pública - Tributários</option>

                <option value="dfazendanaotributario">Débitos da Fazenda Pública - Não Tributários</option>

                <option value="previdenciario">Débitos Previdenciários</option>

                <option value="precatoriostributario">Precatórios - Tributários</option>

                <option value="precatoriosnaotributario">Precatórios - Não Tributários</option>

                <option value="multadiaria">Multa diária</option>

            </select>
        </div>
    )
}
export default TipoCalculo;
