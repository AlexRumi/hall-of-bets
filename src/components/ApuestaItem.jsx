import { useState } from "react";
import { X, Pencil, Trash2, Eye, EyeOff, Check, Minus } from "lucide-react";
import { calcularBeneficio, calcularCuotaTotal, agruparSeleccionesPorPartido } from "../utils/apuestas";
import { equiposDesdeEvento, esFormatoEquipos, etiquetaCategoriaDeTexto } from "../utils/mercados";
import { useColorCasa } from "../hooks/useColorCasa";
import { usePartidoInfo } from "../hooks/usePartidoInfo";
import ConfirmDialog from "./ConfirmDialog";
import FormularioApuesta from "./FormularioApuesta";

// Estados "terminado" de API-Football — en cualquier otro estado (por
// empezar o en juego) se enseña la hora en vez del resultado: sin "en
// directo" (ver usePartidoInfo.js, se descartó por cuota), un partido en
// juego solo se sabría con certeza si se ha vuelto a pedir, y no se
// vuelve a pedir — así que hasta que termine, la hora es lo único fiable
// que se puede enseñar.
// Exportado también para src/components/TicketApuesta.jsx (Mini App del bot
// de Telegram), que necesita el mismo criterio para saber cuándo pintar el
// marcador en vez de la hora.
export const ESTADOS_TERMINADOS_API = new Set(["FT", "AET", "PEN", "CANC", "ABD", "AWD", "WO"]);

// Combina la fecha del partido con su hora (las dos guardadas en la
// selección desde el buscador, ver ConstructorPartido.jsx) para saber desde
// cuándo tendría sentido pedir el resultado final — usePartidoInfo.js no
// llama a nada antes de esa hora + margen. "new Date('YYYY-MM-DDTHH:mm:00')"
// se interpreta en la zona horaria del navegador; como la hora ya viene en
// hora de España (api/partidos.js pide con timezone=Europe/Madrid) y el uso
// real es de un usuario en España, no hace falta ninguna librería de zonas.
export function horaInicioPartido(fecha, hora) {
  if (!fecha || !hora) return null;
  return new Date(`${fecha}T${hora}:00`).getTime();
}

// Envoltorio "render prop": llama a usePartidoInfo UNA sola vez por
// partido y expone el resultado a los dos sitios que lo necesitan (la
// hora/resultado de la cabecera y el marcador con escudos del final) —
// hace falta este patrón porque el hook no se puede llamar dos veces
// sueltas dentro del mismo .map() de partidos sin arriesgarse a que las
// dos disparen su propia petición a la vez (ninguna sabría que la otra ya
// está pidiendo lo mismo), duplicando el gasto de cuota. Exportado para que
// TicketApuesta.jsx (Mini App del bot de Telegram) traiga el resultado
// final con exactamente el mismo hook/caché que la app normal, en vez de
// reimplementar su propia llamada a api/partido.js.
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

// Franja de estado general de la apuesta (nueva, ver más abajo): mismos
// tokens de color que el resto, en versión traslúcida de fondo.
const ESTILOS_BARRA_ESTADO = {
  pendiente: "bg-pending/15 text-pending",
  ganada: "bg-win/15 text-win",
  perdida: "bg-lose/15 text-lose",
  nula: "bg-void/15 text-void",
  cashout: "bg-cashout/15 text-cashout",
};

// Icono circular de cada pick, y también de la cabecera "Multi Apuesta"/
// "Pick simple" de cada partido (mismo estilo, para que se lea como el
// mismo lenguaje visual): aro vacío en pendiente, relleno del color que
// toque en el resto — pensado para tocarlo (cicla Pendiente → Ganada →
// Perdida → Nula → Pendiente).
const ESTILOS_ICONO_PICK = {
  pendiente: "border-2 border-pending bg-transparent",
  ganada: "bg-win border-2 border-win",
  perdida: "bg-lose border-2 border-lose",
  nula: "bg-void border-2 border-void",
};

// Fondo sólido para el "sello" de resultado sobre cada partido — ver
// "colorResultado !== pendiente" más abajo.
const TINTE_SELLO = {
  ganada: "bg-win",
  perdida: "bg-lose",
  nula: "bg-void",
  cashout: "bg-cashout",
};

// Rediseño del marcado de resultado (petición directa, a partir de
// full-bet-demo.html/pick-status-demo.html): cada pick (selección) tiene su
// propio icono circular tocable que cicla Pendiente/Ganada/Perdida/Nula —
// sustituye por completo al mini-selector de 3 botones que había por
// partido. El resultado de cada partido se DERIVA de sus picks
// (derivarResultadoGrupo, utils/apuestas.js): ya no hay ninguna acción
// manual a nivel de partido. Y el resultado real de la apuesta (el que
// mueve beneficio/freebet/racha/trofeos) se deriva a su vez del de todos
// sus partidos (derivarResultadoApuesta) — manejarMarcarResultadoPick en
// App.jsx lo aplica solo, con los mismos efectos de freebet que antes
// tenían los botones grandes Ganada/Perdida/Nula (ya retirados). Cash Out
// se queda como la única acción manual: cierra la apuesta con el importe
// que se introduzca, sin depender de en qué estado estén los picks.
export default function ApuestaItem({
  apuesta,
  casas,
  movimientos,
  todasApuestas,
  onMarcarResultado,
  onMarcarResultadoSeleccion,
  onActualizarCuotaSeleccion,
  onActualizarMarcadorManual,
  onBorrar,
  onEditar,
  onCerrar,
  // Vista de solo repaso (petición directa: "Mejor apuesta"/"Peor apuesta"
  // en Estadísticas) — sin el sello ni el ojo/lápiz de cada partido, que
  // ahí solo estorban: ya se ve directamente el tic verde/cruz roja de
  // cada pick, sin nada que revelar ni corregir desde aquí.
  soloLectura = false,
}) {
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);
  const [mostrandoCashOut, setMostrandoCashOut] = useState(false);
  const [importeCashOut, setImporteCashOut] = useState("");
  const [editando, setEditando] = useState(false);
  // En escritorio, el sello de cada partido ya se revela solo al pasar el
  // ratón (group-hover). En móvil no hay hover — este set guarda qué
  // partidos (por indiceLider) se han revelado a mano con su propio ojo,
  // independiente uno de otro: revelar el primer partido no afecta al
  // segundo. Evita depender de un ":hover" simulado al tocar que en
  // algunos navegadores se queda pegado de forma poco predecible.
  const [revelados, setRevelados] = useState(() => new Set());
  // Modo edición por partido (petición directa tras probar el lápiz por
  // pick: ese diseño dejaba el lápiz demasiado cerca del sello, fácil de
  // tocar sin querer). Ahora el lápiz vive junto al ojo, y solo se ve
  // mientras el sello está oculto (ni revelado ni en edición) — al
  // tocarlo, el sello desaparece del todo (ni opaco ni con opacidad) y los
  // picks se vuelven tocables para cambiarlos sin paso de confirmación; el
  // propio ojo (ahora "ocultar") sale de este modo y vuelve a aplicar el
  // sello con el resultado ya actualizado.
  const [editandoPicks, setEditandoPicks] = useState(() => new Set());
  // Aviso "¿cuál es la nueva cuota?" tras anular un pick (por partido, ver
  // ciclarPick): un Set de indiceLider con el aviso abierto, más el texto
  // que se está escribiendo en cada uno — así cada partido lleva su propio
  // aviso independiente, y se puede reabrir más tarde con "Ajustar cuota"
  // aunque se haya cerrado sin guardar.
  const [promptsCuota, setPromptsCuota] = useState(() => new Set());
  const [cuotasEditando, setCuotasEditando] = useState({});
  // Marcador final escrito a mano (petición directa, solo para partidos de
  // "Otras ligas": sin partidoId no hay forma de traer el resultado
  // automático, así que es la única manera de dejarlo anotado). Mismo
  // patrón que promptsCuota/cuotasEditando: un Set con el indiceLider en
  // edición, más los dos valores que se están escribiendo en cada uno.
  const [marcadoresEditando, setMarcadoresEditando] = useState(() => new Set());
  const [valoresMarcador, setValoresMarcador] = useState({});
  const esPendiente = apuesta.resultado === "pendiente";
  const cuotaTotal = calcularCuotaTotal(apuesta);
  const beneficio = calcularBeneficio(apuesta);
  // Misma agrupación por partido tanto si es combinada como si es una
  // apuesta simple (con 1 solo grupo) — así la lista de selecciones usa
  // siempre el mismo trozo de interfaz, sin un caso especial aparte.
  const gruposPartido = agruparSeleccionesPorPartido(apuesta.selecciones);
  // "Combinada" cuenta partidos, no mercados sueltos: un "multi" de un solo
  // partido con 4 mercados (un bet builder) no es una combinada, es una
  // apuesta simple con varios mercados agrupados — mismo criterio en
  // TarjetaApuestaResumen.jsx y utils/trofeos.js.
  const esCombinada = gruposPartido.length > 1;
  const casaObj = casas.find((c) => c.nombre === apuesta.casa);
  const logoCasa = casaObj?.logo;
  const colorCasa = useColorCasa(casaObj ?? { nombre: apuesta.casa, logo: null });

  const baseGanancia = apuesta.stake * (cuotaTotal - 1);
  const gananciaPotencial = apuesta.aumentoPct
    ? baseGanancia * (1 + apuesta.aumentoPct / 100)
    : baseGanancia;
  const valorResumen = esPendiente ? gananciaPotencial : beneficio;
  const colorResumen = valorResumen > 0 ? "text-win" : valorResumen < 0 ? "text-lose" : "text-ink";

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

  function alternarRevelado(indiceLider) {
    setRevelados((actuales) => {
      const nuevo = new Set(actuales);
      if (nuevo.has(indiceLider)) nuevo.delete(indiceLider);
      else nuevo.add(indiceLider);
      return nuevo;
    });
  }

  function activarEdicionPicks(indiceLider) {
    setEditandoPicks((actuales) => new Set(actuales).add(indiceLider));
  }

  // El ojo, mientras un partido está en modo edición, sale de ese modo en
  // vez de alternar "revelado" — así siempre es el mismo botón el que
  // vuelve a aplicar el sello, ya con el resultado actualizado.
  function alternarOjo(indiceLider) {
    if (editandoPicks.has(indiceLider)) {
      setEditandoPicks((actuales) => {
        const nuevo = new Set(actuales);
        nuevo.delete(indiceLider);
        return nuevo;
      });
      return;
    }
    alternarRevelado(indiceLider);
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

  function abrirMarcadorManual(grupo) {
    setMarcadoresEditando((actuales) => new Set(actuales).add(grupo.indiceLider));
    setValoresMarcador((actuales) => ({
      ...actuales,
      [grupo.indiceLider]: {
        local: grupo.golesLocalManual ?? "",
        visitante: grupo.golesVisitanteManual ?? "",
      },
    }));
  }

  function cerrarMarcadorManual(indiceLider) {
    setMarcadoresEditando((actuales) => {
      const nuevo = new Set(actuales);
      nuevo.delete(indiceLider);
      return nuevo;
    });
  }

  function guardarMarcadorManual(grupo) {
    const valores = valoresMarcador[grupo.indiceLider] ?? {};
    const local = Number(valores.local);
    const visitante = Number(valores.visitante);
    if (!Number.isInteger(local) || local < 0 || !Number.isInteger(visitante) || visitante < 0) return;
    onActualizarMarcadorManual(apuesta.id, grupo.indiceLider, local, visitante);
    cerrarMarcadorManual(grupo.indiceLider);
  }

  // Petición directa (2026-08-11): antes cada pick era un único círculo que
  // ciclaba Pendiente → Ganada → Perdida → Nula — para marcar "Perdida"
  // había que pasar primero por "Ganada", y si te dabas cuenta después de
  // soltar el dedo, el partido ya se consideraba resuelto (aparecía el
  // sello) y hacía falta el lápiz otra vez para corregirlo. Ahora cada pick
  // tiene sus 3 botones (✓/✕/–) tocables directamente — se marca el
  // resultado que quieras de un solo toque, sin pasar por los demás.
  // Tocar el que ya está marcado lo vuelve a dejar en Pendiente (deshacer).
  function marcarPick(grupo, pick, resultado) {
    const actual = pick.resultado ?? "pendiente";
    const nuevo = actual === resultado ? "pendiente" : resultado;
    onMarcarResultadoSeleccion(apuesta.id, pick.indice, nuevo);
    // Petición directa: en un "multi" con varios mercados del mismo
    // partido, marcar uno como Perdida ya deja el partido entero como
    // "perdida" (basta con que falle uno) — pero si todavía queda algún
    // mercado de ESE MISMO partido sin decidir, antes había que tocar el
    // lápiz para poder seguir marcándolos (el sello ya tapaba la fila).
    // Mientras quede alguno pendiente, el partido se queda en modo edición
    // solo (sin sello) para poder marcarlos de un tirón; en cuanto no
    // quede ninguno, se sale sola del modo edición y el sello se aplica
    // al instante, sin pasos extra.
    // Bug real (detectado por el usuario): el pick que se acaba de tocar
    // hay que mirarlo con su valor NUEVO, no el guardado hasta ahora — al
    // deshacer un pick (Ganada → Pendiente otra vez) con otro ya en
    // Perdida, ese pick recién deshecho es justo el que se ha quedado sin
    // determinar, y antes no contaba (solo se miraban "los demás").
    const quedaAlgunoPendiente = grupo.selecciones.some((s) => {
      const valor = s.indice === pick.indice ? nuevo : s.resultado ?? "pendiente";
      return valor === "pendiente";
    });
    if (quedaAlgunoPendiente) {
      activarEdicionPicks(grupo.indiceLider);
    } else {
      setEditandoPicks((actuales) => {
        if (!actuales.has(grupo.indiceLider)) return actuales;
        const restantes = new Set(actuales);
        restantes.delete(grupo.indiceLider);
        return restantes;
      });
    }
    if (nuevo === "nula") {
      abrirPromptCuota(grupo);
    } else if (actual === "nula") {
      // Bug real (ya corregido con el ciclo, se mantiene aquí): si se
      // cambiaba de vuelta a Ganada/Perdida/Pendiente tras haber anulado
      // el pick, el aviso de "ajustar cuota" se quedaba abierto — solo se
      // cerraba a mano (Guardar o la "X"). Se anuló por error, así que se
      // cierra solo al dejar de estarlo.
      cerrarPromptCuota(grupo.indiceLider);
    }
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
      <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-line">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {logoCasa && (
              <img src={logoCasa} alt="" className="w-10 h-10 rounded object-contain shrink-0" />
            )}
            <p className="text-sm text-slate truncate">
              {apuesta.fecha} ·{" "}
              <span style={{ color: colorCasa }} className="font-semibold">
                {apuesta.casa}
              </span>{" "}
              · {apuesta.deporte}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-sm font-semibold px-2.5 py-1 rounded-full bg-gold/10 text-gold">
              {esCombinada ? `Combinada · ${gruposPartido.length} partidos` : "Simple"}
            </span>
            {apuesta.tipoFondos === "freebet" && (
              <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-gold/10 text-gold">
                Freebet
              </span>
            )}
            {apuesta.seguroFreebetImporte > 0 && (
              <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-gold/10 text-gold">
                Asegurada
              </span>
            )}
            {apuesta.aumentoPct > 0 && (
              <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-gold/10 text-gold">
                +{apuesta.aumentoPct}% aumento
              </span>
            )}
            {apuesta.archivado && (
              <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-void/10 text-void">
                Archivada
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setEditando(true)}
            aria-label="Editar apuesta"
            className="text-slate hover:text-gold transition-colors"
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            onClick={() => setConfirmandoBorrado(true)}
            aria-label="Eliminar apuesta"
            className="text-slate hover:text-lose transition-colors"
          >
            <Trash2 size={16} />
          </button>
          {onCerrar && (
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar"
              className="text-slate hover:text-ink transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="flex border-b border-line">
        <div className="flex-1 text-center py-3">
          <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate whitespace-nowrap">
            Stake
          </p>
          <p className="font-mono text-sm sm:text-base font-bold text-ink">
            {apuesta.stake.toFixed(2)}€
          </p>
        </div>
        <div className="flex-1 text-center py-3">
          <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate whitespace-nowrap">
            Cuota{apuesta.cuotaTotalManual ? " *" : ""}
          </p>
          <p className="font-mono text-sm sm:text-base font-bold text-gold">
            {cuotaTotal.toFixed(2)}
          </p>
        </div>
        <div className="flex-1 text-center py-3">
          <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate whitespace-nowrap">
            {esPendiente ? "Ganancia" : "Beneficio"}
          </p>
          <p className={`font-mono text-sm sm:text-base font-bold ${colorResumen}`}>
            {valorResumen > 0 ? "+" : ""}
            {valorResumen.toFixed(2)}€
          </p>
        </div>
      </div>

      {apuesta.cuotaTotalManual && (
        <p className="text-center text-[11px] text-slate px-4 pt-2">
          * Cuota ajustada a mano al importe real que pagó la casa, no al
          producto de las cuotas de cada partido.
        </p>
      )}

      {/* Estado general de la apuesta, derivado de sus partidos (que a su
          vez se derivan de sus picks) — vista previa en vivo, además de ser
          ya el resultado real guardado (ver manejarMarcarResultadoPick en
          App.jsx). Cash Out se queda igual (acción manual aparte, no
          derivada de los picks). */}
      <div className="flex justify-center py-2">
        <span
          className={`px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wide ${ESTILOS_BARRA_ESTADO[apuesta.resultado]}`}
        >
          {ETIQUETAS_RESULTADO[apuesta.resultado]}
        </span>
      </div>

      {/* pt-2: un poco de aire entre el estado de arriba y el primer
          partido, que antes quedaban pegados.
          pb-3: si la apuesta ya está resuelta, no hay bloque de Cash Out
          después (esPendiente es false) y el último partido quedaba justo
          contra el borde inferior redondeado de la tarjeta — su sello, sin
          margen debajo, se veía "cortado" ahí (parecía que faltaba scroll,
          pero ya era el final de verdad). */}
      <div className="pt-2 pb-3">
        {gruposPartido.map((grupo, indice) => {
          const colorResultado = grupo.resultado;
          const revelado = revelados.has(grupo.indiceLider);
          const enEdicion = editandoPicks.has(grupo.indiceLider);
          const promptAbierto = promptsCuota.has(grupo.indiceLider);
          const marcadorEnEdicion = marcadoresEditando.has(grupo.indiceLider);
          const hayPickAnulado = grupo.selecciones.some((s) => s.resultado === "nula");

          return (
            <div key={grupo.indiceLider}>
              {/* mt-2: un poco más de aire entre el marcador del partido
                  anterior y la línea que lo separa del siguiente — antes
                  solo tenían el py-3 de la propia tarjeta, quedaba
                  demasiado pegado. */}
              {indice > 0 && <div className="h-px bg-line mt-2" />}
              {/* min-h: sin esto, un partido con menos contenido (p.ej. sin
                  país/competición guardados, o sin el enlace "Ajustar
                  cuota") ocupa menos alto que uno con más — y como el
                  sello cubre toda la fila (inset-0), sus tarjetas verdes
                  salían de tamaños distintos aunque las dos fueran un
                  único pick. Un mínimo fijo iguala el tamaño del sello
                  entre partidos, creciendo solo si el contenido de verdad
                  necesita más (varios picks, textos largos). */}
              <div className="relative overflow-hidden px-4 sm:px-5 py-3 min-h-[6.75rem]">
                <div className="flex-1 min-w-0">
                    <InfoPartido
                      partidoId={grupo.partidoId}
                      horaInicioMs={horaInicioPartido(grupo.fecha ?? apuesta.fecha, grupo.hora)}
                    >
                      {(info, terminado) => {
                        const conEquipos = esFormatoEquipos(grupo.evento);
                        const equipos = equiposDesdeEvento(grupo.evento);
                        const esMultiPartido = grupo.selecciones.length > 1;
                        // "Competición · País" cuando hay los dos (partido
                        // elegido del buscador conectado); solo la
                        // competición cuando el evento se escribió a mano en
                        // "Otras ligas" con el campo opcional relleno (sin
                        // país, ese modo no lo pide) — null si no hay nada.
                        const etiquetaLiga =
                          grupo.competicion && grupo.pais
                            ? `${grupo.competicion} · ${grupo.pais}`
                            : grupo.competicion || grupo.pais || null;
                        return (
                          <>
                            {/* Cabecera "MULTI"/"PICK SIMPLE" + cuota
                                (petición directa, a partir de una captura de
                                referencia de un ticket real) — la cuota vive
                                aquí arriba, junto al título, en vez de al
                                final: así el ojo/lápiz de la esquina
                                superior (pr-16/pr-20 de hueco) nunca la tapa.
                                El icono (antes en su propia columna a la
                                izquierda de toda la tarjeta) se mueve aquí,
                                centrado verticalmente con el título — mismo
                                círculo relleno que ya usa cada pick
                                (ESTILOS_ICONO_PICK), no un tic/cruz sueltos
                                ni el punto plano de antes. La cuota va justo
                                al lado del título (no empujada al otro
                                extremo de la fila). */}
                            <div className="flex items-center justify-between gap-2 pr-16 sm:pr-20">
                              <span className="flex items-center gap-2">
                                <span
                                  className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-paper ${ESTILOS_ICONO_PICK[colorResultado]}`}
                                >
                                  {colorResultado === "ganada" && <Check size={12} strokeWidth={3} />}
                                  {colorResultado === "perdida" && <X size={12} strokeWidth={3} />}
                                  {colorResultado === "nula" && <Minus size={12} strokeWidth={3} />}
                                </span>
                                <span className="text-base font-bold uppercase tracking-wide text-gold">
                                  {esMultiPartido ? "Multi Apuesta" : "Pick simple"}
                                </span>
                                <span className="font-mono text-sm font-bold text-paper bg-felt rounded px-2 py-0.5">
                                  {grupo.cuota.toFixed(2)}
                                </span>
                              </span>
                              {hayPickAnulado && !promptAbierto && (
                                <button
                                  type="button"
                                  onClick={() => abrirPromptCuota(grupo)}
                                  className="text-[11px] font-semibold text-gold hover:underline shrink-0"
                                >
                                  ✎ Ajustar cuota
                                </button>
                              )}
                            </div>

                            {conEquipos ? (
                              (etiquetaLiga || (!terminado && grupo.hora)) && (
                                <p className="flex flex-wrap items-center gap-2 text-xs text-slate mt-0.5">
                                  {etiquetaLiga && <span>{etiquetaLiga}</span>}
                                  {!terminado && grupo.hora && (
                                    <span className="inline-block font-mono text-xs font-semibold px-2 py-0.5 rounded bg-gold/10 text-gold">
                                      {grupo.hora}
                                    </span>
                                  )}
                                </p>
                              )
                            ) : (
                              <>
                                <p className="text-base font-semibold text-ink break-words mt-0.5">
                                  {grupo.evento}
                                </p>
                                {etiquetaLiga && <p className="text-xs text-slate">{etiquetaLiga}</p>}
                              </>
                            )}

                            <div className="mt-2 space-y-1.5">
                              {grupo.selecciones.map((pick) => {
                                const estadoPick = pick.resultado ?? "pendiente";
                                const tachado = estadoPick === "perdida" || estadoPick === "nula";
                                // Formato de dos líneas (petición directa):
                                // valor del mercado en negrita arriba,
                                // categoría del mercado en gris debajo —
                                // solo cambia el FORMATO, el texto guardado
                                // (pick.apuesta) sigue siendo el mismo.
                                const etiquetaCategoria = etiquetaCategoriaDeTexto(pick.apuesta, equipos);
                                // Mientras el partido sigue pendiente no hay
                                // sello todavía (solo se pinta con
                                // colorResultado !== "pendiente"), así que
                                // no hay riesgo de tocar algo sin querer:
                                // cada pick es marcable directamente, sin
                                // pasar por el lápiz. En cuanto se resuelve
                                // (bug real de origen: al tocar el sello,
                                // que es pointer-events-none, el toque
                                // pasaba a lo que hubiera debajo y cambiaba
                                // el resultado sin querer), los tres
                                // botones desaparecen — hace falta el lápiz
                                // para volver a editarlo.
                                const puedeCiclar = enEdicion || colorResultado === "pendiente";
                                return (
                                  <div key={pick.indice} className="w-full flex items-start gap-2">
                                    {puedeCiclar ? (
                                      <div className="flex items-center gap-1 shrink-0 mt-0.5">
                                        <button
                                          type="button"
                                          onClick={() => marcarPick(grupo, pick, "ganada")}
                                          aria-label="Marcar como Ganada"
                                          className={`w-5 h-5 rounded-full flex items-center justify-center text-paper transition-colors ${
                                            estadoPick === "ganada" ? "bg-win" : "bg-win/25 hover:bg-win/60"
                                          }`}
                                        >
                                          <Check size={11} strokeWidth={3} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => marcarPick(grupo, pick, "perdida")}
                                          aria-label="Marcar como Perdida"
                                          className={`w-5 h-5 rounded-full flex items-center justify-center text-paper transition-colors ${
                                            estadoPick === "perdida" ? "bg-lose" : "bg-lose/25 hover:bg-lose/60"
                                          }`}
                                        >
                                          <X size={11} strokeWidth={3} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => marcarPick(grupo, pick, "nula")}
                                          aria-label="Marcar como Nula"
                                          className={`w-5 h-5 rounded-full flex items-center justify-center text-paper transition-colors ${
                                            estadoPick === "nula" ? "bg-void" : "bg-void/25 hover:bg-void/60"
                                          }`}
                                        >
                                          <Minus size={11} strokeWidth={3} />
                                        </button>
                                      </div>
                                    ) : (
                                      <span
                                        className={`w-4 h-4 rounded-full shrink-0 mt-0.5 flex items-center justify-center text-paper ${ESTILOS_ICONO_PICK[estadoPick]}`}
                                      >
                                        {estadoPick === "ganada" && <Check size={10} strokeWidth={3} />}
                                        {estadoPick === "perdida" && <X size={10} strokeWidth={3} />}
                                        {estadoPick === "nula" && <Minus size={10} strokeWidth={3} />}
                                      </span>
                                    )}
                                    <span className="flex-1 min-w-0">
                                      <span
                                        className={`flex flex-wrap items-baseline gap-1.5 text-sm font-semibold break-words ${
                                          tachado ? "line-through opacity-50 text-ink" : "text-ink"
                                        }`}
                                      >
                                        {pick.apuesta}
                                        {estadoPick === "nula" && (
                                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-void/15 text-void no-underline">
                                            Anulada
                                          </span>
                                        )}
                                      </span>
                                      {etiquetaCategoria && (
                                        <span
                                          className={`block text-xs text-slate ${tachado ? "opacity-50" : ""}`}
                                        >
                                          {etiquetaCategoria}
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Marcador (petición directa: sin escudo — con
                                tantos equipos sin id guardado, o de
                                competiciones no conectadas, salía más una
                                iniciales de repuesto que un escudo real, y
                                chocaba más de lo que aportaba). Un equipo
                                por fila, local arriba y visitante abajo, con
                                su gol alineado a la derecha una vez
                                terminado el partido — nunca en directo
                                (mismo límite de siempre).
                                Sin partidoId (partido de "Otras ligas") no
                                hay forma de traer esto automático — se
                                muestra el mismo diseño, pero con los goles
                                escritos a mano (golesLocalManual/
                                golesVisitanteManual), editables con el
                                lápiz de abajo. */}
                            {conEquipos && (() => {
                              const esManual = !grupo.partidoId;
                              const hayMarcadorManual =
                                grupo.golesLocalManual != null && grupo.golesVisitanteManual != null;
                              const golesLocal = terminado ? info.golesLocal : grupo.golesLocalManual;
                              const golesVisitante = terminado
                                ? info.golesVisitante
                                : grupo.golesVisitanteManual;
                              const hayMarcador = terminado || hayMarcadorManual;
                              return (
                                <div className="mt-2 pt-2 border-t border-line/60 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="flex-1 text-sm font-semibold text-ink truncate">
                                      {equipos.local}
                                    </span>
                                    {hayMarcador && (
                                      <span className="font-mono text-sm font-bold text-ink bg-paperDim rounded px-2 py-0.5 shrink-0">
                                        {golesLocal}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="flex-1 text-sm font-semibold text-ink truncate">
                                      {equipos.visitante}
                                    </span>
                                    {hayMarcador && (
                                      <span className="font-mono text-sm font-bold text-ink bg-paperDim rounded px-2 py-0.5 shrink-0">
                                        {golesVisitante}
                                      </span>
                                    )}
                                  </div>

                                  {esManual && !soloLectura && !marcadorEnEdicion && (
                                    <button
                                      type="button"
                                      onClick={() => abrirMarcadorManual(grupo)}
                                      className="text-[11px] font-semibold text-gold hover:underline"
                                    >
                                      ✎ {hayMarcadorManual ? "Editar marcador" : "Añadir marcador"}
                                    </button>
                                  )}

                                  {esManual && !soloLectura && marcadorEnEdicion && (
                                    <div className="pt-1 space-y-1.5">
                                      <div className="flex items-center gap-2">
                                        <span className="flex-1 text-xs text-slate truncate">
                                          {equipos.local}
                                        </span>
                                        <input
                                          type="number"
                                          min="0"
                                          step="1"
                                          value={valoresMarcador[grupo.indiceLider]?.local ?? ""}
                                          onChange={(e) =>
                                            setValoresMarcador((actuales) => ({
                                              ...actuales,
                                              [grupo.indiceLider]: {
                                                ...actuales[grupo.indiceLider],
                                                local: e.target.value,
                                              },
                                            }))
                                          }
                                          className="w-16 border border-line rounded-lg px-2 py-1 text-sm font-mono bg-surface"
                                        />
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="flex-1 text-xs text-slate truncate">
                                          {equipos.visitante}
                                        </span>
                                        <input
                                          type="number"
                                          min="0"
                                          step="1"
                                          value={valoresMarcador[grupo.indiceLider]?.visitante ?? ""}
                                          onChange={(e) =>
                                            setValoresMarcador((actuales) => ({
                                              ...actuales,
                                              [grupo.indiceLider]: {
                                                ...actuales[grupo.indiceLider],
                                                visitante: e.target.value,
                                              },
                                            }))
                                          }
                                          className="w-16 border border-line rounded-lg px-2 py-1 text-sm font-mono bg-surface"
                                        />
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          onClick={() => guardarMarcadorManual(grupo)}
                                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-gold text-feltDark hover:opacity-90 transition-opacity"
                                        >
                                          Guardar
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => cerrarMarcadorManual(grupo.indiceLider)}
                                          className="px-3 py-1 rounded-lg text-xs font-semibold text-slate hover:text-ink transition-colors"
                                        >
                                          Cancelar
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </>
                        );
                      }}
                    </InfoPartido>
                </div>

                {/* Aviso opcional tras anular un pick (no bloqueante): si se
                    ignora, la cuota del partido se queda como estaba, y se
                    puede reabrir más tarde con "✎ Ajustar cuota" de arriba.
                    Guardar actualiza solo la cuota MOSTRADA de este grupo
                    (la de su selección líder) — si la apuesta tiene una
                    cuota total ajustada a mano (cuotaTotalManual), esto no
                    la toca; ver la nota en calcularCuotaTotal. */}
                {promptAbierto && (
                  <div className="mt-2 ml-[26px] p-2.5 rounded-lg border border-gold/40 bg-gold/5 space-y-1.5">
                    <p className="text-xs text-gold">
                      Has anulado un pick — introduce la nueva cuota de este
                      partido tras el recálculo de la casa:
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
                        aria-label="Ahora no"
                        className="px-2 text-slate hover:text-ink transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* "Sello" de resultado (maqueta de referencia del
                    usuario): tinte de color + etiqueta grande, con
                    pointer-events-none para que los picks y el aviso de
                    cuota de arriba se sigan pudiendo pulsar a través del
                    sello. Se dispara solo en cuanto colorResultado (el
                    resultado del partido, derivado de sus picks) deja de
                    ser "pendiente" — ya no depende de ningún botón manual,
                    ni de si la apuesta es simple o combinada.
                    Desenfoque y tinte van en dos capas separadas (no una
                    sola con blur+opacity a la vez): con las dos cosas en
                    el mismo elemento, ese 10% de opacidad restante deja
                    ver el contenido de debajo SIN desenfocar (el blur ya
                    se había aplicado al 100% antes de bajar la opacidad),
                    así que se seguía leyendo texto de fondo. Con el blur
                    en su propia capa (siempre al 100%, nunca transparente)
                    y el tinte encima en una capa aparte, no hay fuga.
                    inset-x/inset-y (en vez de inset-0) dejan un margen a
                    los lados y arriba/abajo para que el sello se vea como
                    una tarjeta redondeada flotando dentro de la fila, no
                    como un bloque a sangre completa de borde a borde. */}
                {colorResultado !== "pendiente" && !enEdicion && !soloLectura && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                      className={`absolute inset-x-2 sm:inset-x-3 inset-y-1 rounded-xl backdrop-blur-[5px] transition-[backdrop-filter] duration-200 ${
                        revelado ? "backdrop-blur-none" : ""
                      }`}
                    />
                    <div
                      className={`absolute inset-x-2 sm:inset-x-3 inset-y-1 rounded-xl transition-opacity duration-200 ${TINTE_SELLO[colorResultado]} ${
                        revelado ? "opacity-[0.48]" : "opacity-90"
                      }`}
                    />
                    <div
                      className={`relative flex flex-col items-center gap-1 transition-opacity duration-200 px-4 text-center ${
                        revelado ? "opacity-0" : ""
                      }`}
                    >
                      <span className="font-display font-extrabold text-2xl tracking-wide text-paper">
                        {ETIQUETAS_RESULTADO[colorResultado].toUpperCase()}
                      </span>
                      <span className="text-sm font-semibold text-paper/90">{grupo.evento}</span>
                    </div>
                  </div>
                )}

                {/* Ojo + lápiz propios de este partido — no uno solo para
                    toda la apuesta: revelar/editar el primer partido no
                    afecta al resto.
                    Petición directa: mientras el partido sigue pendiente,
                    los picks ya son tocables directamente (ver
                    "puedeCiclar" más arriba) — el lápiz solo hace falta
                    para volver a entrar en modo edición una vez resuelto
                    (ahí sí hay sello, y hace falta el hueco de seguridad
                    contra el toque accidental). Antes se veía también
                    mientras estaba pendiente, cuando no aportaba nada.
                    El ojo se ve si hay sello que ocultar/mostrar O si hay
                    que salir del modo edición. Sin sello de fondo (en
                    edición) los botones pasan a un estilo con más
                    contraste que el "sobre tinte de color" de siempre. */}
                {!soloLectura && (() => {
                  const sinTinte = colorResultado === "pendiente" || enEdicion;
                  const estiloIcono = sinTinte
                    ? "bg-paperDim border border-line text-slate hover:text-gold"
                    : "bg-black/15 hover:bg-black/25 text-paper";
                  return (
                    <div className="absolute top-4 right-5 flex items-center gap-1.5">
                      {!revelado && !enEdicion && colorResultado !== "pendiente" && (
                        <button
                          type="button"
                          onClick={() => activarEdicionPicks(grupo.indiceLider)}
                          aria-label="Editar resultado de este partido"
                          className={`p-1.5 rounded-full transition-colors ${estiloIcono}`}
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      {(colorResultado !== "pendiente" || enEdicion) && (
                        <button
                          type="button"
                          onClick={() => alternarOjo(grupo.indiceLider)}
                          aria-label={
                            revelado || enEdicion
                              ? "Ocultar resultado de este partido"
                              : "Ver resultado de este partido"
                          }
                          className={`p-1.5 rounded-full transition-colors ${estiloIcono}`}
                        >
                          {revelado || enEdicion ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>

      {esPendiente && (
        <div className="p-4 sm:p-5 border-t border-line space-y-2">
          <button
            type="button"
            onClick={alternarCashOut}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold border transition-colors ${
              mostrandoCashOut
                ? "bg-cashout text-paper border-cashout"
                : "border-line text-cashout hover:border-cashout"
            }`}
          >
            Cash Out
          </button>

          {/* Importe directo en la propia tarjeta, en vez de un diálogo
              aparte (CashOutDialog.jsx, eliminado): la casa no calcula el
              cash out con la cuota, así que hace falta preguntarlo, pero no
              hacía falta un modal para un solo campo. */}
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
