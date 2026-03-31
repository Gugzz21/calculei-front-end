import { House } from 'lucide-react';
import imagemLogo from '../assets/images/calculei.png';

function Header() {

    return (
        <div className="flex bg-white w-full h-[65px] items-center shadow-sm z-10">
            <div className="flex justify-between items-center w-[95%] max-w-[1400px] mx-auto">
                <img src={imagemLogo} alt="logo" className="w-[150px] md:w-[130px] object-contain" />

                <div className="flex items-center gap-1">
                    <a href="https://linkedin.com/in/gustavo-dinizz21" className="font-bold text-blue-600 text-[14px] flex items-center hover:opacity-80 transition-opacity">
                        <House />
                    </a>
                </div>
            </div>
        </div>
    );
}

export default Header;
