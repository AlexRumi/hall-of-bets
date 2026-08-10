import { useState } from "react";
import { X, Pencil, Trash2, Eye, EyeOff, Check, Minus } from "lucide-react";
import { calcularBeneficio, calcularCuotaTotal, agruparSeleccionesPorPartido } from "../utils/apuestas";
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
const ESTADOS_TERMINADOS_API = new Set(["FT", "AET", "PEN", "CANC", "ABD", "AWD", "WO"]);

// Combina la fecha del partido con su hora (las dos guardadas en la
// selección desde el buscador, ver ConstructorPartido.jsx) para saber desde
// cuándo tendría sentido pedir el resultado final — usePartidoInfo.js no
// llama a nada antes de esa hora + margen. "new Date('YYYY-MM-DDTHH:mm:00')"
// se interpreta en la zona horaria del navegador; como la hora ya viene en
// hora de España (api/partidos.js pide con timezone=Europe/Madrid) y el uso
// real es de un usuario en España, no hace falta ninguna librería de zonas.
function horaInicioPartido(fecha, hora) {
  if (!fecha || !hora) return null;
  return new Date(`${fecha}T${hora}:00`).getTime();
}

// Hora/resultado del partido en la esquina, estilo "ticket" de casa de
// apuestas (petición directa) — el partidoId ya guardado en la selección
// desde el buscador. Solo las apuestas creadas eligiendo un partido de
// verdad (no escritas a mano) tienen ese id; sin él no se pinta nada (nunca
// bloquea). La hora se enseña directa desde la propia selección (ya
// guardada, sin gastar ninguna llamada); el marcador final, en cambio,
// viene de usePartidoInfo.js (caché compartida en Supabase + gate por hora
// de inicio, para no repetir la llamada a la API más de una vez por
// partido en toda la vida de la app).
function EtiquetaPartidoEnVivo({ partidoId, hora, horaInicioMs }) {
  const info = usePartidoInfo(partidoId, horaInicioMs);
  const terminado = info && ESTADOS_TERMINADOS_API.has(info.estado);

  if (terminado) {
    return (
      <span className="inline-block font-mono text-xs font-semibold px-2 py-0.5 rounded bg-void/15 text-void">
        {info.golesLocal}-{info.golesVisitante}
      </span>
    );
  }

  if (!hora) return null;
  return (
    <span className="inline-block font-mono text-xs font-semibold px-2 py-0.5 rounded bg-gold/10 text-gold">
      {hora}
    </span>
  );
}

const ETIQUETAS_RESULTADO = {
  pendiente: "Pendiente",
  ganada: "Ganada",
  perdida: "Perdida",
  nula: "Nula",
  cashout: "Cash Out",
};

const COLOR_PUNTO = {
  pendiente: "bg-pending",
  ganada: "bg-win",
  perdida: "bg-lose",
  nula: "bg-void",
  cashout: "bg-cashout",
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

// Icono circular de cada pick (ver más abajo): aro vacío en pendiente,
// relleno del color que toque en el resto — mismo lenguaje de color que
// COLOR_PUNTO, pero pensado para tocarlo (cicla Pendiente → Ganada →
// Perdida → Nula → Pendiente).
const ESTILOS_ICONO_PICK = {
  pendiente: "border-2 border-pending bg-transparent",
  ganada: "bg-win border-2 border-win",
  perdida: "bg-lose border-2 border-lose",
  nula: "bg-void border-2 border-void",
};

const ORDEN_CICLO_PICK = ["pendiente", "ganada", "perdida", "nula"];

// Fondo sólido para el "sello" de resultado sobre cada partido — ver
// "colorResultado !== pendiente" más abajo. Mismos tokens que COLOR_PUNTO,
// como relleno en vez de punto.
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
  onBorrar,
  onEditar,
  onCerrar,
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

  function ciclarPick(grupo, pick) {
    const actual = pick.resultado ?? "pendiente";
    const siguiente = ORDEN_CICLO_PICK[(ORDEN_CICLO_PICK.indexOf(actual) + 1) % ORDEN_CICLO_PICK.length];
    onMarcarResultadoSeleccion(apuesta.id, pick.indice, siguiente);
    if (siguiente === "nula") abrirPromptCuota(grupo);
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
          const hayPickAnulado = grupo.selecciones.some((s) => s.resultado === "nula");

          return (
            <div key={grupo.indiceLider}>
              {indice > 0 && <div className="h-px bg-line" />}
              {/* min-h: sin esto, un partido con menos contenido (p.ej. sin
                  país/competición guardados, o sin el enlace "Ajustar
                  cuota") ocupa menos alto que uno con más — y como el
                  sello cubre toda la fila (inset-0), sus tarjetas verdes
                  salían de tamaños distintos aunque las dos fueran un
                  único pick. Un mínimo fijo iguala el tamaño del sello
                  entre partidos, creciendo solo si el contenido de verdad
                  necesita más (varios picks, textos largos). */}
              <div className="relative overflow-hidden px-4 sm:px-5 py-3 min-h-[6.75rem]">
                <div className="flex items-start gap-2.5">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${COLOR_PUNTO[colorResultado]}`}
                  />
                  <div className="flex-1 min-w-0">
                    {/* Hora/resultado junto al evento (petición directa —
                        antes vivía en una columna a la derecha, donde
                        chocaba con el ojo/lápiz de la esquina). Al no
                        competir ya por la esquina superior derecha, la
                        cuota puede bajar a la esquina inferior sin
                        necesidad del hueco extra que hacía falta antes. */}
                    <p className="flex flex-wrap items-center gap-2 text-base font-semibold text-ink break-words">
                      {grupo.evento}
                      {grupo.partidoId && (
                        <EtiquetaPartidoEnVivo
                          partidoId={grupo.partidoId}
                          hora={grupo.hora}
                          horaInicioMs={horaInicioPartido(grupo.fecha ?? apuesta.fecha, grupo.hora)}
                        />
                      )}
                    </p>
                    {grupo.pais && (
                      <p className="text-xs text-slate">
                        {grupo.competicion} · {grupo.pais}
                      </p>
                    )}
                    <div className="mt-1.5 space-y-1.5">
                      {grupo.selecciones.map((pick) => {
                        const estadoPick = pick.resultado ?? "pendiente";
                        const tachado = estadoPick === "perdida" || estadoPick === "nula";
                        const contenidoPick = (
                          <>
                            <span
                              className={`w-4 h-4 rounded-full shrink-0 mt-0.5 flex items-center justify-center text-paper ${ESTILOS_ICONO_PICK[estadoPick]}`}
                            >
                              {estadoPick === "ganada" && <Check size={10} strokeWidth={3} />}
                              {estadoPick === "perdida" && <X size={10} strokeWidth={3} />}
                              {estadoPick === "nula" && <Minus size={10} strokeWidth={3} />}
                            </span>
                            <span
                              className={`flex-1 flex flex-wrap items-baseline gap-1.5 text-sm font-medium break-words ${
                                tachado ? "line-through opacity-50 text-ink" : "text-ink"
                              }`}
                            >
                              <span className="text-gold no-underline">▸</span>
                              {pick.apuesta}
                              {estadoPick === "nula" && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-void/15 text-void no-underline">
                                  Anulada
                                </span>
                              )}
                            </span>
                          </>
                        );
                        // Fuera de modo edición, la fila es solo visual (bug
                        // real: al tocar el sello, que es pointer-events-none,
                        // el toque pasaba a lo que hubiera debajo, cambiando
                        // el resultado sin querer). Solo dentro del modo
                        // edición (lápiz junto al ojo) el pick se vuelve
                        // tocable, sin paso de confirmación.
                        return enEdicion ? (
                          <button
                            key={pick.indice}
                            type="button"
                            onClick={() => ciclarPick(grupo, pick)}
                            className="w-full flex items-start gap-2 text-left"
                          >
                            {contenidoPick}
                          </button>
                        ) : (
                          <div key={pick.indice} className="w-full flex items-start gap-2">
                            {contenidoPick}
                          </div>
                        );
                      })}
                    </div>

                    {/* Cuota en la esquina inferior derecha del contenido
                        (antes arriba, en su propia columna — chocaba con
                        el ojo/lápiz de la esquina superior). */}
                    <div className="mt-2 flex items-center justify-end gap-2">
                      {hayPickAnulado && !promptAbierto && (
                        <button
                          type="button"
                          onClick={() => abrirPromptCuota(grupo)}
                          className="text-[11px] font-semibold text-gold hover:underline"
                        >
                          ✎ Ajustar cuota
                        </button>
                      )}
                      <p className="font-mono text-base font-bold text-gold">
                        {grupo.cuota.toFixed(2)}
                      </p>
                    </div>
                  </div>
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
                {colorResultado !== "pendiente" && !enEdicion && (
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
                    Bug real: antes los dos dependían de "colorResultado !==
                    pendiente", pero un partido con picks mezclados (uno ya
                    marcado, otro sin tocar) sigue derivándose "pendiente"
                    en conjunto — así que nunca aparecía ni el lápiz ni el
                    ojo, y no había forma de entrar en modo edición ni
                    siquiera para el pick ya marcado. El lápiz ahora se ve
                    siempre que no se esté ya revelando o editando (haya o
                    no sello puesto); el ojo se ve si hay sello que
                    ocultar/mostrar O si hay que salir del modo edición.
                    Sin sello de fondo (pendiente, o en edición) los
                    botones pasan a un estilo con más contraste que el
                    "sobre tinte de color" de siempre. */}
                {(() => {
                  const sinTinte = colorResultado === "pendiente" || enEdicion;
                  const estiloIcono = sinTinte
                    ? "bg-paperDim border border-line text-slate hover:text-gold"
                    : "bg-black/15 hover:bg-black/25 text-paper";
                  return (
                    <div className="absolute top-4 right-5 flex items-center gap-1.5">
                      {!revelado && !enEdicion && (
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
