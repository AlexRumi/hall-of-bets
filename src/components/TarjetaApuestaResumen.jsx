import { calcularBeneficio } from "../utils/apuestas";

// No hay iconos de fútbol/baloncesto/tenis en lucide-react (comprobado):
// un emoji por deporte es lo más parecido al icono del ejemplo.
const EMOJI_DEPORTE = {
  Fútbol: "⚽",
  Baloncesto: "🏀",
  Tenis: "🎾",
  eSports: "🎮",
  Otro: "🎲",
};

const ESTILOS_RESULTADO = {
  pendiente: "bg-pending/10 text-pending",
  ganada: "bg-win/10 text-win",
  perdida: "bg-lose/10 text-lose",
  nula: "bg-void/10 text-void",
  cashout: "bg-cashout/10 text-cashout",
};

function textoEvento(apuesta) {
  const primera = apuesta.selecciones[0].evento;
  const restantes = apuesta.selecciones.length - 1;
  return restantes > 0 ? `${primera} +${restantes}` : primera;
}

// Tarjeta compacta del listado (ver ListaApuestas.jsx): día, evento, icono
// del deporte y resultado/beneficio a la vista. El resto de datos (casa,
// combinada, freebet, cuota, stake, acciones de marcar resultado/editar/
// borrar) vive en el detalle — ApuestaItem.jsx, que se abre al tocar la
// tarjeta.
export default function TarjetaApuestaResumen({ apuesta, onAbrir }) {
  const esPendiente = apuesta.resultado === "pendiente";
  const beneficio = calcularBeneficio(apuesta);

  return (
    <button
      type="button"
      onClick={() => onAbrir(apuesta.id)}
      className="w-full flex items-center gap-3 bg-surface border border-line rounded-xl px-4 py-3 text-left hover:border-gold/40 transition-colors"
    >
      <span className="text-xl shrink-0" aria-hidden="true">
        {EMOJI_DEPORTE[apuesta.deporte] ?? EMOJI_DEPORTE.Otro}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink truncate">{textoEvento(apuesta)}</p>
      </div>

      <span
        className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg ${ESTILOS_RESULTADO[apuesta.resultado]}`}
      >
        {esPendiente
          ? "Pendiente"
          : `${beneficio > 0 ? "+" : ""}${beneficio.toFixed(2)}€`}
      </span>
    </button>
  );
}
