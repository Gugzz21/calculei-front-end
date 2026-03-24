import { EraserIcon } from "lucide-react";

interface LimparProps {
  onClick: () => void;
}

function Limpar({ onClick }: LimparProps) {
  return (
    <div className="w-full md:w-auto">
      <button
        onClick={onClick}
        className="flex justify-center items-center px-4 gap-3 bg-gray-300 w-full md:w-[200px] h-[50px] mt-2 md:mt-6 rounded border-2 border-gray-400 text-gray-700 font-semibold text-sm hover:bg-gray-400 transition-colors"
      >
        <EraserIcon className="w-6 h-6" />
        <span className="underline decoration-2 underline-offset-4">Limpar</span>
      </button>
    </div>
  );
}

export default Limpar;