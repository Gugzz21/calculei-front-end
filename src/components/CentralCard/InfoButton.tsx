import { Info } from "lucide-react";

interface InfoButtonProps {
    onClick: () => void;
}

export default function InfoButton({ onClick }: InfoButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="text-gray-400 dark:text-gray-500 cursor-pointer transition-colors duration-200 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none"
            title="Ver informações detalhadas"
        >
            <Info size={16} />
        </button>
    );
}