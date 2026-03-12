import TipoCalculo from "./CentralCard/TipoCalculo";
import Data from "./CentralCard/Data";
import IndiceCorrecao from "./CentralCard/IndiceCorrecao";
import InputValor from "./CentralCard/InputValor";
import Descricao from "./CentralCard/Descricao";

function CentralCard() {
  return (
    <div className="flex flex-col bg-slate-50 rounded-lg pb-6 w-full max-w-[800px] h-auto ml-95 p-6 gap-5 shadow-sm border border-slate-200">

      {/* Linha 1: Tipo de Cálculo + Índice de Correção */}
      <div className="flex flex-row gap-6">
        <div className="flex-1">
          <TipoCalculo />
        </div>
        <div className="flex-none w-[240px]">
          <IndiceCorrecao />
        </div>
      </div>

      {/* Linha 2: Valor + Data Inicial + Data do Cálculo */}
      <div className="flex flex-row gap-6 items-end">
        <InputValor />
        <Data title="Data Inicial" />
        <Data title="Data do Cálculo" />
      </div>

      {/* Linha 3: Descrição */}
      <div>
        <Descricao />
      </div>

    </div>
  );
}
export default CentralCard;
