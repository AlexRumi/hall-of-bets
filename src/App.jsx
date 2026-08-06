import { useEffect, useState } from "react";
import { Ticket, Trash2, LogOut } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { useApuestas } from "./hooks/useApuestas";
import { useCasas } from "./hooks/useCasas";
import { useTrofeos } from "./hooks/useTrofeos";
import { useMovimientos } from "./hooks/useMovimientos";
import { calcularRachaActual, filtrarPorPeriodo } from "./utils/apuestas";
import PantallaLogin from "./components/PantallaLogin";
import PantallaInicio from "./components/PantallaInicio";
import FormularioApuesta from "./components/FormularioApuesta";
import ListaApuestas from "./components/ListaApuestas";
import FiltrosApuestas from "./components/FiltrosApuestas";
import SelectorPeriodo from "./components/SelectorPeriodo";
import RachaActual from "./components/RachaActual";
import EstadisticasApuestas from "./components/EstadisticasApuestas";
import GraficoBeneficio from "./components/GraficoBeneficio";
import SalaTrofeos from "./components/SalaTrofeos";
import ListadoCasas from "./components/ListadoCasas";
import InformeProfesional from "./components/InformeProfesional";
import EstadisticasDashboard from "./components/EstadisticasDashboard";
import Ajustes from "./components/Ajustes";
import Academia from "./components/Academia";
import ConfirmDialog from "./components/ConfirmDialog";
import NotificacionTrofeo from "./components/NotificacionTrofeo";
import MenuSecundario from "./components/MenuSecundario";
import SidebarNavegacion from "./components/SidebarNavegacion";
import BarraInferiorMovil from "./components/BarraInferiorMovil";
import SelectorModoOscuro from "./components/SelectorModoOscuro";
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

  if (comprobandoSesion) {
    return (
      <div className="min-h-screen bg-fondo flex items-center justify-center">
        <p className="text-sm text-slate">Cargando…</p>
      </div>
    );
  }

  if (!sesion) {
    return (
      <PantallaLogin
        onIniciarSesion={iniciarSesion}
        oscuro={oscuro}
        onAlternarModoOscuro={alternar}
      />
    );
  }

  return (
    <AppAutenticada
      userId={sesion.user.id}
      onCerrarSesion={cerrarSesion}
      oscuro={oscuro}
      onAlternarModoOscuro={alternar}
    />
  );
}

function AppAutenticada({ userId, onCerrarSesion, oscuro, onAlternarModoOscuro }) {
  const {
    apuestas,
    agregarApuesta,
    editarApuesta,
    marcarResultado,
    borrarApuesta,
    borrarTodoBankroll,
  } = useApuestas(userId);
  const { casas, agregarCasa, borrarCasa } = useCasas(userId);
  // Los trofeos se calculan sobre todas las apuestas, sin importar la
  // sección que se esté viendo, para que la notificación de un trofeo nuevo
  // pueda saltar aunque no estés en la pestaña de Trofeos.
  const { trofeos, notificacion, cerrarNotificacion } = useTrofeos(apuestas);
  const {
    movimientos,
    agregarMovimiento,
    borrarMovimiento,
    borrarTodosMovimientos,
  } = useMovimientos(userId);
  const [seccionActiva, setSeccionActiva] = useState("inicio");
  const [filtroCasa, setFiltroCasa] = useState("todas");
  const [filtroFondos, setFiltroFondos] = useState("todas");
  const [periodo, setPeriodo] = useState("todo");
  const [confirmandoBorrarTodo, setConfirmandoBorrarTodo] = useState(false);

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
  // (y se añaden) apuestas de la pestaña activa.
  const apuestasDelBankroll = apuestas.filter(
    (apuesta) => apuesta.categoria === seccionActiva
  );

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

  function manejarAgregar(datos) {
    agregarApuesta({ ...datos, categoria: seccionActiva });
  }

  function manejarBorrarTodo() {
    borrarTodoBankroll(seccionActiva);
    setConfirmandoBorrarTodo(false);
  }

  return (
    <div className="min-h-screen bg-fondo text-ink md:flex md:flex-col">
      {/* Mismo verde felt en móvil y escritorio (el color del menú lateral
          también, para que no choque un blanco ahí). Móvil: banner grande,
          centrado. Escritorio: barra más fina, nombre a la izquierda.
          "sticky" para que se quede fija arriba al hacer scroll, igual que
          el menú lateral. */}
      <div className="sticky top-0 z-30 bg-felt px-5 sm:px-8 py-8 md:py-4">
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

          <div className="flex items-center gap-1">
            <div className="hidden md:block">
              <SelectorModoOscuro oscuro={oscuro} onAlternar={onAlternarModoOscuro} />
            </div>
            <button
              type="button"
              onClick={onCerrarSesion}
              aria-label="Cerrar sesión"
              className="hidden md:flex p-2 rounded-full text-paper hover:bg-white/10 transition-colors"
            >
              <LogOut size={18} />
            </button>
            <div className="md:hidden">
              <MenuSecundario
                activa={seccionActiva}
                onCambiar={setSeccionActiva}
                oscuro={oscuro}
                onAlternarModoOscuro={onAlternarModoOscuro}
                onCerrarSesion={onCerrarSesion}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="md:flex md:flex-1">
        <SidebarNavegacion activa={seccionActiva} onCambiar={setSeccionActiva} />

        <div className="flex-1 md:min-w-0">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 pb-24 md:pb-10 space-y-6">
            {seccionActiva === "inicio" ? (
              <PantallaInicio
                apuestas={apuestas}
                casas={casas}
                movimientos={movimientos}
                onMarcarResultado={marcarResultado}
                onBorrar={borrarApuesta}
                onEditar={editarApuesta}
              />
            ) : esBankroll ? (
              <>
                <FormularioApuesta
                  onGuardar={manejarAgregar}
                  casas={casas}
                  movimientos={movimientos}
                  apuestas={apuestas}
                />
                <FiltrosApuestas
                  casas={casas}
                  filtroCasa={filtroCasa}
                  onCambiarCasa={setFiltroCasa}
                  filtroFondos={filtroFondos}
                  onCambiarFondos={setFiltroFondos}
                />
                <RachaActual racha={racha} />
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
                  onMarcarResultado={marcarResultado}
                  onBorrar={borrarApuesta}
                  onEditar={editarApuesta}
                />

                <ConfirmDialog
                  abierto={confirmandoBorrarTodo}
                  titulo="Borrar todas las apuestas"
                  mensaje={`Vas a borrar las ${apuestasDelBankroll.length} apuestas de "${ETIQUETAS_SECCION[seccionActiva]}". Esta acción no se puede deshacer.`}
                  onConfirmar={manejarBorrarTodo}
                  onCancelar={() => setConfirmandoBorrarTodo(false)}
                />
              </>
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
              />
            ) : seccionActiva === "informe" ? (
              <InformeProfesional apuestas={apuestas} />
            ) : seccionActiva === "ajustes" ? (
              <Ajustes userId={userId} />
            ) : seccionActiva === "academia" ? (
              <Academia />
            ) : (
              <EstadisticasDashboard
                apuestas={apuestas}
                movimientos={movimientos}
                casas={casas}
                oscuro={oscuro}
              />
            )}
          </div>

          <NotificacionTrofeo trofeo={notificacion} onCerrar={cerrarNotificacion} />
        </div>
      </div>

      <BarraInferiorMovil activa={seccionActiva} onCambiar={setSeccionActiva} />
    </div>
  );
}
