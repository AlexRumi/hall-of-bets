import { Sun, Moon } from "lucide-react";

// "className" tiene un valor por defecto pensado para fondos oscuros
// (felt): en sitios con fondo claro (el ☰ de escritorio), quien lo use debe
// pasar otro color.
export default function SelectorModoOscuro({
  oscuro,
  onAlternar,
  className = "p-2 rounded-full text-paper hover:bg-white/10 transition-colors",
}) {
  return (
    <button
      type="button"
      onClick={onAlternar}
      aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className={className}
    >
      {oscuro ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
