import TipoCalculo from "./CentralCard/TipoCalculo";
import Data from "./CentralCard/Data";


function CentralCard() {
    return (
        <div className="flex flex-col bg-white flex justify-center items-center rounded-[5  px]">
            <TipoCalculo />
            <Data title="Data Inicial" />
            <Data title="Data do Cálculo" />
        </div>
    )
}
export default CentralCard;