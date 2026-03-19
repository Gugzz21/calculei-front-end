import { House } from 'lucide-react';
import imagemLogo from '../assets/images/calculei.png';

function Header() {
    return (
        <div className="flex flex-col md:flex-row py-4 bg-white px-4 md:px-[20px] w-full justify-between md:justify-center items-center gap-8 md:gap-0 shadow-sm z-10">
            <img src={imagemLogo} alt="logo" className="w-[150px] md:w-auto" />

            <div className="flex items-center md:pl-[970px] gap-1">
                <a href="https://linkedin.com/in/gustavo-dinizz21" className="font-bold text-blue-600 text-[14px] flex items-center">
                    <House />
                </a>
            </div>
        </div>
    );
}

export default Header;
