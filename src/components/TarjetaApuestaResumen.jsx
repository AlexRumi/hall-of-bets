import { calcularBeneficio, calcularCuotaTotal, agruparSeleccionesPorPartido } from "../utils/apuestas";
import { useColorCasa } from "../hooks/useColorCasa";

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

// Cuenta partidos, no mercados sueltos: un "multi" de un solo partido con
// varios mercados (un bet builder) es 1 partido, no "+3 más" — mismo
// criterio que ApuestaItem.jsx y utils/trofeos.js.
function textoEvento(gruposPartido) {
  const primera = gruposPartido[0].evento;
  const restantes = gruposPartido.length - 1;
  return restantes > 0 ? `${primera} +${restantes} más` : primera;
}

// Tarjeta de una apuesta dentro del listado (ver ListaApuestas.jsx):
// círculo con el emoji del deporte, pastilla Simple/Combinada, evento, y
// una franja vertical con el resultado en mayúsculas girado. El resto de
// datos (casa, freebet, cuota, stake, acciones de marcar resultado/
// editar/borrar) vive en el detalle — ApuestaItem.jsx, que se abre al
// tocar la tarjeta. No hay badge de hora: la app no guarda la hora del
// partido, solo la fecha (ver conversación — se descartó a propósito).
//
// "denso" (opcional, por defecto false — primer uso: PantallaInicio.jsx):
// añade una segunda presentación, solo visible desde escritorio (md:),
// como fila tipo tabla con casa/fecha/cuota/importe/beneficio, inspirada
// en cómo lo hace otra app de referencia que el usuario enseñó. La
// tarjeta de siempre no desaparece: se queda para el móvil (y para
// cualquier sitio que no active "denso").
export default function TarjetaApuestaResumen({ apuesta, onAbrir, denso = false, casas = [] }) {
  const gruposPartido = agruparSeleccionesPorPartido(apuesta.selecciones);
  const esCombinada = gruposPartido.length > 1;
  const casaObj = casas.find((c) => c.nombre === apuesta.casa);
  // Mismo hook que ApuestaItem.jsx: cada casa se ve siempre con el mismo
  // color "de firma" en toda la app.
  const colorCasa = useColorCasa(casaObj ?? { nombre: apuesta.casa, logo: null });
  const beneficio = calcularBeneficio(apuesta);
  // "Ganancia" = beneficio + lo apostado: el retorno total (stake incluido),
  // no solo el neto — al lado ya se ve el Beneficio (el neto), así que
  // Ganancia responde a "cuánto dinero recibes en total" (petición directa).
  // En freebet no se suma el stake: ese dinero nunca fue tuyo, así que no
  // "lo recuperas" al ganar, y si pierdes la freebet no recibes nada (0€,
  // no el importe del freebet) — mismo criterio que ya usa calcularBeneficio.
  const ganancia = apuesta.tipoFondos === "freebet" ? beneficio : beneficio + apuesta.stake;

  return (
    <button
      type="button"
      onClick={() => onAbrir(apuesta.id)}
      className="w-full text-left bg-paperDim border border-line rounded-xl overflow-hidden hover:border-gold/40 transition-colors"
    >
      <div className={`flex items-stretch ${denso ? "md:hidden" : ""}`}>
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
          <p className="text-base font-bold text-ink truncate">{textoEvento(gruposPartido)}</p>
        </div>

        <span
          className={`w-9 shrink-0 flex items-center justify-center text-xs font-bold tracking-wide [writing-mode:vertical-rl] rotate-180 ${ESTILOS_FRANJA[apuesta.resultado]}`}
        >
          {ETIQUETAS_RESULTADO[apuesta.resultado]}
        </span>
      </div>

      {denso && (
        // Dos líneas (mismo patrón que la app de referencia que enseñó el
        // usuario): logo de la casa (sin el nombre en texto: el logo ya
        // identifica la casa, petición directa) + fecha + tipo arriba,
        // deporte+evento abajo. Los 4 números (Cuota/Importe/Ganancia/
        // Beneficio) NO van dentro de esa columna de 2 líneas — son un
        // bloque hermano aparte, centrado verticalmente respecto a TODA la
        // tarjeta (items-center en el contenedor padre), no solo respecto
        // a la línea del evento (petición directa). Franja vertical de
        // estado a la derecha, igual que en la tarjeta de siempre. Cada
        // número va en un bloque de ancho FIJO (w-14/w-16/etc.), para que
        // no se desplacen entre sí según cuántas cifras tenga cada uno
        // (era el problema de "zigzag" reportado).
        <div className="hidden md:flex items-stretch">
          <div className="flex-1 min-w-0 flex items-center gap-4 py-2.5 pl-4 pr-7">
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate">{apuesta.fecha}</span>
                {casaObj?.logo ? (
                  <img
                    src={casaObj.logo}
                    alt={apuesta.casa}
                    title={apuesta.casa}
                    className="w-14 h-8 rounded object-contain shrink-0"
                  />
                ) : (
                  <span
                    title={apuesta.casa}
                    className="w-9 h-9 shrink-0 rounded-full bg-surface border border-line flex items-center justify-center text-base font-bold"
                    style={{ color: colorCasa }}
                  >
                    {apuesta.casa.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-gold/15 text-gold">
                  {esCombinada ? "Combinada" : "Simple"}
                </span>
                {apuesta.archivado && (
                  <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-void/15 text-void">
                    Archivada
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-surface flex items-center justify-center text-sm">
                  {EMOJI_DEPORTE[apuesta.deporte] ?? EMOJI_DEPORTE.Otro}
                </span>
                <p className="flex-1 min-w-0 truncate text-sm font-bold text-ink">
                  {textoEvento(gruposPartido)}
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-4">
              <div className="w-14 text-right">
                <p className="font-mono text-base font-bold text-ink">
                  {calcularCuotaTotal(apuesta).toFixed(2)}
                </p>
                <p className="text-[10px] tracking-wide text-slate">Cuota</p>
              </div>
              <div className="w-16 text-right">
                <p className="font-mono text-base font-bold text-ink">{apuesta.stake.toFixed(2)}€</p>
                <p className="text-[10px] tracking-wide text-slate">Importe</p>
              </div>
              <div className="w-16 text-right">
                <p className="font-mono text-base font-bold text-win">
                  {ganancia.toFixed(2)}€
                </p>
                <p className="text-[10px] tracking-wide text-slate">Ganancia</p>
              </div>
              <div className="w-20 text-right">
                <p
                  className={`font-mono text-base font-bold ${
                    beneficio > 0 ? "text-win" : beneficio < 0 ? "text-lose" : "text-ink"
                  }`}
                >
                  {beneficio > 0 ? "+" : ""}
                  {beneficio.toFixed(2)}€
                </p>
                <p className="text-[10px] tracking-wide text-slate">Beneficio</p>
              </div>
            </div>
          </div>

          <span
            className={`w-9 shrink-0 flex items-center justify-center text-xs font-bold tracking-wide [writing-mode:vertical-rl] rotate-180 ${ESTILOS_FRANJA[apuesta.resultado]}`}
          >
            {ETIQUETAS_RESULTADO[apuesta.resultado]}
          </span>
        </div>
      )}
    </button>
  );
}
