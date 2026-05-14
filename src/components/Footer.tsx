import logo_mprj_horizontal from "../assets/images/logo_mprj_horizontal_preto 1.png";
import logo_gate_horizontal from "../assets/images/logo_gate_horizontal_preto 1.png"

function Footer() {
    return (
        <div className="flex bg-white dark:bg-[#0d1117] w-full py-4 shadow-[0_-1px_4px_rgba(0,0,0,0.1)] dark:shadow-[0_-1px_4px_rgba(0,0,0,0.5)] min-h-[60px] mt-4 transition-colors duration-200 border-t border-transparent dark:border-[#21262d]">
            <div className="flex justify-between items-center w-[95%] max-w-[1400px] mx-auto">
                <img src={logo_mprj_horizontal} alt="logo_mprj_horizontal" className="dark:invert dark:opacity-80 transition-all duration-200" />
                <img src={logo_gate_horizontal} alt="logo_gate_horizontal" className="dark:invert dark:opacity-80 transition-all duration-200" />
            </div>
        </div>
    );
}

export default Footer;