import TipoCalculo from "./CentralCard/TipoCalculo";
import Data from "./CentralCard/Data";

function CentralCard() {
  return (
    <div className="flex flex-col bg-white justify-center items-center rounded-[5px] pb-6 w-full max-w-[1000px] h-[400px] mx-auto px-4">
      <div className="flex flex-col gap-6 mt-6">
        <TipoCalculo />
        <Data title="Data Inicial" />
        <Data title="Data do Cálculo" />
      </div>
    </div>
  );
}
export default CentralCard;
