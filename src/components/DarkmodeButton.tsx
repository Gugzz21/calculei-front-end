import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function DarkmodeButton() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial state from localStorage - default is light mode
    const savedTheme = localStorage.getItem("calculei_theme");
    
    if (savedTheme === "dark") {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("calculei_theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("calculei_theme", "dark");
      setIsDark(true);
    }
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-full bg-slate-300 dark:bg-[#0d1117] text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-[#1e232b] transition-colors shadow-sm"
      title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
