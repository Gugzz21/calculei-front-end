import logo_mprj_horizontal from "../assets/images/logo_mprj_horizontal_preto 1.png";
import logo_gate_horizontal from "../assets/images/logo_gate_horizontal_preto 1.png"

function Footer() {
    return (
        <div className="flex bg-white w-full py-4 shadow-[0_-1px_4px_rgba(0,0,0,0.1)] min-h-[60px] mt-4">
            <div className="flex justify-between items-center w-[95%] max-w-[1400px] mx-auto">
                <img src={logo_mprj_horizontal} alt="logo_mprj_horizontal" />
                <img src={logo_gate_horizontal} alt="logo_gate_horizontal" />
            </div>
        </div>
    );
}

export default Footer;