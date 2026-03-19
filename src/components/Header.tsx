import imagemLogo from '../assets/images/calculei.png';

function Header() {
    return (
        <div className="flex flex-col md:flex-row py-4 bg-white px-4 md:px-[20px] w-full justify-between md:justify-center items-center gap-8 md:gap-0 shadow-sm z-10">
            <img src={imagemLogo} alt="logo" className="w-[150px] md:w-auto" />

            <div className="flex items-center md:pl-[970px] gap-1">
                <a href="https://linkedin.com/in/gustavo-dinizz21" className="font-bold text-blue-600 text-[14px] flex items-center">
                    Orientações
                </a>
                <a href="https://linkedin.com/in/gustavo-dinizz21" className='text-blue-600'>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                    </svg>
                </a>
            </div>
        </div>
    );
}

export default Header;
