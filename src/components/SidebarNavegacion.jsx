import {
  Home,
  History,
  CalendarDays,
  Landmark,
  Trophy,
  GraduationCap,
  Settings,
  LogOut,
} from "lucide-react";
import SelectorModoOscuro from "./SelectorModoOscuro";

// "Apuestas"/"Entretenimiento" se quitaron de aquí (petición directa, ya
// con "+ Añadir apuesta" cubriendo el alta y "Historial" el listado de
// los dos bankrolls) — solo ocultas del menú de escritorio, nada de su
// código/ruta se ha tocado (siguen existiendo en App.jsx, alcanzables si
// hiciera falta) y el móvil no cambia: sigue con su propia navegación
// aparte (BarraInferiorMovil.jsx/MenuSecundario.jsx). "Estadísticas" se
// oculta igual (petición directa, tras añadir el panel de Estadísticas
// en la cabecera, ver PanelEstadisticas.jsx/App.jsx) — se queda por si
// hace falta en el futuro, sin borrar nada; su ruta sigue existiendo en
// App.jsx, solo no hay botón para llegar a ella desde aquí.
const ITEMS = [
  { id: "inicio", etiqueta: "Inicio", Icono: Home },
  { id: "informe", etiqueta: "Informe", Icono: CalendarDays },
  { id: "historial", etiqueta: "Historial", Icono: History },
  { id: "casas", etiqueta: "Casas de apuestas", Icono: Landmark },
  { id: "trofeos", etiqueta: "Trofeos", Icono: Trophy },
  { id: "academia", etiqueta: "Academia", Icono: GraduationCap },
  { id: "ajustes", etiqueta: "Ajustes", Icono: Settings },
];

// Solo escritorio (ver App.jsx: en móvil la navegación va en la barra
// inferior + el menú ☰). El nombre "Hall of Bets" va en la cabecera de
// arriba, no aquí, para no repetirlo dos veces. Empieza justo debajo de esa
// cabecera. La altura del <aside> la controla App.jsx (la fila
// sidebar+contenido es "md:flex-1", así que se estira solo hasta ocupar
// exactamente el resto de la pantalla — o más, si el contenido es largo).
// El "sticky" va en el <nav> de dentro, no en el <aside>: así, en secciones
// largas (p.ej. Academia) los enlaces se quedan fijos en pantalla mientras
// se hace scroll, en vez de desaparecer hacia arriba con el contenido.
// "md:top-20" deja hueco para que no quede tapado por la cabecera, que
// ahora también es fija arriba (ver App.jsx).
export default function SidebarNavegacion({
  activa,
  onCambiar,
  oscuro,
  onAlternarModoOscuro,
  onCerrarSesion,
}) {
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 bg-felt px-3 py-6 print:hidden">
      <nav className="flex flex-col gap-1 md:sticky md:top-20">
        {ITEMS.map(({ id, etiqueta, Icono }) => (
          <button
            key={id}
            type="button"
            onClick={() => onCambiar(id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-left transition-colors ${
              activa === id
                ? "bg-gold/20 text-gold"
                : "text-paper hover:bg-white/10"
            }`}
          >
            <Icono size={20} />
            {etiqueta}
          </button>
        ))}
      </nav>

      {/* Modo oscuro/cerrar sesión: antes vivían en la cabecera, ahora aquí
          abajo del todo — solo icono, sin etiqueta, para que se lean como
          acciones sueltas y no como un destino más de la lista de arriba
          (petición directa). "mt-auto" los deja pegados abajo del todo
          cuando el <aside> no es más alto que la pantalla; "md:sticky
          md:bottom-4" es lo que de verdad los mantiene a la vista cuando
          SÍ lo es — el <aside> se estira tanto como la columna de
          contenido a su lado (a propósito, para que el verde cubra toda la
          altura), así que sin esto quedaban "abajo del todo" de una
          columna mucho más alta que la pantalla, invisibles sin hacer
          scroll hasta el final (bug real, detectado por el usuario). Con
          fondo propio (bg-felt) porque, al quedar fijo, el contenido del
          menú puede seguir desplazándose por debajo. */}
      <div className="mt-auto md:sticky md:bottom-4 flex items-center justify-center gap-2 pt-4 bg-felt">
        <SelectorModoOscuro oscuro={oscuro} onAlternar={onAlternarModoOscuro} />
        <button
          type="button"
          onClick={onCerrarSesion}
          aria-label="Cerrar sesión"
          className="p-2 rounded-full text-paper hover:bg-white/10 transition-colors"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
