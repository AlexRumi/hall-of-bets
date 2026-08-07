import {
  Home,
  Wallet,
  Gamepad2,
  PieChart,
  CalendarDays,
  Landmark,
  Trophy,
  GraduationCap,
  Settings,
} from "lucide-react";

const ITEMS = [
  { id: "inicio", etiqueta: "Inicio", Icono: Home },
  { id: "apuestas", etiqueta: "Apuestas", Icono: Wallet },
  { id: "entretenimiento", etiqueta: "Entretenimiento", Icono: Gamepad2 },
  { id: "estadisticas", etiqueta: "Estadísticas", Icono: PieChart },
  { id: "informe", etiqueta: "Informe", Icono: CalendarDays },
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
export default function SidebarNavegacion({ activa, onCambiar }) {
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 bg-felt px-3 py-6 print:hidden">
      <nav className="flex flex-col gap-1 md:sticky md:top-20">
        {ITEMS.map(({ id, etiqueta, Icono }) => (
          <button
            key={id}
            type="button"
            onClick={() => onCambiar(id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-bold text-left transition-colors ${
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
    </aside>
  );
}
