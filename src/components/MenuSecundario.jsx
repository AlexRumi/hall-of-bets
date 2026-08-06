import { useEffect, useRef, useState } from "react";
import {
  Menu,
  PieChart,
  Landmark,
  CalendarDays,
  Trophy,
  Settings,
  GraduationCap,
  LogOut,
} from "lucide-react";

const OPCIONES = [
  { id: "estadisticas", etiqueta: "Estadísticas", Icono: PieChart },
  { id: "casas", etiqueta: "Casas de apuestas", Icono: Landmark },
  { id: "informe", etiqueta: "Informe", Icono: CalendarDays },
  { id: "trofeos", etiqueta: "Trofeos", Icono: Trophy },
  { id: "ajustes", etiqueta: "Ajustes", Icono: Settings },
  { id: "academia", etiqueta: "Academia", Icono: GraduationCap },
];

// Secciones que no dependen del bankroll activo (Apuestas/Entretenimiento):
// se agrupan aparte, en un menú propio, para que no parezcan sub-pestañas
// de la que esté seleccionada arriba.
export default function MenuSecundario({ activa, onCambiar, onCerrarSesion }) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);
  const seccionActivaEsGlobal = OPCIONES.some((o) => o.id === activa);

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
        aria-label="Más secciones"
        className={`p-2 rounded-full transition-colors ${
          seccionActivaEsGlobal
            ? "bg-felt text-paper border border-gold"
            : "text-paper hover:bg-white/10"
        }`}
      >
        <Menu size={18} />
      </button>

      {abierto && (
        <div className="absolute right-0 mt-2 w-56 bg-surface border border-line rounded-xl shadow-lg overflow-hidden z-50 text-left">
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
