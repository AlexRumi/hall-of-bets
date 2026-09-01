import { useState } from "react";
import { X, Pencil, Trash2, Calendar, Wallet, ChevronDown } from "lucide-react";
import {
  calcularBeneficio,
  calcularCuotaTotal,
  agruparSeleccionesPorPartido,
  ESTADOS_TERMINADOS_PARTIDO as ESTADOS_TERMINADOS_API,
} from "../utils/apuestas";
import { escudoUrl, equiposDesdeEvento, esFormatoEquipos } from "../utils/mercados";
import { useColorCasa } from "../hooks/useColorCasa";
import { usePartidoInfo } from "../hooks/usePartidoInfo";
import ConfirmDialog from "./ConfirmDialog";

// Envoltorio "render prop" — se queda exportado porque TicketApuesta.jsx
// (Mini App de Telegram) lo sigue usando para traer el resultado final del
// partido con el mismo hook/caché que la app normal. Este archivo ya no lo
// usa por dentro (tercera vuelta del rediseño: sin marcador de partido en
// esta vista, ver más abajo).
export function InfoPartido({ partidoId, horaInicioMs, children }) {
  const info = usePartidoInfo(partidoId, horaInicioMs);
  const terminado = !!(info && ESTADOS_TERMINADOS_API.has(info.estado));
  return children(info, terminado);
}

const ETIQUETAS_RESULTADO = {
  pendiente: "Pendiente",
  ganada: "Ganada",
  perdida: "Perdida",
  nula: "Nula",
  cashout: "Cash Out",
};

const ESTILOS_BARRA_ESTADO = {
  pendiente: "bg-pending/15 text-pending",
  ganada: "bg-win/15 text-win",
  perdida: "bg-lose/15 text-lose",
  nula: "bg-void/15 text-void",
  cashout: "bg-cashout/15 text-cashout",
};

// Cada MERCADO (pick) suelto de un partido cicla Pendiente → Ganada →
// Perdida → Nula → Pendiente al tocar su propia pastilla — ya no se marca
// el partido entero de una vez (cuarta vuelta del rediseño, petición
// directa: en un bet builder de un solo partido con varios mercados
// —"Real Madrid gana" + "Mbappé marca"—, antes marcar cualquiera de los
// dos marcaba TODOS a la vez). El resultado del partido (derivarResultadoGrupo)
// y el de toda la apuesta (derivarResultadoApuesta, App.jsx) se derivan
// solos de estos resultados por mercado — "Nula" en todos los mercados de
// un partido saca ese partido entero de la combinada (no cuenta en la
// cuota total, ver calcularCuotaTotal). Mecanismo DISTINTO e independiente
// de "Ajustar cuota" (ver más abajo): anular un partido no tiene nada que
// ver con que la casa recalcule la cuota de uno de sus mercados.
const ORDEN_CICLO = ["pendiente", "ganada", "perdida", "nula"];

const EMOJI_DEPORTE = {
  Fútbol: "⚽",
  Baloncesto: "🏀",
  Tenis: "🎾",
  eSports: "🎮",
  Otro: "🎲",
};

// Tercera vuelta del rediseño del detalle de una apuesta (petición
// directa, con una maqueta HTML funcional de referencia — mismos colores
// de Hall of Bets, felt/gold/paper). Cada partido es su propia tarjeta
// con dos mecanismos independientes:
// 1) Su pastilla de estado (cicla Pendiente/Ganada/Perdida/Nula) — de ahí
//    se deriva el resultado real de la apuesta (cabecera), igual que la
//    vuelta anterior, solo que ahora sin diálogo: un toque, un paso.
// 2) "Ajustar cuota" (siempre visible, para cualquier estado): corrige la
//    cuota de ESE partido cuando la casa recalcula tras anular uno de sus
//    MERCADOS (no el partido entero) — vuelve el mecanismo que había
//    antes de la primera vuelta de este rediseño, pero ya no depende de
//    marcar un pick suelto (eso ya no existe): es un enlace siempre a
//    mano.
// Ya no se enseña el marcador del partido (petición directa) — con eso
// se cae también el marcador manual de "Otras ligas": ya no hay ningún
// sitio en la app que lo escriba (sí se sigue leyendo/enseñando en la
// Mini App de Telegram, con datos antiguos).
export default function ApuestaItem({
  apuesta,
  casas,
  onMarcarResultado,
  onMarcarResultadoPartido,
  onAjustarGanancia,
  onActualizarCuotaSeleccion,
  onBorrar,
  onAbrirEdicion,
  onCerrar,
  // Vista de solo repaso (petición directa: "Mejor apuesta"/"Peor apuesta"
  // en Estadísticas) — sin nada tocable, ni pie de botones.
  soloLectura = false,
}) {
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);
  const [mostrandoCashOut, setMostrandoCashOut] = useState(false);
  const [importeCashOut, setImporteCashOut] = useState("");
  const [mostrandoAjusteGanancia, setMostrandoAjusteGanancia] = useState(false);
  const [importeAjusteGanancia, setImporteAjusteGanancia] = useState("");
  // Aviso "¿cuál es la nueva cuota?" (Ajustar cuota) — un Set de
  // indiceLider con el aviso abierto, más el texto que se está
  // escribiendo en cada uno; cada partido lleva el suyo independiente.
  const [promptsCuota, setPromptsCuota] = useState(() => new Set());
  const [cuotasEditando, setCuotasEditando] = useState({});
  // Combinadas (petición directa, con maqueta de referencia): cada
  // partido empieza CERRADO — solo el resumen (escudo, nombre, tira de
  // cuadraditos por mercado) — y el usuario elige cuál desplegar, uno a
  // uno o varios a la vez. Mismo criterio que PanelPartidos.jsx (sin
  // ninguno abierto por defecto). Solo se usa cuando hay más de un
  // partido: con uno solo, sus mercados se ven siempre, sin acordeón.
  const [gruposAbiertos, setGruposAbiertos] = useState(() => new Set());
  function alternarGrupoAbierto(indiceLider) {
    setGruposAbiertos((actuales) => {
      const siguiente = new Set(actuales);
      if (siguiente.has(indiceLider)) siguiente.delete(indiceLider);
      else siguiente.add(indiceLider);
      return siguiente;
    });
  }
  const esPendiente = apuesta.resultado === "pendiente";
  const cuotaTotal = calcularCuotaTotal(apuesta);
  const beneficio = calcularBeneficio(apuesta);
  const gruposPartido = agruparSeleccionesPorPartido(apuesta.selecciones);
  const esCombinada = gruposPartido.length > 1;
  // "En juego" (en vez de "Pendiente"): ya se ha marcado algún mercado
  // suelto, pero la apuesta como tal sigue sin resolverse del todo.
  const enJuego =
    esPendiente && apuesta.selecciones.some((s) => (s.resultado ?? "pendiente") !== "pendiente");
  // "Cuota efect." (en vez de "Cuota"): al menos un partido ha quedado
  // anulado y ya no cuenta en el producto (ver calcularCuotaTotal) — la
  // cuota que se ve ya no es la que tenía la combinada al crearla.
  const hayPartidoAnulado = gruposPartido.some((g) => g.resultado === "nula");
  const casaObj = casas.find((c) => c.nombre === apuesta.casa);
  const logoCasa = casaObj?.logo;
  const colorCasa = useColorCasa(casaObj ?? { nombre: apuesta.casa, logo: null });

  // Beneficio/Ganancia a mostrar en las 4 columnas: mientras está
  // pendiente, el "beneficio" real (calcularBeneficio) siempre da 0 (aún
  // no ha pasado nada) — se muestra en su lugar el potencial (con el
  // aumento de cuota aplicado si lo hay). Ganancia = retorno total
  // (beneficio + stake); en freebet no se suma el stake, nunca fue dinero
  // real que "recuperar" — mismo criterio que TarjetaApuestaResumen.jsx.
  // "mixta": se gana sobre TODO lo apostado (parte real + freebet), igual
  // que calcularBeneficio — stakeFreebet es null/0 en real y freebet puras.
  const baseGanancia = (apuesta.stake + (apuesta.stakeFreebet ?? 0)) * (cuotaTotal - 1);
  const gananciaPotencial = apuesta.aumentoPct
    ? baseGanancia * (1 + apuesta.aumentoPct / 100)
    : baseGanancia;
  const beneficioMostrado = esPendiente ? gananciaPotencial : beneficio;
  const gananciaMostrada =
    apuesta.tipoFondos === "freebet" ? beneficioMostrado : beneficioMostrado + apuesta.stake;
  const colorBeneficio =
    beneficioMostrado > 0 ? "text-win" : beneficioMostrado < 0 ? "text-lose" : "text-ink";

  function alternarCashOut() {
    setMostrandoCashOut((actual) => !actual);
    setImporteCashOut("");
  }

  // Ajuste de ganancia (petición directa): algunas casas (Bet365, sobre
  // todo) pagan un poco más de lo calculado por redondeos internos, sin
  // ser una promoción con % conocido (eso es "Aumento de cuota", en el
  // formulario). Se pide el TOTAL que de verdad pagó la casa (stake +
  // beneficio) — mismo dato que ya se calcula como "gananciaMostrada",
  // que es justo con lo que se rellena el campo al abrirlo, para que
  // solo haga falta tocar el céntimo de más, no escribir todo desde cero.
  function alternarAjusteGanancia() {
    setMostrandoAjusteGanancia((actual) => {
      const siguiente = !actual;
      if (siguiente) setImporteAjusteGanancia(gananciaMostrada.toFixed(2));
      return siguiente;
    });
  }

  function confirmarAjusteGanancia() {
    if (!importeAjusteGanancia || Number(importeAjusteGanancia) < 0) return;
    onAjustarGanancia(apuesta.id, Number(importeAjusteGanancia));
    setMostrandoAjusteGanancia(false);
  }

  function quitarAjusteGanancia() {
    onAjustarGanancia(apuesta.id, null);
    setMostrandoAjusteGanancia(false);
    setImporteAjusteGanancia("");
  }

  function confirmarCashOut() {
    if (!importeCashOut || Number(importeCashOut) < 0) return;
    onMarcarResultado(apuesta.id, "cashout", Number(importeCashOut));
    setImporteCashOut("");
    setMostrandoCashOut(false);
  }

  // Marca UN SOLO mercado (no todo el partido) — de ahí se derivan solos
  // el resultado del partido y el de la apuesta entera (ver comentario de
  // ORDEN_CICLO). "indice" es la posición absoluta de esta selección
  // dentro del array completo de la apuesta (agruparSeleccionesPorPartido
  // ya se lo asigna a cada pick).
  function ciclarPick(seleccion) {
    // Con Cash Out ya hecho, se bloquea el ciclo — mismo criterio que la
    // maqueta de referencia: la apuesta ya está cerrada.
    if (apuesta.resultado === "cashout") return;
    const actual = seleccion.resultado ?? "pendiente";
    const siguiente = ORDEN_CICLO[(ORDEN_CICLO.indexOf(actual) + 1) % ORDEN_CICLO.length];
    onMarcarResultadoPartido(apuesta.id, [seleccion.indice], siguiente);
  }

  function abrirPromptCuota(grupo) {
    setPromptsCuota((actuales) => new Set(actuales).add(grupo.indiceLider));
    setCuotasEditando((actuales) => ({ ...actuales, [grupo.indiceLider]: String(grupo.cuota) }));
  }

  function cerrarPromptCuota(indiceLider) {
    setPromptsCuota((actuales) => {
      const nuevo = new Set(actuales);
      nuevo.delete(indiceLider);
      return nuevo;
    });
  }

  function guardarCuotaGrupo(grupo) {
    const valor = Number(cuotasEditando[grupo.indiceLider]);
    if (!(valor > 0)) return;
    onActualizarCuotaSeleccion(apuesta.id, grupo.indiceLider, valor);
    cerrarPromptCuota(grupo.indiceLider);
  }

  return (
    <div className="bg-surface border border-line rounded-xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-line">
        <div className="min-w-0">
          {apuesta.titulo && (
            <p className="text-xs font-semibold text-gold truncate">{apuesta.titulo}</p>
          )}
          <h2 className="font-display text-lg font-semibold text-ink truncate">
            {esCombinada ? `Combinada ${gruposPartido.length} partidos` : "Apuesta simple"}
          </h2>
        </div>
        {onCerrar && (
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="shrink-0 text-slate hover:text-ink transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap px-4 sm:px-5 py-3">
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-paperDim text-slate">
          <Calendar size={12} /> {apuesta.fecha}
        </span>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-gold text-gold">
          {esCombinada ? "Combinada" : "Simple"}
        </span>
        {apuesta.tipoFondos === "freebet" && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-gold/10 text-gold">Freebet</span>
        )}
        {apuesta.tipoFondos === "mixta" && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-gold/10 text-gold">Mixta</span>
        )}
        {apuesta.seguroFreebetImporte > 0 && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-gold/10 text-gold">Asegurada</span>
        )}
        {apuesta.aumentoPct > 0 && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-gold/10 text-gold">
            +{apuesta.aumentoPct}% aumento
          </span>
        )}
        {apuesta.archivado && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-void/10 text-void">Archivada</span>
        )}
        {/* min-w fijo (bug real): sin él, "PENDIENTE" (más larga) → "GANADA"
            (más corta) encogía esta pastilla, y al estar en una fila que
            envuelve (flex-wrap) con el resto de etiquetas, el hueco que
            dejaba libre hacía que la fila recolocara todo de golpe — se
            veía como un salto/flash al marcar un resultado. */}
        <span
          className={`ml-auto shrink-0 min-w-[88px] text-center text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-lg ${ESTILOS_BARRA_ESTADO[apuesta.resultado]}`}
        >
          {enJuego ? "En juego" : ETIQUETAS_RESULTADO[apuesta.resultado]}
        </span>
      </div>

      <div className="flex border-y border-line">
        <div className="flex-1 text-center py-3">
          <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate whitespace-nowrap">
            {hayPartidoAnulado ? "Cuota efect." : "Cuota"}
            {apuesta.cuotaTotalManual ? " *" : ""}
          </p>
          <p className="font-mono text-sm sm:text-base font-bold text-gold">{cuotaTotal.toFixed(2)}</p>
        </div>
        <div className="flex-1 text-center py-3">
          <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate whitespace-nowrap">Importe</p>
          <p className="font-mono text-sm sm:text-base font-bold text-ink">
            {(apuesta.stake + (apuesta.stakeFreebet ?? 0)).toFixed(2)}€
          </p>
        </div>
        <div className="flex-1 text-center py-3">
          <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate whitespace-nowrap">
            {esPendiente ? "Retorno pot." : "Retorno"}
          </p>
          <p className="font-mono text-sm sm:text-base font-bold text-ink">{gananciaMostrada.toFixed(2)}€</p>
        </div>
        <div className="flex-1 text-center py-3">
          <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate whitespace-nowrap">Beneficio</p>
          <p className={`font-mono text-sm sm:text-base font-bold ${colorBeneficio}`}>
            {beneficioMostrado > 0 ? "+" : ""}
            {beneficioMostrado.toFixed(2)}€
          </p>
        </div>
      </div>

      {apuesta.cuotaTotalManual && (
        <p className="text-center text-[11px] text-slate px-4 pt-2">
          * Cuota ajustada a mano al importe real que pagó la casa, no al
          producto de las cuotas de cada partido.
        </p>
      )}

      <div className="flex items-center justify-between px-4 sm:px-5 pt-3 pb-2">
        <h3 className="font-display text-base font-semibold text-ink">Selecciones</h3>
        {logoCasa ? (
          <img src={logoCasa} alt={apuesta.casa} className="h-6 object-contain" />
        ) : (
          <span className="text-sm font-semibold" style={{ color: colorCasa }}>
            {apuesta.casa}
          </span>
        )}
      </div>

      <div className="px-4 sm:px-5 pb-4 space-y-2">
        {gruposPartido.map((grupo) => {
          const esNula = grupo.resultado === "nula";
          const colorBorde =
            grupo.resultado === "ganada"
              ? "border-win/50"
              : grupo.resultado === "perdida"
              ? "border-lose/50"
              : "border-line";
          const promptAbierto = promptsCuota.has(grupo.indiceLider);
          const tieneEscudoLocal = !!escudoUrl(grupo.equipoLocalId);
          const tieneEscudoVisitante = !!escudoUrl(grupo.equipoVisitanteId);
          const metaTexto = [grupo.pais, grupo.competicion].filter(Boolean).join(" · ") +
            (grupo.hora ? ` · ${grupo.hora}` : "");
          const { local: nombreLocal, visitante: nombreVisitante } = esFormatoEquipos(grupo.evento)
            ? equiposDesdeEvento(grupo.evento)
            : { local: null, visitante: null };

          // Lista de mercados de este partido: cada uno cicla su propia
          // pastilla — el resultado del partido (color del borde/tira de
          // cuadraditos) se deriva solo de estos, no se marca aparte (ver
          // ciclarPick). Compartida por las dos variantes de abajo (simple
          // y combinada), no se repite el JSX dos veces.
          const listaMercados = (
            <div className="border-l-2 border-line pl-3">
              {grupo.selecciones.map((seleccion) => {
                const estado = seleccion.resultado ?? "pendiente";
                const colorPunto =
                  estado === "ganada"
                    ? "bg-win"
                    : estado === "perdida"
                    ? "bg-lose"
                    : estado === "nula"
                    ? "bg-void"
                    : "border-2 border-pending bg-transparent";
                return (
                  <div
                    key={seleccion.id ?? seleccion.indice}
                    className="flex items-center gap-2 py-1.5 border-t border-line first:border-t-0 first:pt-0"
                  >
                    <span className={`shrink-0 w-2.5 h-2.5 rounded-full ${colorPunto}`} />
                    <p
                      className={`flex-1 min-w-0 text-xs sm:text-sm text-ink ${
                        estado === "nula" ? "line-through text-slate" : ""
                      }`}
                    >
                      {seleccion.apuesta}
                    </p>
                    {soloLectura ? (
                      <span
                        className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md ${ESTILOS_BARRA_ESTADO[estado]}`}
                      >
                        {ETIQUETAS_RESULTADO[estado]}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => ciclarPick(seleccion)}
                        disabled={apuesta.resultado === "cashout"}
                        className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md transition-opacity ${ESTILOS_BARRA_ESTADO[estado]} ${
                          apuesta.resultado === "cashout" ? "opacity-60" : "hover:opacity-80"
                        }`}
                      >
                        {ETIQUETAS_RESULTADO[estado]}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          );

          const bloqueAjustarCuota = (
            <>
              {!soloLectura && !promptAbierto && (
                <div className="mt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => abrirPromptCuota(grupo)}
                    className="text-[11px] font-semibold text-gold hover:underline"
                  >
                    ✎ Ajustar cuota (mercado anulado)
                  </button>
                </div>
              )}

              {!soloLectura && promptAbierto && (
                <div className="mt-2.5 p-2.5 rounded-lg border border-gold/40 bg-gold/5 space-y-1.5">
                  <p className="text-xs text-gold">
                    Introduce la cuota recalculada por la casa para este partido:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="1.01"
                      value={cuotasEditando[grupo.indiceLider] ?? ""}
                      onChange={(e) =>
                        setCuotasEditando((actuales) => ({
                          ...actuales,
                          [grupo.indiceLider]: e.target.value,
                        }))
                      }
                      placeholder="Ej. 4.20"
                      className="flex-1 border border-line rounded-lg px-2.5 py-1.5 text-sm font-mono bg-surface"
                    />
                    <button
                      type="button"
                      onClick={() => guardarCuotaGrupo(grupo)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gold text-feltDark hover:opacity-90 transition-opacity"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => cerrarPromptCuota(grupo.indiceLider)}
                      aria-label="Cancelar"
                      className="px-2 text-slate hover:text-ink transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          );

          // Cabecera del partido, en dos filas (petición directa, misma
          // maqueta en simple y en combinada): escudo+nombre de cada
          // equipo, uno debajo del otro, con la cuota (y en combinada, la
          // tira de cuadraditos + flecha) a la derecha; la meta
          // (país·competición·hora·nº sel.) debajo de los dos nombres. Sin
          // escudos reales de los dos equipos (apuesta manual, u otro
          // deporte), se queda en una sola línea con el emoji del deporte
          // — no hay nada que partir en dos filas.
          const partidoDivisible = tieneEscudoLocal && tieneEscudoVisitante && nombreLocal;
          const abierto = esCombinada && gruposAbiertos.has(grupo.indiceLider);
          const cabecera = (
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0 space-y-1">
                {partidoDivisible ? (
                  <>
                    <div className="flex items-center gap-2">
                      <img src={escudoUrl(grupo.equipoLocalId)} alt="" className="w-7 h-7 shrink-0 object-contain" />
                      <span className="text-sm font-semibold text-ink truncate">{nombreLocal}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <img src={escudoUrl(grupo.equipoVisitanteId)} alt="" className="w-7 h-7 shrink-0 object-contain" />
                      <span className="text-sm font-semibold text-ink truncate">{nombreVisitante}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    {tieneEscudoLocal ? (
                      <img src={escudoUrl(grupo.equipoLocalId)} alt="" className="w-7 h-7 shrink-0 object-contain" />
                    ) : (
                      <span className="shrink-0 w-7 h-7 rounded-full bg-surface border border-line flex items-center justify-center text-sm">
                        {EMOJI_DEPORTE[apuesta.deporte] ?? EMOJI_DEPORTE.Otro}
                      </span>
                    )}
                    <span className="text-sm font-semibold text-ink truncate">{grupo.evento}</span>
                  </div>
                )}
                {metaTexto && <p className="text-[11px] text-slate truncate">{metaTexto}</p>}
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span
                  className={`font-mono text-sm font-bold px-2.5 py-1.5 rounded-lg border border-line bg-surface text-gold ${esNula ? "line-through opacity-70" : ""}`}
                >
                  {grupo.cuota.toFixed(2)}
                </span>
                {esCombinada && (
                  <div className="flex items-center gap-1">
                    {grupo.selecciones.map((seleccion) => {
                      const estado = seleccion.resultado ?? "pendiente";
                      const colorCuadro =
                        estado === "ganada"
                          ? "bg-win"
                          : estado === "perdida"
                          ? "bg-lose"
                          : estado === "nula"
                          ? "bg-void"
                          : "border border-pending bg-transparent";
                      return (
                        <span
                          key={seleccion.id ?? seleccion.indice}
                          className={`w-2 h-2 rounded-sm ${colorCuadro}`}
                        />
                      );
                    })}
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-slate transition-transform ${abierto ? "rotate-180" : ""}`}
                    />
                  </div>
                )}
              </div>
            </div>
          );

          // Combinada (2+ partidos): la cabecera de arriba es un botón que
          // despliega/colapsa este partido (empieza cerrado, ver
          // gruposAbiertos) — dentro va la misma lista de mercados que en
          // una apuesta simple. Petición directa, con maqueta de
          // referencia: antes se veían las selecciones de todos los
          // partidos siempre abiertas.
          if (esCombinada) {
            return (
              <div
                key={grupo.indiceLider}
                className={`border rounded-xl bg-paperDim transition-colors overflow-hidden ${colorBorde} ${esNula ? "opacity-55" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => alternarGrupoAbierto(grupo.indiceLider)}
                  className="w-full p-3 text-left"
                >
                  {cabecera}
                </button>
                {abierto && (
                  <div className="px-3 pb-3">
                    {listaMercados}
                    {bloqueAjustarCuota}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div
              key={grupo.indiceLider}
              className={`border rounded-xl p-3 bg-paperDim transition-colors ${colorBorde} ${esNula ? "opacity-55" : ""}`}
            >
              {cabecera}
              <div className="mt-2.5">{listaMercados}</div>
              {bloqueAjustarCuota}
            </div>
          );
        })}
      </div>

      {!soloLectura && (
        <div className="p-4 sm:p-5 border-t border-line space-y-2">
          <div className="flex flex-wrap justify-center gap-2">
            {esPendiente && (
              <button
                type="button"
                onClick={alternarCashOut}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
                  mostrandoCashOut
                    ? "bg-cashout text-paper border-cashout"
                    : "border-line text-cashout hover:border-cashout"
                }`}
              >
                <Wallet size={14} /> Cash Out
              </button>
            )}
            {/* Disponible en cualquier resultado (petición directa) — el
                ajuste solo AFECTA a la ganancia cuando la apuesta acaba
                Ganada (ver calcularBeneficio), pero se puede dejar
                preparado desde antes, sin esperar a marcarla. */}
            <button
              type="button"
              onClick={alternarAjusteGanancia}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
                mostrandoAjusteGanancia
                  ? "bg-gold text-feltDark border-gold"
                  : "border-line text-gold hover:border-gold/50"
              }`}
            >
              <Pencil size={14} /> Ajustar ganancia
            </button>
            <button
              type="button"
              onClick={() => onAbrirEdicion(apuesta)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-line text-ink hover:border-gold/50 transition-colors"
            >
              <Pencil size={14} /> Modificar
            </button>
            <button
              type="button"
              onClick={() => setConfirmandoBorrado(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-line text-lose hover:border-lose transition-colors"
            >
              <Trash2 size={14} /> Eliminar
            </button>
          </div>

          {/* Importe directo en la propia tarjeta, en vez de un diálogo
              aparte: la casa no calcula el cash out con la cuota, así que
              hace falta preguntarlo, pero no hacía falta un modal para un
              solo campo. */}
          {mostrandoCashOut && (
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                value={importeCashOut}
                onChange={(e) => setImporteCashOut(e.target.value)}
                placeholder="Importe recibido (€)"
                autoFocus
                className="flex-1 border border-line rounded-lg px-3 py-2 text-sm font-mono bg-surface"
              />
              <button
                type="button"
                onClick={confirmarCashOut}
                disabled={!importeCashOut || Number(importeCashOut) < 0}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-cashout text-paper hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Confirmar
              </button>
            </div>
          )}

          {/* Mismo criterio que Cash Out: importe directo en la propia
              tarjeta — se pide el TOTAL pagado por la casa (stake +
              beneficio), ya relleno con lo que sale calculado, para
              corregir solo el redondeo de más sin escribir todo desde
              cero. */}
          {mostrandoAjusteGanancia && (
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={importeAjusteGanancia}
                  onChange={(e) => setImporteAjusteGanancia(e.target.value)}
                  placeholder="Total pagado por la casa (€)"
                  autoFocus
                  className="flex-1 border border-line rounded-lg px-3 py-2 text-sm font-mono bg-surface"
                />
                <button
                  type="button"
                  onClick={confirmarAjusteGanancia}
                  disabled={!importeAjusteGanancia || Number(importeAjusteGanancia) < 0}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-gold text-feltDark hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Confirmar
                </button>
              </div>
              <p className="text-xs text-slate">
                El total que de verdad ingresó la casa (lo apostado + la ganancia), no solo la ganancia.
              </p>
              {apuesta.gananciaTotalManual != null && (
                <button
                  type="button"
                  onClick={quitarAjusteGanancia}
                  className="text-xs font-semibold text-slate hover:text-lose hover:underline"
                >
                  Quitar ajuste (volver a calcularlo solo)
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        abierto={confirmandoBorrado}
        titulo="Borrar apuesta"
        mensaje="Esta acción no se puede deshacer. ¿Seguro que quieres borrar esta apuesta?"
        onConfirmar={() => {
          onBorrar(apuesta.id);
          setConfirmandoBorrado(false);
        }}
        onCancelar={() => setConfirmandoBorrado(false)}
      />
    </div>
  );
}
