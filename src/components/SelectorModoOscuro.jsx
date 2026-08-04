import { Sun, Moon } from "lucide-react";

export default function SelectorModoOscuro({ oscuro, onAlternar }) {
  return (
    <button
      type="button"
      onClick={onAlternar}
      aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="p-2 rounded-full text-paper hover:bg-white/10 transition-colors"
    >
      {oscuro ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
