import {
  Home,
  History,
  CalendarDays,
  Landmark,
  Trophy,
  GraduationCap,
  Settings,
  Bell,
  LogOut,
} from "lucide-react";

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
  { id: "novedades", etiqueta: "Novedades", Icono: Bell },
  { id: "ajustes", etiqueta: "Ajustes", Icono: Settings },
];

// Solo escritorio (ver App.jsx: en móvil la navegación va en la barra
// inferior + el menú ☰). El nombre "Hall of Bets" va en la cabecera de
// arriba, no aquí, para no repetirlo dos veces. Empieza justo debajo de esa
// cabecera. Petición directa (cabecera y barra lateral fijas, solo el
// contenido hace scroll): App.jsx envuelve todo en "md:h-screen
// md:overflow-hidden", así que este <aside> nunca es más alto que la
// pantalla — se estira exactamente a la altura disponible (default de
// flexbox, "stretch") y "md:overflow-y-auto" es solo un cinturón de
// seguridad por si algún día la lista no cupiera entera en una ventana
// muy baja. Ya no hace falta ningún "sticky" aquí dentro: al no
// desplazarse la página, este panel no se mueve nunca de sitio.
export default function SidebarNavegacion({
  activa,
  onCambiar,
  onCerrarSesion,
  // Nº de novedades sin leer (ver useNovedades.js) — pastilla roja junto
  // a "Novedades", igual que el aviso de "Pendientes" en otros sitios de
  // la app, para que se note que hay algo nuevo sin tener que entrar.
  noVistas = 0,
}) {
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 md:overflow-y-auto bg-felt px-3 py-6 print:hidden">
      <nav className="flex flex-col gap-1">
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
            {id === "novedades" && noVistas > 0 && (
              <span className="ml-auto min-w-[20px] text-center font-mono text-[11px] font-bold text-paper bg-lose rounded-full px-1.5 py-0.5">
                {noVistas}
              </span>
            )}
          </button>
        ))}

        {/* Cerrar sesión: antes vivía fijada abajo del todo con
            "sticky bottom" (solo icono) — con el <aside> estirado tanto
            como la columna de contenido a su lado, ese "sticky" no
            llegaba a quedar a la vista sin hacer scroll hasta el final
            (bug real, detectado por el usuario). Ahora es un enlace más
            de la lista de arriba (en rojo para que se note que es una
            acción distinta, no un destino más) — con la cabecera y esta
            barra ya fijas del todo (ver App.jsx), ni siquiera hace falta
            "sticky" para que se quede a la vista. */}
        <button
          type="button"
          onClick={onCerrarSesion}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-left text-lose hover:bg-lose/10 transition-colors"
        >
          <LogOut size={20} />
          Cerrar sesión
        </button>
      </nav>
    </aside>
  );
}
