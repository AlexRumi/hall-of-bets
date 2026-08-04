import { useEffect, useState } from "react";
import { Ticket, Trash2 } from "lucide-react";
import { useApuestas } from "./hooks/useApuestas";
import { useCasas } from "./hooks/useCasas";
import { usePromociones } from "./hooks/usePromociones";
import { useTrofeos } from "./hooks/useTrofeos";
import { calcularRachaActual, filtrarPorPeriodo } from "./utils/apuestas";
import FormularioApuesta from "./components/FormularioApuesta";
import ListaApuestas from "./components/ListaApuestas";
import SelectorSeccion from "./components/SelectorSeccion";
import FiltrosApuestas from "./components/FiltrosApuestas";
import SelectorPeriodo from "./components/SelectorPeriodo";
import RachaActual from "./components/RachaActual";
import EstadisticasApuestas from "./components/EstadisticasApuestas";
import GraficoBeneficio from "./components/GraficoBeneficio";
import PromocionesSection from "./components/PromocionesSection";
import SalaTrofeos from "./components/SalaTrofeos";
import ListadoCasas from "./components/ListadoCasas";
import InformeMensual from "./components/InformeMensual";
import DesgloseCasas from "./components/DesgloseCasas";
import ConfirmDialog from "./components/ConfirmDialog";
import NotificacionTrofeo from "./components/NotificacionTrofeo";
import MenuSecundario from "./components/MenuSecundario";

const ETIQUETAS_SECCION = {
  apuestas: "Apuestas",
  entretenimiento: "Entretenimiento",
};

export default function App() {
  const { apuestas, agregarApuesta, marcarResultado, borrarApuesta, borrarTodoBankroll } =
    useApuestas();
  const { casas, agregarCasa, borrarCasa } = useCasas();
  const {
    promociones,
    agregarPromocion,
    resolverPromocion,
    borrarPromocion,
    borrarTodasPromociones,
  } = usePromociones();
  // Los trofeos se calculan sobre todas las apuestas y promociones, sin
  // importar la sección que se esté viendo, para que la notificación de un
  // trofeo nuevo pueda saltar aunque no estés en la pestaña de Trofeos.
  const { trofeos, notificacion, cerrarNotificacion } = useTrofeos(
    apuestas,
    promociones
  );
  const [seccionActiva, setSeccionActiva] = useState("apuestas");
  const [filtroCasa, setFiltroCasa] = useState("todas");
  const [filtroFondos, setFiltroFondos] = useState("todas");
  const [periodo, setPeriodo] = useState("todo");
  const [confirmandoBorrarTodo, setConfirmandoBorrarTodo] = useState(false);

  // Siembra la lista gestionable de casas con los nombres ya usados en
  // apuestas de fases anteriores, para no perder ese historial.
  useEffect(() => {
    if (casas.length > 0 || apuestas.length === 0) return;
    const nombresUnicos = [...new Set(apuestas.map((a) => a.casa))];
    nombresUnicos.forEach((nombre) => agregarCasa({ nombre }));
  }, [apuestas, casas, agregarCasa]);

  // Cada bankroll (Apuestas/Entretenimiento) es independiente: solo se ven
  // (y se añaden) apuestas de la pestaña activa. Promociones no es un
  // bankroll: tiene su propia sección aparte, sin stake, cuota ni yield.
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
    <div className="min-h-screen bg-fondo text-ink">
      <div className="relative bg-felt px-5 sm:px-8 py-8 text-center">
        <div className="absolute top-4 right-4 sm:top-5 sm:right-6">
          <MenuSecundario activa={seccionActiva} onCambiar={setSeccionActiva} />
        </div>
        <div className="flex items-center justify-center gap-2 mb-1">
          <Ticket size={20} className="text-gold" />
          <span className="uppercase tracking-[0.2em] text-xs font-medium text-gold">
            Cuaderno de apuestas
          </span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-paper">
          Hall of Bets
        </h1>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <SelectorSeccion activa={seccionActiva} onCambiar={setSeccionActiva} />

        {esBankroll ? (
          <>
            <FormularioApuesta onAgregar={manejarAgregar} casas={casas} />
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
              onMarcarResultado={marcarResultado}
              onBorrar={borrarApuesta}
            />

            <ConfirmDialog
              abierto={confirmandoBorrarTodo}
              titulo="Borrar todas las apuestas"
              mensaje={`Vas a borrar las ${apuestasDelBankroll.length} apuestas de "${ETIQUETAS_SECCION[seccionActiva]}". Esta acción no se puede deshacer.`}
              onConfirmar={manejarBorrarTodo}
              onCancelar={() => setConfirmandoBorrarTodo(false)}
            />
          </>
        ) : seccionActiva === "promociones" ? (
          <PromocionesSection
            casas={casas}
            promociones={promociones}
            agregarPromocion={agregarPromocion}
            resolverPromocion={resolverPromocion}
            borrarPromocion={borrarPromocion}
            borrarTodasPromociones={borrarTodasPromociones}
          />
        ) : seccionActiva === "trofeos" ? (
          <SalaTrofeos trofeos={trofeos} />
        ) : seccionActiva === "casas" ? (
          <ListadoCasas
            casas={casas}
            onAgregarCasa={agregarCasa}
            onBorrarCasa={borrarCasa}
          />
        ) : seccionActiva === "informe" ? (
          <InformeMensual apuestas={apuestas} />
        ) : (
          <DesgloseCasas apuestas={apuestas} casas={casas} />
        )}
      </div>

      <NotificacionTrofeo trofeo={notificacion} onCerrar={cerrarNotificacion} />
    </div>
  );
}
