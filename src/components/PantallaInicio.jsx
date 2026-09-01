import { calcularEstadisticas, calcularRachaActual, todasPendientes } from "../utils/apuestas";
import { calcularBankrollPorCasa, redondearCentimos } from "../utils/movimientos";
import ListaApuestas from "./ListaApuestas";
import AvisoPendientes from "./AvisoPendientes";

// Resumen de bienvenida: solo compone datos que ya se calculan en otras
// secciones (ningún cálculo nuevo), combinando Apuestas + Entretenimiento.
// El único acceso directo a otra sección es el del aviso de pendientes,
// porque es una acción, no navegación normal — lleva a Historial con el
// filtro "Pendientes" ya puesto, combinando los dos bankrolls (antes
// llevaba a un solo bankroll, mezclado con el resto de apuestas).
export default function PantallaInicio({
  apuestas,
  casas,
  movimientos,
  onMarcarResultado,
  onAjustarGanancia,
  onMarcarResultadoPartido,
  onActualizarCuotaSeleccion,
  onBorrar,
  onAbrirEdicion,
  onVerPendientes,
}) {
  const stats = calcularEstadisticas(apuestas);
  const racha = calcularRachaActual(apuestas);
  const bankrollTotal = redondearCentimos(
    calcularBankrollPorCasa(movimientos, apuestas).reduce((suma, b) => suma + b.bankroll, 0)
  );
  const pendientes = todasPendientes(apuestas);
  // "apuestas" ya viene ordenado de más reciente a más antigua.
  const ultimas = apuestas.slice(0, 5);

  return (
    <div className="space-y-4">
      <AvisoPendientes pendientes={pendientes} onVerPendientes={onVerPendientes} />

      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="bg-surface border border-line rounded-xl p-4 text-center">
          <p className="text-xs text-slate">Bankroll total</p>
          <p className="font-mono text-xl font-bold text-goldDark">
            {bankrollTotal.toFixed(2)}€
          </p>
        </div>
        {/* Dinero real de apuestas todavía pendientes (mismo dato que ya
            existía en el panel de Estadísticas, "En juego") — junto al
            Bankroll de arriba, para ver de un vistazo cuánto de lo tuyo
            está jugado ahora mismo, ya que ese dinero ya no cuenta en el
            Bankroll (ver calcularBankrollPorCasa en utils/movimientos.js). */}
        <div className="bg-surface border border-line rounded-xl p-4 text-center">
          <p className="text-xs text-slate">En juego</p>
          <p className="font-mono text-xl font-bold text-gold">
            {stats.stakePendienteReal.toFixed(2)}€
          </p>
        </div>
        {/* Freebet en juego, aparte del dinero real de arriba (petición
            directa: no mezclarlos en una sola cifra, mismo criterio que ya
            separa "Dinero real"/"Freebets" en el resto de la app). */}
        <div className="bg-surface border border-line rounded-xl p-4 text-center">
          <p className="text-xs text-slate">En juego (freebet)</p>
          <p className="font-mono text-xl font-bold text-gold">
            {stats.stakePendienteFreebet.toFixed(2)}€
          </p>
        </div>
        <div className="bg-surface border border-line rounded-xl p-4 text-center">
          <p className="text-xs text-slate">Beneficio</p>
          <p
            className={`font-mono text-xl font-bold ${
              stats.beneficio > 0
                ? "text-win"
                : stats.beneficio < 0
                ? "text-lose"
                : "text-ink"
            }`}
          >
            {stats.beneficio > 0 ? "+" : ""}
            {stats.beneficio.toFixed(2)}€
          </p>
        </div>
        <div className="bg-surface border border-line rounded-xl p-4 text-center">
          <p className="text-xs text-slate">Yield</p>
          <p
            className={`font-mono text-xl font-bold ${
              stats.yieldPct > 0
                ? "text-win"
                : stats.yieldPct < 0
                ? "text-lose"
                : "text-ink"
            }`}
          >
            {stats.yieldPct > 0 ? "+" : ""}
            {stats.yieldPct.toFixed(2)}%
          </p>
        </div>
        <div className="bg-surface border border-line rounded-xl p-4 text-center">
          <p className="text-xs text-slate">Racha actual</p>
          <p className="font-mono text-xl font-bold text-gold">{racha}</p>
        </div>
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold text-ink mb-2">
          Últimas apuestas
        </h2>
        <ListaApuestas
          apuestas={ultimas}
          casas={casas}
          movimientos={movimientos}
          todasApuestas={apuestas}
          onMarcarResultado={onMarcarResultado}
          onAjustarGanancia={onAjustarGanancia}
          onMarcarResultadoPartido={onMarcarResultadoPartido}
          onActualizarCuotaSeleccion={onActualizarCuotaSeleccion}
          onBorrar={onBorrar}
          onAbrirEdicion={onAbrirEdicion}
          agrupada={false}
          denso
        />
      </div>
    </div>
  );
}
