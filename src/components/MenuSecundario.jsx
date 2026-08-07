import { useEffect, useRef } from "react";
import {
  Landmark,
  CalendarDays,
  Trophy,
  Settings,
  GraduationCap,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";

// Solo lo que no tiene ya su propio botón directo en BarraInferiorMovil.jsx
// (Inicio/Bets/Statistics tienen el suyo). Mismo orden que
// SidebarNavegacion.jsx (el menú de escritorio) para las que coinciden.
const OPCIONES = [
  { id: "informe", etiqueta: "Informe", Icono: CalendarDays },
  { id: "casas", etiqueta: "Casas de apuestas", Icono: Landmark },
  { id: "trofeos", etiqueta: "Trofeos", Icono: Trophy },
  { id: "academia", etiqueta: "Academia", Icono: GraduationCap },
  { id: "ajustes", etiqueta: "Ajustes", Icono: Settings },
];

// Panel "More" de la barra inferior móvil (ver BarraInferiorMovil.jsx):
// componente controlado, sin botón disparador propio ni estado de
// abierto/cerrado — lo maneja App.jsx igual que seccionActiva. Aparece como
// hoja inferior (justo encima de la barra) en vez de dropdown, porque el
// botón que lo abre ahora vive abajo, no en la cabecera.
export default function MenuSecundario({
  abierto,
  onCerrar,
  activa,
  onCambiar,
  oscuro,
  onAlternarModoOscuro,
  onCerrarSesion,
  botonRef,
}) {
  const contenedorRef = useRef(null);

  useEffect(() => {
    if (!abierto) return;
    function manejarClickFuera(e) {
      // El botón "More" que abre este panel vive en BarraInferiorMovil.jsx,
      // fuera de contenedorRef: sin excluirlo aquí, su propio click cuenta
      // como "click fuera" (el mousedown de ese click llega primero y
      // cierra el panel; luego el onClick del botón lo volvía a abrir),
      // así que tocarlo para cerrar no hacía nada visible.
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(e.target) &&
        !botonRef?.current?.contains(e.target)
      ) {
        onCerrar();
      }
    }
    document.addEventListener("mousedown", manejarClickFuera);
    return () => document.removeEventListener("mousedown", manejarClickFuera);
  }, [abierto, onCerrar, botonRef]);

  if (!abierto) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
        onClick={onCerrar}
      />
      <div
        ref={contenedorRef}
        className="fixed inset-x-3 bottom-[4.5rem] bg-surface border border-gold/40 rounded-xl shadow-lg shadow-black/30 overflow-hidden z-50 text-left"
      >
        {OPCIONES.map(({ id, etiqueta, Icono }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              onCambiar(id);
              onCerrar();
            }}
            className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activa === id ? "bg-gold/10 text-gold" : "text-ink hover:bg-paperDim"
            }`}
          >
            <Icono size={16} />
            {etiqueta}
          </button>
        ))}
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
            onCerrar();
          }}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-t border-line text-lose hover:bg-lose/10 transition-colors"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </>
  );
}
