import { Calculator, HelpCircle } from 'lucide-react';

function Header() {
  return (
    <header className="flex bg-white w-full h-[65px] items-center shadow-sm z-10 sticky top-0">
      <div className="flex justify-between items-center w-full max-w-[1400px] mx-auto px-4 md:px-8">

        {/* Logo */}
        <h1 className="text-blue-900 text-xl sm:text-2xl md:text-3xl font-bold flex gap-2 items-center shrink-0">
          <Calculator className="text-blue-900 w-6 h-6 md:w-[30px] md:h-[30px]" />
          Calculei
        </h1>

        {/* Ações do header */}
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 border border-gray-300 rounded-full px-3 py-1.5 text-[13px] text-gray-600 font-medium hover:bg-gray-50 transition-colors whitespace-nowrap">
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Ajuda</span>
          </button>
        </div>

      </div>
    </header>
  );
}

export default Header;
