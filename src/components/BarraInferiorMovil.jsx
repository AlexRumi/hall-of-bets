import { Home, Wallet, Plus, PieChart, MoreHorizontal } from "lucide-react";

function BotonBarra({ activa, Icono, etiqueta, onClick, botonRef, conAviso = false }) {
  return (
    <button
      ref={botonRef}
      type="button"
      onClick={onClick}
      className={`relative flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
        activa ? "text-gold" : "text-paper/70"
      }`}
    >
      <span className="relative">
        <Icono size={20} />
        {/* Puntito rojo (p.ej. novedades sin leer, ver App.jsx) — solo
            avisa de que hay algo, el número en sí se ve al abrir "Más". */}
        {conAviso && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-lose ring-2 ring-felt" />
        )}
      </span>
      {etiqueta}
    </button>
  );
}

// Solo móvil (ver App.jsx: en escritorio la navegación va en la barra
// lateral). 5 accesos, inspirados en el esquema Home/Bets/+/Statistics/More
// de Bet Analityx (etiquetas en español): Inicio, Apuestas (listado del
// bankroll activo), + (círculo central, abre el formulario de nueva
// apuesta), Estadísticas, y Más (panel con Informe/Casas/Trofeos/Academia/
// Ajustes — ver MenuSecundario.jsx). Sustituye al esquema anterior (Inicio
// como círculo + pestaña "Registro").
export default function BarraInferiorMovil({
  activa,
  onCambiar,
  onIrABets,
  onIrANuevaApuesta,
  onAbrirMas,
  masAbierto,
  masBotonRef,
  // Nº de novedades sin leer (ver useNovedades.js / App.jsx) — solo hace
  // falta saber si hay alguna, no cuántas, para el puntito de "Más".
  hayNovedades = false,
}) {
  const enBankroll = activa === "apuestas" || activa === "entretenimiento";
  const enNuevaApuesta = activa === "nueva-apuesta";

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-felt border-t border-gold/30 flex items-stretch print:hidden">
      <BotonBarra
        activa={activa === "inicio"}
        Icono={Home}
        etiqueta="Inicio"
        onClick={() => onCambiar("inicio")}
      />

      <BotonBarra
        activa={enBankroll}
        Icono={Wallet}
        etiqueta="Apuestas"
        onClick={onIrABets}
      />

      {/* Círculo central flotante, mismo estilo que tenía "Inicio" antes:
          sobresale por encima de la barra con un aro del color de fondo de
          la página. Ahora dedicado solo a añadir una apuesta nueva. */}
      <button
        type="button"
        onClick={onIrANuevaApuesta}
        className="flex-1 flex flex-col items-center gap-1 pb-2"
      >
        <span
          className={`flex items-center justify-center w-14 h-14 -mt-6 rounded-full ring-4 ring-fondo shadow-lg transition-colors ${
            enNuevaApuesta
              ? "bg-gold text-felt"
              : "bg-felt text-gold border-2 border-gold/40"
          }`}
        >
          <Plus size={24} />
        </span>
      </button>

      <BotonBarra
        activa={activa === "estadisticas"}
        Icono={PieChart}
        etiqueta="Estadísticas"
        onClick={() => onCambiar("estadisticas")}
      />

      <BotonBarra
        activa={masAbierto}
        Icono={MoreHorizontal}
        etiqueta="Más"
        onClick={onAbrirMas}
        botonRef={masBotonRef}
        conAviso={hayNovedades}
      />
    </nav>
  );
}
