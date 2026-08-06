import { useEffect, useRef, useState } from "react";
import {
  Menu,
  Home,
  Wallet,
  Gamepad2,
  PieChart,
  Landmark,
  CalendarDays,
  Trophy,
  Settings,
  GraduationCap,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";

// En escritorio la navegación va por SidebarNavegacion.jsx, así que esta
// lista solo se ve en móvil (envuelta en md:hidden más abajo). En móvil
// sigue siendo el menú completo, incluyendo lo que no cabe en la barra
// inferior (Informe, Casas de apuestas, Ajustes).
const OPCIONES = [
  { id: "inicio", etiqueta: "Inicio", Icono: Home },
  { id: "apuestas", etiqueta: "Apuestas", Icono: Wallet },
  { id: "entretenimiento", etiqueta: "Entretenimiento", Icono: Gamepad2 },
  { id: "estadisticas", etiqueta: "Estadísticas", Icono: PieChart },
  { id: "casas", etiqueta: "Casas de apuestas", Icono: Landmark },
  { id: "informe", etiqueta: "Informe", Icono: CalendarDays },
  { id: "trofeos", etiqueta: "Trofeos", Icono: Trophy },
  { id: "ajustes", etiqueta: "Ajustes", Icono: Settings },
  { id: "academia", etiqueta: "Academia", Icono: GraduationCap },
];

// El botón de modo oscuro vive aquí dentro (y no suelto en la cabecera)
// porque en móvil, junto al icono ☰, chocaba con el título "Hall of Bets".
export default function MenuSecundario({
  activa,
  onCambiar,
  oscuro,
  onAlternarModoOscuro,
  onCerrarSesion,
}) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);

  useEffect(() => {
    function manejarClickFuera(e) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", manejarClickFuera);
    return () => document.removeEventListener("mousedown", manejarClickFuera);
  }, []);

  return (
    <div ref={contenedorRef} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((actual) => !actual)}
        aria-label="Menú"
        className="p-2 rounded-full text-paper hover:bg-white/10 transition-colors"
      >
        <Menu size={18} />
      </button>

      {abierto && (
        <div className="absolute right-0 mt-2 w-56 bg-surface border border-line rounded-xl shadow-lg overflow-hidden z-50 text-left">
          <div className="md:hidden">
            {OPCIONES.map(({ id, etiqueta, Icono }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  onCambiar(id);
                  setAbierto(false);
                }}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  activa === id
                    ? "bg-gold/10 text-gold"
                    : "text-ink hover:bg-paperDim"
                }`}
              >
                <Icono size={16} />
                {etiqueta}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onAlternarModoOscuro}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-t border-line text-ink hover:bg-paperDim transition-colors"
          >
            {oscuro ? <Sun size={16} /> : <Moon size={16} />}
            {oscuro ? "Modo claro" : "Modo oscuro"}
          </button>
          <button
            type="button"
            onClick={() => {
              onCerrarSesion();
              setAbierto(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-t border-line text-lose hover:bg-lose/10 transition-colors"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
