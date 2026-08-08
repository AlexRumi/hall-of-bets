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

// Fondo sólido (no al 10% como el resto de badges de la app): la franja
// vertical necesita contraste fuerte para leerse girada. Colores fijos
// (los mismos RGB que usa el modo claro, ver src/index.css) en vez de los
// tokens win/lose/... que normalmente cambian con el modo: esas
// variantes de modo oscuro se aclaran a propósito para leerse bien como
// texto sobre fondo oscuro, pero aquí es al revés (fondo de color, texto
// claro encima) y quedaban demasiado pálidas.
const ESTILOS_FRANJA = {
  pendiente: "bg-[rgb(184,147,77)] text-paper",
  ganada: "bg-[rgb(30,142,90)] text-paper",
  perdida: "bg-[rgb(192,57,43)] text-paper",
  nula: "bg-[rgb(139,132,120)] text-paper",
  cashout: "bg-[rgb(58,110,165)] text-paper",
};

const ETIQUETAS_RESULTADO = {
  pendiente: "PENDIENTE",
  ganada: "GANADA",
  perdida: "PERDIDA",
  nula: "NULA",
  cashout: "CASH OUT",
};

function textoEvento(apuesta) {
  const primera = apuesta.selecciones[0].evento;
  const restantes = apuesta.selecciones.length - 1;
  return restantes > 0 ? `${primera} +${restantes} más` : primera;
}

// Tarjeta de una apuesta dentro del listado (ver ListaApuestas.jsx):
// círculo con el emoji del deporte, pastilla Simple/Combinada, evento, y
// una franja vertical con el resultado en mayúsculas girado. El resto de
// datos (casa, freebet, cuota, stake, acciones de marcar resultado/
// editar/borrar) vive en el detalle — ApuestaItem.jsx, que se abre al
// tocar la tarjeta. No hay badge de hora: la app no guarda la hora del
// partido, solo la fecha (ver conversación — se descartó a propósito).
export default function TarjetaApuestaResumen({ apuesta, onAbrir }) {
  const esCombinada = apuesta.selecciones.length > 1;

  return (
    <button
      type="button"
      onClick={() => onAbrir(apuesta.id)}
      className="w-full flex items-stretch text-left bg-paperDim border border-line rounded-xl overflow-hidden hover:border-gold/40 transition-colors"
    >
      <span className="shrink-0 flex items-center pl-3 py-3">
        <span className="w-9 h-9 rounded-full bg-surface flex items-center justify-center text-lg">
          {EMOJI_DEPORTE[apuesta.deporte] ?? EMOJI_DEPORTE.Otro}
        </span>
      </span>

      <div className="flex-1 min-w-0 py-3 pl-3 pr-2">
        <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-gold/15 text-gold mb-1.5">
          {esCombinada ? "Combinada" : "Simple"}
        </span>
        {apuesta.archivado && (
          <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-void/15 text-void mb-1.5 ml-1.5">
            Archivada
          </span>
        )}
        <p className="text-base font-bold text-ink truncate">{textoEvento(apuesta)}</p>
      </div>

      <span
        className={`w-9 shrink-0 flex items-center justify-center text-xs font-bold tracking-wide [writing-mode:vertical-rl] rotate-180 ${ESTILOS_FRANJA[apuesta.resultado]}`}
      >
        {ETIQUETAS_RESULTADO[apuesta.resultado]}
      </span>
    </button>
  );
}
