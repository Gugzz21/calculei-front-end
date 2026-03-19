import gate from "../assets/images/gate.png";

function Footer() {
    return (
        <div className="flex justify-center items-center bg-white py-4 w-full">
            <img src={gate} className="w-[30%] md:w-[10%] h-auto" alt="gate" />
        </div>
    );
}

export default Footer;