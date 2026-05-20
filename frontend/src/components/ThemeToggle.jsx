import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";

export default function ThemeToggle({ className = "" }) {
  const { mode, toggle } = useTheme();
  const isDark = mode === "dark";
  return (
    <button
      onClick={toggle}
      title={isDark ? "Chuyển nền sáng" : "Chuyển nền tối"}
      aria-label="Toggle theme"
      className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition theme-border ${
        isDark
          ? "bg-white/5 text-amber-300 hover:bg-white/10"
          : "bg-slate-100 text-amber-600 hover:bg-slate-200"
      } ${className}`}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
