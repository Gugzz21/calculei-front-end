import logo_mprj_horizontal from "../assets/images/logo_mprj_horizontal_preto 1.png";
import logo_gate_horizontal from "../assets/images/logo_gate_horizontal_preto 1.png"

function Footer() {
    return (
        <div className="flex absolute bottom-0 bg-white py-4 w-full justify-around items-center shadow-top-lg h-[8vh] min-h-[60px]">
            <img src={logo_mprj_horizontal}  alt="logo_mprj_horizontal" />
            <img src={logo_gate_horizontal}  alt="logo_gate_horizontal" />
        </div>
    );
}

export default Footer;