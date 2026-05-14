import { Calculator, HelpCircle } from 'lucide-react';
import DarkmodeButton from './DarkmodeButton';

function Header() {
  return (
    <header className="flex bg-white dark:bg-[#0d1117] w-full h-[65px] items-center shadow-sm z-10 sticky top-0 transition-colors duration-200 border-b border-transparent dark:border-[#21262d]">
      <div className="flex justify-between items-center w-full max-w-[1400px] mx-auto px-4 md:px-8">

        {/* Logo */}
        <h1 className="text-blue-900 dark:text-[#007aff] text-xl sm:text-2xl md:text-3xl font-bold flex gap-2 items-center shrink-0">
          <Calculator className="text-blue-900 dark:text-[#007aff] w-6 h-6 md:w-[30px] md:h-[30px]" />
          Calculei
        </h1>

        {/* Ações do header */}
        <div className="flex items-center gap-3">
          <DarkmodeButton />
          <button className="flex items-center gap-1.5 border border-slate-300 dark:border-[#21262d] rounded-full px-3 py-1.5 text-[13px] text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap">
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Ajuda</span>
          </button>
        </div>

      </div>
    </header>
  );
}

export default Header;
