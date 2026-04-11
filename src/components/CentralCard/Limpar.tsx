import { EraserIcon } from "lucide-react";

interface LimparProps {
  onClick: () => void;
}

function Limpar({ onClick }: LimparProps) {
  return (
    <div className="w-full md:w-auto">
      <button
        onClick={onClick}
        className="flex justify-center items-center px-4 gap-3 bg-[#e8e4f0] w-full md:w-[185px] h-[48px] rounded-md text-[#6b5fa0] font-semibold text-sm hover:bg-[#ddd8ed] transition-colors cursor-pointer"
      >
        <EraserIcon className="w-5 h-5" />
        <span>Limpar</span>
      </button>
    </div>
  );
}

export default Limpar;
