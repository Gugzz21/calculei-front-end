interface LimparProps {
  onClick: () => void;
}

function Limpar({ onClick }: LimparProps) {
  return (
    <div className="w-full md:w-auto">
      <button
        onClick={onClick}
        className="bg-gray-300 w-full md:w-[200px] h-[50px] mt-2 md:mt-6 rounded border-[2px] border-blue-400 text-gray-700 font-semibold text-sm hover:bg-gray-400 transition-colors"
      >
        Limpar
      </button>
    </div>
  );
}

export default Limpar;