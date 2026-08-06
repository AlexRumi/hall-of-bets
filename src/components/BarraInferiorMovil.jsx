import { useEffect, useRef, useState } from "react";
import { Wallet, Gamepad2, PieChart, Ticket, Trophy, GraduationCap } from "lucide-react";

const ITEMS_LATERALES_IZQ = [
  { id: "estadisticas", etiqueta: "Estadísticas", Icono: PieChart },
];
const ITEMS_LATERALES_DER = [
  { id: "trofeos", etiqueta: "Trofeos", Icono: Trophy },
  { id: "academia", etiqueta: "Academia", Icono: GraduationCap },
];

function BotonBarra({ id, etiqueta, Icono, activa, onCambiar }) {
  return (
    <button
      type="button"
      onClick={() => onCambiar(id)}
      className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
        activa === id ? "text-gold" : "text-paper/70"
      }`}
    >
      <Icono size={20} />
      {etiqueta}
    </button>
  );
}

// Solo móvil (ver App.jsx: en escritorio la navegación va en la barra
// lateral). Informe, Casas de apuestas y Ajustes no caben aquí — se llegan
// por el menú ☰, que en móvil se queda con las 9 secciones de siempre.
export default function BarraInferiorMovil({ activa, onCambiar }) {
  const [menuApuestasAbierto, setMenuApuestasAbierto] = useState(false);
  const contenedorRef = useRef(null);
  const enApuestas = activa === "apuestas" || activa === "entretenimiento";

  useEffect(() => {
    function manejarClickFuera(e) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setMenuApuestasAbierto(false);
      }
    }
    document.addEventListener("mousedown", manejarClickFuera);
    return () => document.removeEventListener("mousedown", manejarClickFuera);
  }, []);

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-felt border-t border-gold/30 flex items-stretch">
      {/* Apuestas: al tocarlo, desplegar Apuestas/Entretenimiento */}
      <div ref={contenedorRef} className="relative flex-1">
        <button
          type="button"
          onClick={() => setMenuApuestasAbierto((actual) => !actual)}
          className={`w-full flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
            enApuestas ? "text-gold" : "text-paper/70"
          }`}
        >
          <Wallet size={20} />
          Apuestas
        </button>

        {menuApuestasAbierto && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 bg-surface border border-line rounded-xl shadow-lg overflow-hidden text-left">
            <button
              type="button"
              onClick={() => {
                onCambiar("apuestas");
                setMenuApuestasAbierto(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-ink hover:bg-paperDim transition-colors"
            >
              <Wallet size={15} />
              Apuestas
            </button>
            <button
              type="button"
              onClick={() => {
                onCambiar("entretenimiento");
                setMenuApuestasAbierto(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-ink hover:bg-paperDim transition-colors border-t border-line"
            >
              <Gamepad2 size={15} />
              Entretenimiento
            </button>
          </div>
        )}
      </div>

      {ITEMS_LATERALES_IZQ.map((item) => (
        <BotonBarra key={item.id} {...item} activa={activa} onCambiar={onCambiar} />
      ))}

      <button
        type="button"
        onClick={() => onCambiar("inicio")}
        className="flex-1 flex flex-col items-center justify-center py-1.5"
      >
        <span
          className={`flex items-center justify-center w-11 h-11 rounded-full transition-colors ${
            activa === "inicio" ? "bg-gold text-felt" : "bg-white/10 text-gold"
          }`}
        >
          <Ticket size={22} />
        </span>
      </button>

      {ITEMS_LATERALES_DER.map((item) => (
        <BotonBarra key={item.id} {...item} activa={activa} onCambiar={onCambiar} />
      ))}
    </nav>
  );
}
