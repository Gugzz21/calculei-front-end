import { Calculator, HelpCircle } from 'lucide-react';
// import imagemLogo from '../assets/images/calculei.png';

function Header() {

    return (
        <div className="flex bg-white w-full h-[65px] items-center shadow-sm z-10">
            <div className="flex justify-between items-center w-[95%] max-w-[1400px] mx-auto">
                <h1 className='text-blue-900 text-3xl font-bold flex gap-2 items-center'><Calculator className='text-blue-900 size-[30px]' />Calculei</h1>

                <div className="flex items-center gap-1">
                    <button className="flex items-center gap-1.5 border border-gray-300 rounded-full px-3 py-1.5 text-[13px] text-gray-600 font-medium hover:bg-gray-50 transition-colors">
                        <HelpCircle className="w-4 h-4" />
                        Ajuda
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Header;
