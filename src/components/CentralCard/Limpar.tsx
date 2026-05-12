import BackspaceIcon from '@mui/icons-material/Backspace';

interface LimparProps {
  onClick: () => void;
}

function Limpar({ onClick }: LimparProps) {
  return (
    <div className="w-full sm:w-auto">
      <button
        onClick={onClick}
        className="flex justify-center items-center px-4 gap-3 bg-[#D0D8FF] w-full sm:w-[200px] h-[40px] rounded-md text-[#073365] font-semibold text-sm hover:bg-[#ddd8ed] transition-colors cursor-pointer"
      >
        <BackspaceIcon className="w-5 h-5 text-[#073365]" />
        <span>Limpar</span>
      </button>
    </div>
  );
}

export default Limpar;
