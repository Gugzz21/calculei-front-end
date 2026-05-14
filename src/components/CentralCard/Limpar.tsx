import BackspaceIcon from '@mui/icons-material/Backspace';

interface LimparProps {
  onClick: () => void;
}

function Limpar({ onClick }: LimparProps) {
  return (
    <div className="w-full sm:w-auto">
      <button
        onClick={onClick}
        className="flex justify-center items-center px-4 gap-3 bg-[#D0D8FF] dark:bg-slate-800/80 w-full sm:w-[200px] h-[40px] rounded-md text-[#073365] dark:text-gray-200 font-semibold text-sm hover:bg-[#ddd8ed] dark:hover:bg-slate-900/80 transition-colors cursor-pointer border border-transparent dark:border-slate-700"
      >
        <BackspaceIcon className="w-5 h-5 text-[#073365] dark:text-gray-200" />
        <span>Limpar</span>
      </button>
    </div>
  );
}

export default Limpar;
