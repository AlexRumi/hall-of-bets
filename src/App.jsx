import { useEffect, useRef, useState } from "react";
import { Ticket, Trash2, ChevronLeft, Plus, PieChart } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { useApuestas } from "./hooks/useApuestas";
import { useCasas } from "./hooks/useCasas";
import { useTrofeos } from "./hooks/useTrofeos";
import { useMovimientos } from "./hooks/useMovimientos";
import { useObjetivos } from "./hooks/useObjetivos";
import { useAjustes } from "./hooks/useAjustes";
import {
  calcularRachaActual,
  filtrarPorPeriodo,
  derivarResultadoApuesta,
  agruparSeleccionesPorPartido,
} from "./utils/apuestas";
import { calcularBankrollPorCasa } from "./utils/movimientos";
import PantallaLogin from "./components/PantallaLogin";
import PantallaInicio from "./components/PantallaInicio";
import Historial from "./components/Historial";
import FormularioApuesta from "./components/FormularioApuesta";
import ListaApuestas from "./components/ListaApuestas";
import PanelLateral from "./components/PanelLateral";
import FiltrosApuestas from "./components/FiltrosApuestas";
import SelectorPeriodo from "./components/SelectorPeriodo";
import RachaActual from "./components/RachaActual";
import TarjetaBankroll from "./components/TarjetaBankroll";
import ObjetivoPersonal from "./components/ObjetivoPersonal";
import EstadisticasApuestas from "./components/EstadisticasApuestas";
import GraficoBeneficio from "./components/GraficoBeneficio";
import SalaTrofeos from "./components/SalaTrofeos";
import ListadoCasas from "./components/ListadoCasas";
import InformeProfesional from "./components/InformeProfesional";
import EstadisticasDashboard from "./components/EstadisticasDashboard";
import PanelEstadisticas from "./components/PanelEstadisticas";
import Ajustes from "./components/Ajustes";
import Academia from "./components/Academia";
import ConfirmDialog from "./components/ConfirmDialog";
import NotificacionTrofeo from "./components/NotificacionTrofeo";
import MenuSecundario from "./components/MenuSecundario";
import SidebarNavegacion from "./components/SidebarNavegacion";
import BarraInferiorMovil from "./components/BarraInferiorMovil";
import { useModoOscuro } from "./hooks/useModoOscuro";

const ETIQUETAS_SECCION = {
  apuestas: "Apuestas",
  entretenimiento: "Entretenimiento",
};

export default function App() {
  // Se lee aquí arriba (y no dentro de AppAutenticada) para que el tema
  // también se aplique en la pantalla de login, antes de identificarse.
  const { oscuro, alternar } = useModoOscuro();
  const { sesion, comprobandoSesion, iniciarSesion, cerrarSesion } = useAuth();

  if (comprobandoSesion) return null;

  // La app entraba de golpe (0 a 100% en un instante), así que se nota
  // brusca al abrirla. Un fundido de entrada un poco más largo (sin
  // pantalla de carga propia, solo la propia app apareciendo despacio)
  // suaviza esa primera impresión.
  return (
    <div style={{ animation: "app-entrada 1.5s ease-out" }}>
      {!sesion ? (
        <PantallaLogin
          onIniciarSesion={iniciarSesion}
          oscuro={oscuro}
          onAlternarModoOscuro={alternar}
        />
      ) : (
        <AppAutenticada
          userId={sesion.user.id}
          fechaAltaCuenta={sesion.user.created_at}
          onCerrarSesion={cerrarSesion}
          oscuro={oscuro}
          onAlternarModoOscuro={alternar}
        />
      )}
    </div>
  );
}

function AppAutenticada({ userId, fechaAltaCuenta, onCerrarSesion, oscuro, onAlternarModoOscuro }) {
  const {
    apuestas,
    agregarApuesta,
    editarApuesta,
    marcarResultado,
    marcarResultadoGrupo,
    actualizarCuotaSeleccion,
    borrarApuesta,
    borrarTodoBankroll,
    archivarPorRango: archivarApuestasPorRango,
  } = useApuestas(userId);
  const { casas, agregarCasa, borrarCasa, ajustarSaldoFreebet } = useCasas(userId);
  // Los trofeos se calculan sobre todas las apuestas, sin importar la
  // sección que se esté viendo, para que la notificación de un trofeo nuevo
  // pueda saltar aunque no estés en la pestaña de Trofeos.
  const { trofeos, notificacion, cerrarNotificacion } = useTrofeos(apuestas);
  const {
    movimientos,
    agregarMovimiento,
    borrarMovimiento,
    borrarTodosMovimientos,
    archivarPorRango: archivarMovimientosPorRango,
  } = useMovimientos(userId);
  const { objetivos, guardarObjetivo, borrarObjetivo } = useObjetivos(userId);
  const { ultimaCopia, registrarCopiaRealizada } = useAjustes(userId);
  const [seccionActiva, setSeccionActiva] = useState("inicio");
  const [filtroCasa, setFiltroCasa] = useState("todas");
  const [filtroFondos, setFiltroFondos] = useState("todas");
  const [verArchivadas, setVerArchivadas] = useState(false);
  const [periodo, setPeriodo] = useState("todo");
  const [confirmandoBorrarTodo, setConfirmandoBorrarTodo] = useState(false);
  // Solo tienen efecto visual en móvil (ver BarraInferiorMovil.jsx): en
  // escritorio el formulario está siempre visible y "More" no existe.
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [masAbierto, setMasAbierto] = useState(false);
  // "+ Añadir apuesta" del panel lateral (solo escritorio, ver
  // SidebarNavegacion.jsx): primero se elige el bankroll en un diálogo
  // pequeño, luego se abre el formulario ya con esa categoría fijada —
  // independiente de mostrandoFormulario, que sigue siendo solo para el
  // "+" de la barra inferior en móvil.
  const [eligiendoCategoriaNueva, setEligiendoCategoriaNueva] = useState(false);
  const [categoriaNuevaApuesta, setCategoriaNuevaApuesta] = useState(null);
  // Panel "Estadísticas" (experimento estilo Bet Analytix, ver
  // PanelEstadisticas.jsx): botón propio en la cabecera, independiente de la
  // sección activa — no sustituye la página de Estadísticas del menú.
  const [verEstadisticasPanel, setVerEstadisticasPanel] = useState(false);
  // Se comparte con MenuSecundario.jsx para que su "click fuera" no
  // confunda un click en este mismo botón con un click fuera del panel.
  const masBotonRef = useRef(null);

  // Al cambiar de sección, arrancar siempre desde arriba (si no, se queda
  // con el scroll donde estaba la sección anterior).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [seccionActiva]);

  // Siembra la lista gestionable de casas con los nombres ya usados en
  // apuestas de fases anteriores, para no perder ese historial.
  useEffect(() => {
    if (casas.length > 0 || apuestas.length === 0) return;
    const nombresUnicos = [...new Set(apuestas.map((a) => a.casa))];
    nombresUnicos.forEach((nombre) => agregarCasa({ nombre }));
  }, [apuestas, casas, agregarCasa]);

  // Cada bankroll (Apuestas/Entretenimiento) es independiente: solo se ven
  // (y se añaden) apuestas de la pestaña activa. Las archivadas (Fase C) se
  // excluyen por defecto salvo que se active "Ver también archivado" — esto
  // arrastra el archivado a apuestasFiltradas, apuestasPeriodo, la racha y
  // el listado, sin tener que tocar cada uno por separado.
  const apuestasDelBankroll = apuestas
    .filter((apuesta) => apuesta.categoria === seccionActiva)
    .filter((apuesta) => verArchivadas || !apuesta.archivado);

  const apuestasFiltradas = apuestasDelBankroll
    .filter((apuesta) => filtroCasa === "todas" || apuesta.casa === filtroCasa)
    .filter(
      (apuesta) =>
        filtroFondos === "todas" || apuesta.tipoFondos === filtroFondos
    );

  // Las estadísticas y el gráfico además se acotan al periodo elegido.
  // La racha, en cambio, se calcula sobre todo el bankroll: no depende de filtros ni periodo.
  const apuestasPeriodo = filtrarPorPeriodo(apuestasFiltradas, periodo);
  const racha = calcularRachaActual(apuestasDelBankroll);
  const esBankroll = seccionActiva === "apuestas" || seccionActiva === "entretenimiento";

  // Bankroll de este bankroll en concreto (dinero real de todas las casas +
  // freebets), para la tarjeta de arriba de Apuestas/Entretenimiento — ya
  // se puede calcular de verdad ahora que movimientos y freebet_saldo
  // también distinguen categoría (antes solo existía combinado, ver
  // Casas de apuestas).
  const bankrollCategoria = esBankroll
    ? calcularBankrollPorCasa(movimientos, apuestas, seccionActiva).reduce(
        (suma, b) => suma + b.bankroll,
        0
      )
    : 0;
  const campoFreebetCategoria =
    seccionActiva === "entretenimiento" ? "freebetSaldoEntretenimiento" : "freebetSaldoApuestas";
  const freebetsCategoria = esBankroll
    ? casas.reduce((suma, c) => suma + c[campoFreebetCategoria], 0)
    : 0;

  // Al crear una apuesta con fondos Freebet, se descuenta el stake del
  // saldo de esa casa al momento — gane, pierda o quede pendiente (ver
  // Fase A: el freebet se da por gastado en cuanto se juega).
  function manejarAgregar(datos, categoria = seccionActiva) {
    agregarApuesta({ ...datos, categoria });
    if (datos.tipoFondos === "freebet") {
      ajustarSaldoFreebet(datos.casa, -Number(datos.stake), categoria);
    } else if (datos.tipoFondos === "mixta") {
      ajustarSaldoFreebet(datos.casa, -Number(datos.stakeFreebet), categoria);
    }
    setMostrandoFormulario(false);
  }

  function manejarBorrarTodo() {
    borrarTodoBankroll(seccionActiva);
    setConfirmandoBorrarTodo(false);
  }

  // Cuánto freebet "extra" (además de lo ya descontado al crearla, eso es
  // fijo y no depende del resultado) corresponde a esta apuesta si su
  // resultado fuera "resultado": el reembolso de una Nula (freebet/mixta,
  // el stake que se descontó al crearla vuelve porque una nula no "gasta"
  // el freebet de verdad) y el seguro (freebet si pierde, aparte del tipo
  // de fondos). Función PURA — no toca nada, solo calcula.
  function efectoFreebetPorResultado(apuesta, resultado) {
    const reembolsoNula =
      apuesta.tipoFondos === "freebet"
        ? apuesta.stake
        : apuesta.tipoFondos === "mixta"
        ? apuesta.stakeFreebet ?? 0
        : 0;
    let efecto = 0;
    if (resultado === "nula") efecto += reembolsoNula;
    if (resultado === "perdida" && apuesta.seguroFreebetImporte) {
      efecto += apuesta.seguroFreebetImporte;
    }
    return efecto;
  }

  // Bug real: la pastilla de cada partido cicla Pendiente→Ganada→Perdida→
  // Nula→Pendiente… — si se pasaba varias veces por "Perdida" (probando
  // cómo se veía cada estado antes de dejarla en la definitiva) o por
  // "Nula", el seguro/reembolso de freebet se sumaba UNA VEZ POR CADA
  // PASADA, no solo la primera. Ahora se aplica la DIFERENCIA entre el
  // efecto del resultado anterior y el nuevo (ver efectoFreebetPorResultado
  // arriba) — el saldo siempre acaba correcto sin importar cuántas veces
  // se haya ciclado por el medio, porque cada cambio solo mueve lo que
  // falta entre "dónde estaba" y "adónde va", nunca una cantidad fija.
  function manejarMarcarResultado(id, resultado, cashoutImporte) {
    const apuesta = apuestas.find((a) => a.id === id);
    marcarResultado(id, resultado, cashoutImporte);
    if (apuesta) {
      const delta =
        efectoFreebetPorResultado(apuesta, resultado) -
        efectoFreebetPorResultado(apuesta, apuesta.resultado);
      if (delta !== 0) {
        ajustarSaldoFreebet(apuesta.casa, delta, apuesta.categoria);
      }
    }
  }

  // "Modificar" en ApuestaItem.jsx/TicketApuesta.jsx marca UN PARTIDO
  // entero (todos sus picks a la vez, ver marcarResultadoGrupo) — el
  // resultado real de la apuesta (el que mueve beneficio, freebet, racha
  // y trofeos) se deriva solo de los partidos, no se pone a mano en
  // ningún sitio. En cuanto cambia de verdad, reutiliza
  // manejarMarcarResultado de arriba, con los mismos efectos de freebet
  // de siempre. Si la apuesta ya se cerró con Cash Out, los partidos se
  // pueden seguir marcando para llevar el registro, pero ya no pisan ese
  // resultado.
  function manejarMarcarResultadoPartido(id, indices, resultado) {
    const apuesta = apuestas.find((a) => a.id === id);
    if (!apuesta) return;
    marcarResultadoGrupo(id, indices, resultado);
    if (apuesta.resultado === "cashout") return;

    const nuevasSelecciones = apuesta.selecciones.map((s, i) =>
      indices.includes(i) ? { ...s, resultado } : s
    );
    const nuevoResultado = derivarResultadoApuesta(agruparSeleccionesPorPartido(nuevasSelecciones));
    if (nuevoResultado !== apuesta.resultado) {
      manejarMarcarResultado(id, nuevoResultado);
    }
  }

  // Si se borra una apuesta de fondos Freebet que seguía Pendiente, se
  // devuelve el stake al saldo (el freebet nunca llegó a gastarse de
  // verdad). Si ya estaba resuelta (ganada/perdida/cash out) el freebet sí
  // se gastó, así que no se devuelve; si estaba Nula, ya se había
  // devuelto al marcarla, tampoco hace falta devolverlo otra vez.
  function manejarBorrarApuesta(id) {
    const apuesta = apuestas.find((a) => a.id === id);
    borrarApuesta(id);
    if (apuesta?.resultado === "pendiente") {
      if (apuesta.tipoFondos === "freebet") {
        ajustarSaldoFreebet(apuesta.casa, apuesta.stake, apuesta.categoria);
      } else if (apuesta.tipoFondos === "mixta") {
        ajustarSaldoFreebet(apuesta.casa, apuesta.stakeFreebet, apuesta.categoria);
      }
    }
  }

  // "Bets" y "+" de la barra inferior móvil: si no se estaba ya en un
  // bankroll, se entra en "apuestas" por defecto (mismo criterio que tenía
  // antes la pestaña "Registro").
  function irABets() {
    if (!esBankroll) setSeccionActiva("apuestas");
    setMostrandoFormulario(false);
  }

  function irANuevaApuesta() {
    if (!esBankroll) setSeccionActiva("apuestas");
    setMostrandoFormulario(true);
  }

  return (
    <div className="min-h-screen bg-fondo text-ink md:flex md:flex-col">
      {/* Mismo verde felt en móvil y escritorio (el color del menú lateral
          también, para que no choque un blanco ahí). Móvil: banner grande,
          centrado. Escritorio: barra más fina, nombre a la izquierda.
          "sticky" para que se quede fija arriba al hacer scroll, igual que
          el menú lateral. */}
      {/* z-[60]: por encima de los overlays de modales (ConfirmDialog,
          ApuestaItem, CashOutDialog... todos a z-50), para que el modo
          oscuro/claro y cerrar sesión de aquí se puedan seguir pulsando
          con un modal abierto, sin tener que cerrarlo primero. */}
      <div className="sticky top-0 z-[60] bg-felt px-5 sm:px-8 py-8 md:py-4 print:hidden">
        <div className="flex items-center md:justify-between">
          <button
            type="button"
            onClick={() => setSeccionActiva("inicio")}
            className="md:hidden flex-1 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <Ticket size={20} className="text-gold" />
              <span className="uppercase tracking-[0.2em] text-xs font-medium text-gold">
                Cuaderno de apuestas
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-paper">
              Hall of Bets
            </h1>
          </button>

          <button
            type="button"
            onClick={() => setSeccionActiva("inicio")}
            className="hidden md:flex items-center gap-2"
          >
            <Ticket size={22} className="text-gold" />
            <span className="font-display text-xl font-semibold text-paper">
              Hall of Bets
            </span>
          </button>

          <div className="hidden md:flex items-center gap-2">
            {/* Botón "Estadísticas" (experimento, ver PanelEstadisticas.jsx):
                estilo secundario (contorno) para no competir con el dorado
                de "+ Añadir apuesta", que sigue siendo la acción principal. */}
            <button
              type="button"
              onClick={() => setVerEstadisticasPanel(true)}
              className="flex items-center gap-1.5 border-2 border-gold/40 text-paper px-3.5 py-1.5 rounded-lg text-sm font-bold hover:border-gold transition-colors"
            >
              <PieChart size={16} />
              Estadísticas
            </button>

            {/* "+ Añadir apuesta": mismo hueco donde antes vivían modo
                oscuro/cerrar sesión (ahora en el panel lateral, ver
                SidebarNavegacion.jsx) — petición directa, más a mano aquí,
                alineado con "Hall of Bets", que abajo del todo del panel.
                Dorado fijo (el mismo rgb que --color-gold en modo oscuro,
                ver index.css) en vez de "bg-gold": ese token cambia de tono
                según el tema, y aquí se quiere siempre el mismo dorado más
                claro, también en modo claro (petición directa). */}
            <button
              type="button"
              onClick={() => setEligiendoCategoriaNueva(true)}
              className="flex items-center gap-1.5 bg-[rgb(216,179,120)] text-feltDark px-3.5 py-1.5 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity"
            >
              <Plus size={16} />
              Añadir apuesta
            </button>
          </div>
        </div>
      </div>

      <div className="md:flex md:flex-1">
        <SidebarNavegacion
          activa={seccionActiva}
          onCambiar={setSeccionActiva}
          oscuro={oscuro}
          onAlternarModoOscuro={onAlternarModoOscuro}
          onCerrarSesion={onCerrarSesion}
        />

        <div className="flex-1 md:min-w-0">
          {/* Inicio, Historial y Estadísticas usan un contenedor más ancho
              que el resto de secciones (max-w-6xl en vez de max-w-3xl) —
              rediseño de escritorio, pantalla a pantalla; el resto se
              queda igual hasta que se aborde en una fase futura. */}
          <div
            className={`mx-auto px-4 sm:px-6 py-10 pb-24 md:pb-10 space-y-6 ${
              seccionActiva === "inicio" ||
              seccionActiva === "historial" ||
              seccionActiva === "estadisticas" ||
              seccionActiva === "casas" ||
              seccionActiva === "informe" ||
              seccionActiva === "trofeos" ||
              seccionActiva === "academia" ||
              seccionActiva === "ajustes"
                ? "max-w-6xl"
                : "max-w-3xl"
            }`}
          >
            {seccionActiva === "inicio" ? (
              <PantallaInicio
                apuestas={apuestas}
                casas={casas}
                movimientos={movimientos}
                onMarcarResultado={manejarMarcarResultado}
                onMarcarResultadoPartido={manejarMarcarResultadoPartido}
                onActualizarCuotaSeleccion={actualizarCuotaSeleccion}
                onBorrar={manejarBorrarApuesta}
                onEditar={editarApuesta}
                onIrASeccion={setSeccionActiva}
              />
            ) : esBankroll ? (
              <>
                {/* Solo móvil: en escritorio ya se elige directamente en el
                    menú lateral (Apuestas y Entretenimiento por separado). */}
                <div className="md:hidden flex justify-center gap-2">
                  {Object.entries(ETIQUETAS_SECCION).map(([id, etiqueta]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSeccionActiva(id)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        seccionActiva === id
                          ? "bg-felt text-paper border-felt"
                          : "border-line text-slate hover:text-ink"
                      }`}
                    >
                      {etiqueta}
                    </button>
                  ))}
                </div>

                {/* Visible siempre, en las dos vistas de móvil (Bets y "+")
                    y en escritorio — por eso vive fuera de los dos bloques
                    de abajo, que se ocultan el uno al otro según
                    mostrandoFormulario. */}
                <TarjetaBankroll
                  etiqueta={`Bankroll ${ETIQUETAS_SECCION[seccionActiva]}`}
                  dineroReal={bankrollCategoria}
                  freebets={freebetsCategoria}
                  grande
                />

                {/* Bloque formulario: en escritorio siempre visible (como
                    antes); en móvil solo cuando se entra desde el "+" de la
                    barra inferior (ver BarraInferiorMovil.jsx). */}
                <div className={mostrandoFormulario ? "space-y-4" : "hidden md:block space-y-4"}>
                  {mostrandoFormulario && (
                    <button
                      type="button"
                      onClick={() => setMostrandoFormulario(false)}
                      className="md:hidden flex items-center gap-1 text-sm text-slate hover:text-ink transition-colors"
                    >
                      <ChevronLeft size={16} />
                      Volver
                    </button>
                  )}
                  <FormularioApuesta
                    onGuardar={manejarAgregar}
                    casas={casas}
                    movimientos={movimientos}
                    apuestas={apuestas}
                    categoria={seccionActiva}
                  />
                </div>

                {/* Bloque lista: en móvil, lo que se ve al entrar por "Bets";
                    se oculta mientras se está en el formulario ("+"). En
                    escritorio siempre visible, junto al formulario. */}
                <div className={mostrandoFormulario ? "hidden md:block space-y-6" : "space-y-6"}>
                  <FiltrosApuestas
                    casas={casas}
                    filtroCasa={filtroCasa}
                    onCambiarCasa={setFiltroCasa}
                    filtroFondos={filtroFondos}
                    onCambiarFondos={setFiltroFondos}
                    verArchivadas={verArchivadas}
                    onCambiarVerArchivadas={setVerArchivadas}
                  />
                  <RachaActual racha={racha} />
                  <ObjetivoPersonal
                    categoria={seccionActiva}
                    apuestasDelBankroll={apuestasDelBankroll}
                    objetivo={objetivos.find((o) => o.categoria === seccionActiva) ?? null}
                    onGuardar={guardarObjetivo}
                    onBorrar={borrarObjetivo}
                  />
                  <SelectorPeriodo activo={periodo} onCambiar={setPeriodo} />
                  <EstadisticasApuestas apuestas={apuestasPeriodo} />
                  <GraficoBeneficio apuestas={apuestasPeriodo} />

                  {apuestasDelBankroll.length > 0 && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setConfirmandoBorrarTodo(true)}
                        className="flex items-center gap-1.5 text-xs font-medium text-lose hover:underline"
                      >
                        <Trash2 size={14} />
                        Borrar todas las apuestas de {ETIQUETAS_SECCION[seccionActiva]}
                      </button>
                    </div>
                  )}
                  <ListaApuestas
                    apuestas={apuestasFiltradas}
                    casas={casas}
                    movimientos={movimientos}
                    todasApuestas={apuestas}
                    onMarcarResultado={manejarMarcarResultado}
                    onMarcarResultadoPartido={manejarMarcarResultadoPartido}
                    onActualizarCuotaSeleccion={actualizarCuotaSeleccion}
                    onBorrar={manejarBorrarApuesta}
                    onEditar={editarApuesta}
                  />
                </div>

                <ConfirmDialog
                  abierto={confirmandoBorrarTodo}
                  titulo="Borrar todas las apuestas"
                  mensaje={`Vas a borrar las ${apuestasDelBankroll.length} apuestas de "${ETIQUETAS_SECCION[seccionActiva]}". Esta acción no se puede deshacer.`}
                  onConfirmar={manejarBorrarTodo}
                  onCancelar={() => setConfirmandoBorrarTodo(false)}
                />
              </>
            ) : seccionActiva === "historial" ? (
              <Historial
                apuestas={apuestas}
                casas={casas}
                movimientos={movimientos}
                onMarcarResultado={manejarMarcarResultado}
                onMarcarResultadoPartido={manejarMarcarResultadoPartido}
                onActualizarCuotaSeleccion={actualizarCuotaSeleccion}
                onBorrar={manejarBorrarApuesta}
                onEditar={editarApuesta}
              />
            ) : seccionActiva === "trofeos" ? (
              <SalaTrofeos trofeos={trofeos} />
            ) : seccionActiva === "casas" ? (
              <ListadoCasas
                casas={casas}
                onAgregarCasa={agregarCasa}
                onBorrarCasa={borrarCasa}
                movimientos={movimientos}
                apuestas={apuestas}
                onAgregarMovimiento={agregarMovimiento}
                onBorrarMovimiento={borrarMovimiento}
                onBorrarTodosMovimientos={borrarTodosMovimientos}
                onAjustarSaldoFreebet={ajustarSaldoFreebet}
              />
            ) : seccionActiva === "informe" ? (
              <InformeProfesional apuestas={apuestas} />
            ) : seccionActiva === "ajustes" ? (
              <Ajustes
                userId={userId}
                fechaAltaCuenta={fechaAltaCuenta}
                apuestas={apuestas}
                movimientos={movimientos}
                onArchivarApuestas={archivarApuestasPorRango}
                onArchivarMovimientos={archivarMovimientosPorRango}
                ultimaCopia={ultimaCopia}
                onCopiaRealizada={registrarCopiaRealizada}
              />
            ) : seccionActiva === "academia" ? (
              <Academia />
            ) : (
              <EstadisticasDashboard
                apuestas={apuestas}
                movimientos={movimientos}
                casas={casas}
                oscuro={oscuro}
                onMarcarResultado={manejarMarcarResultado}
                onMarcarResultadoPartido={manejarMarcarResultadoPartido}
                onActualizarCuotaSeleccion={actualizarCuotaSeleccion}
                onBorrar={manejarBorrarApuesta}
                onEditar={editarApuesta}
              />
            )}
          </div>

          <NotificacionTrofeo trofeo={notificacion} onCerrar={cerrarNotificacion} />
        </div>
      </div>

      <div className="md:hidden">
        <MenuSecundario
          abierto={masAbierto}
          onCerrar={() => setMasAbierto(false)}
          activa={seccionActiva}
          onCambiar={setSeccionActiva}
          oscuro={oscuro}
          onAlternarModoOscuro={onAlternarModoOscuro}
          onCerrarSesion={onCerrarSesion}
          botonRef={masBotonRef}
        />
      </div>

      <BarraInferiorMovil
        activa={seccionActiva}
        onCambiar={setSeccionActiva}
        onIrABets={irABets}
        onIrANuevaApuesta={irANuevaApuesta}
        mostrandoFormulario={mostrandoFormulario}
        onAbrirMas={() => setMasAbierto((actual) => !actual)}
        masAbierto={masAbierto}
        masBotonRef={masBotonRef}
      />

      {/* "+ Añadir apuesta" del panel lateral (solo escritorio): primero
          elegir el bankroll, mismo patrón de overlay que ConfirmDialog.jsx
          con dos botones en vez de confirmar/cancelar. */}
      {eligiendoCategoriaNueva && (
        <div
          className="hidden md:flex fixed inset-0 bg-black/50 items-center justify-center px-4 z-50"
          onClick={() => setEligiendoCategoriaNueva(false)}
        >
          <div
            className="bg-surface border border-line rounded-xl p-6 max-w-sm w-full space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-semibold text-ink">Añadir apuesta</h3>
            <p className="text-sm text-slate">¿En qué bankroll la registramos?</p>
            <div className="space-y-2">
              {Object.entries(ETIQUETAS_SECCION).map(([id, etiqueta]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setCategoriaNuevaApuesta(id);
                    setEligiendoCategoriaNueva(false);
                  }}
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-line text-left text-sm font-semibold text-ink hover:border-gold hover:bg-gold/5 transition-colors"
                >
                  {etiqueta}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setEligiendoCategoriaNueva(false)}
              className="w-full px-4 py-2 rounded-lg text-sm font-medium text-slate hover:text-ink transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <PanelLateral abierto={!!categoriaNuevaApuesta} onCerrar={() => setCategoriaNuevaApuesta(null)}>
        {categoriaNuevaApuesta && (
          <div className="p-4 sm:p-5">
            <FormularioApuesta
              casas={casas}
              movimientos={movimientos}
              apuestas={apuestas}
              categoria={categoriaNuevaApuesta}
              onGuardar={(datos) => {
                manejarAgregar(datos, categoriaNuevaApuesta);
                setCategoriaNuevaApuesta(null);
              }}
              onCancelar={() => setCategoriaNuevaApuesta(null)}
            />
          </div>
        )}
      </PanelLateral>

      <PanelLateral abierto={verEstadisticasPanel} onCerrar={() => setVerEstadisticasPanel(false)}>
        <PanelEstadisticas
          apuestas={apuestas}
          movimientos={movimientos}
          casas={casas}
          oscuro={oscuro}
          onCerrar={() => setVerEstadisticasPanel(false)}
        />
      </PanelLateral>
    </div>
  );
}
