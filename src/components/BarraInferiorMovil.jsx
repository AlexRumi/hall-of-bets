import { Wallet, PieChart, Ticket, Trophy, GraduationCap } from "lucide-react";

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
  const enApuestas = activa === "apuestas" || activa === "entretenimiento";

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-felt border-t border-gold/30 flex items-stretch print:hidden">
      {/* "Registro": lleva directo al formulario de apuesta. Si ya estabas
          en Apuestas o Entretenimiento, se queda donde estabas — el
          selector Apuestas/Entretenimiento vive arriba del todo, dentro de
          esa pantalla (ver App.jsx). */}
      <button
        type="button"
        onClick={() => {
          if (!enApuestas) onCambiar("apuestas");
        }}
        className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
          enApuestas ? "text-gold" : "text-paper/70"
        }`}
      >
        <Wallet size={20} />
        Registro
      </button>

      {ITEMS_LATERALES_IZQ.map((item) => (
        <BotonBarra key={item.id} {...item} activa={activa} onCambiar={onCambiar} />
      ))}

      {/* Inicio: círculo grande que sobresale por encima de la barra, con
          un aro del color de fondo de la página para que parezca "flotar"
          (como en muchas apps de equipos/clubes). */}
      <button
        type="button"
        onClick={() => onCambiar("inicio")}
        className="flex-1 flex flex-col items-center gap-1 pb-2"
      >
        <span
          className={`flex items-center justify-center w-14 h-14 -mt-6 rounded-full ring-4 ring-fondo shadow-lg transition-colors ${
            activa === "inicio"
              ? "bg-gold text-felt"
              : "bg-felt text-gold border-2 border-gold/40"
          }`}
        >
          <Ticket size={24} />
        </span>
        <span
          className={`text-[11px] font-medium transition-colors ${
            activa === "inicio" ? "text-gold" : "text-paper/70"
          }`}
        >
          Inicio
        </span>
      </button>

      {ITEMS_LATERALES_DER.map((item) => (
        <BotonBarra key={item.id} {...item} activa={activa} onCambiar={onCambiar} />
      ))}
    </nav>
  );
}
