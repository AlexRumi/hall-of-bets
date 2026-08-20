import { useState } from "react";
import { X, Pencil, Trash2, Calendar, Wallet } from "lucide-react";
import {
  calcularBeneficio,
  calcularCuotaTotal,
  agruparSeleccionesPorPartido,
  ESTADOS_TERMINADOS_PARTIDO as ESTADOS_TERMINADOS_API,
} from "../utils/apuestas";
import { useColorCasa } from "../hooks/useColorCasa";
import { usePartidoInfo } from "../hooks/usePartidoInfo";
import ConfirmDialog from "./ConfirmDialog";
import FormularioApuesta from "./FormularioApuesta";

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

// Un partido cicla Pendiente → Ganada → Perdida → Nula → Pendiente al
// tocar su pastilla (mismo orden que la maqueta de referencia del
// usuario). "Nula" saca el partido entero de la combinada (no cuenta en
// la cuota total, ver calcularCuotaTotal) — es un mecanismo DISTINTO e
// independiente de "Ajustar cuota" (ver más abajo): anular un partido
// entero no tiene nada que ver con que la casa recalcule la cuota de un
// mercado suyo.
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
  movimientos,
  todasApuestas,
  onMarcarResultado,
  onMarcarResultadoPartido,
  onActualizarCuotaSeleccion,
  onBorrar,
  onEditar,
  onCerrar,
  // Vista de solo repaso (petición directa: "Mejor apuesta"/"Peor apuesta"
  // en Estadísticas) — sin nada tocable, ni pie de botones.
  soloLectura = false,
}) {
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);
  const [mostrandoCashOut, setMostrandoCashOut] = useState(false);
  const [importeCashOut, setImporteCashOut] = useState("");
  const [editando, setEditando] = useState(false);
  // Aviso "¿cuál es la nueva cuota?" (Ajustar cuota) — un Set de
  // indiceLider con el aviso abierto, más el texto que se está
  // escribiendo en cada uno; cada partido lleva el suyo independiente.
  const [promptsCuota, setPromptsCuota] = useState(() => new Set());
  const [cuotasEditando, setCuotasEditando] = useState({});
  const esPendiente = apuesta.resultado === "pendiente";
  const cuotaTotal = calcularCuotaTotal(apuesta);
  const beneficio = calcularBeneficio(apuesta);
  const gruposPartido = agruparSeleccionesPorPartido(apuesta.selecciones);
  const esCombinada = gruposPartido.length > 1;
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

  function confirmarCashOut() {
    if (!importeCashOut || Number(importeCashOut) < 0) return;
    onMarcarResultado(apuesta.id, "cashout", Number(importeCashOut));
    setImporteCashOut("");
    setMostrandoCashOut(false);
  }

  function ciclarPartido(grupo) {
    // Con Cash Out ya hecho, se bloquea el ciclo — mismo criterio que la
    // maqueta de referencia: la apuesta ya está cerrada.
    if (apuesta.resultado === "cashout") return;
    const siguiente = ORDEN_CICLO[(ORDEN_CICLO.indexOf(grupo.resultado) + 1) % ORDEN_CICLO.length];
    onMarcarResultadoPartido(
      apuesta.id,
      grupo.selecciones.map((s) => s.indice),
      siguiente
    );
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

  if (editando) {
    return (
      <FormularioApuesta
        casas={casas}
        movimientos={movimientos}
        apuestas={todasApuestas}
        apuestaInicial={apuesta}
        onGuardar={(datos) => onEditar(apuesta.id, datos)}
        onCancelar={() => setEditando(false)}
      />
    );
  }

  return (
    <div className="bg-surface border border-line rounded-xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-line">
        <h2 className="font-display text-lg font-semibold text-ink truncate">
          {esCombinada ? `Combinada ${gruposPartido.length} partidos` : "Apuesta simple"}
        </h2>
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
        <span
          className={`ml-auto shrink-0 text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-lg ${ESTILOS_BARRA_ESTADO[apuesta.resultado]}`}
        >
          {ETIQUETAS_RESULTADO[apuesta.resultado]}
        </span>
      </div>

      <div className="flex border-y border-line">
        <div className="flex-1 text-center py-3">
          <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate whitespace-nowrap">
            Cuota{apuesta.cuotaTotalManual ? " *" : ""}
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
          <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate whitespace-nowrap">Ganancia</p>
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
          const promptAbierto = promptsCuota.has(grupo.indiceLider);
          return (
            <div
              key={grupo.indiceLider}
              className={`border border-line rounded-xl p-3 bg-paperDim transition-opacity ${esNula ? "opacity-55" : ""}`}
            >
              <div className="flex items-center gap-2.5">
                <span className="shrink-0 w-8 h-8 rounded-full bg-surface border border-line flex items-center justify-center text-base">
                  {EMOJI_DEPORTE[apuesta.deporte] ?? EMOJI_DEPORTE.Otro}
                </span>
                <p className="flex-1 min-w-0 truncate text-sm font-semibold text-ink">{grupo.evento}</p>
                <span
                  className={`shrink-0 font-mono text-xs font-bold px-2 py-1.5 rounded-lg border border-line bg-surface text-ink ${esNula ? "line-through opacity-70" : ""}`}
                >
                  {grupo.cuota.toFixed(2)}
                </span>
                {soloLectura ? (
                  <span
                    className={`shrink-0 text-xs font-bold px-2.5 py-1.5 rounded-lg ${ESTILOS_BARRA_ESTADO[grupo.resultado]}`}
                  >
                    {ETIQUETAS_RESULTADO[grupo.resultado]}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => ciclarPartido(grupo)}
                    disabled={apuesta.resultado === "cashout"}
                    className={`shrink-0 min-w-[76px] text-xs font-bold px-2.5 py-1.5 rounded-lg transition-opacity ${ESTILOS_BARRA_ESTADO[grupo.resultado]} ${
                      apuesta.resultado === "cashout" ? "opacity-60" : "hover:opacity-80"
                    }`}
                  >
                    {ETIQUETAS_RESULTADO[grupo.resultado]}
                  </button>
                )}
              </div>

              {!soloLectura &&
                (promptAbierto ? (
                  <div className="mt-2.5 ml-[42px] p-2.5 rounded-lg border border-gold/40 bg-gold/5 space-y-1.5">
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
                ) : (
                  <button
                    type="button"
                    onClick={() => abrirPromptCuota(grupo)}
                    className="mt-2 ml-[42px] text-[11px] font-semibold text-gold hover:underline"
                  >
                    ✎ Ajustar cuota (mercado anulado)
                  </button>
                ))}
            </div>
          );
        })}
      </div>

      {!soloLectura && (
        <div className="p-4 sm:p-5 border-t border-line space-y-2">
          <div className="flex flex-wrap gap-2">
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
            <button
              type="button"
              onClick={() => setEditando(true)}
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
