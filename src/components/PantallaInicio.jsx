import { calcularEstadisticas, calcularRachaActual, pendientesAntiguas } from "../utils/apuestas";
import { calcularBankrollPorCasa } from "../utils/movimientos";
import ListaApuestas from "./ListaApuestas";
import AvisoPendientes from "./AvisoPendientes";
import AvisoBonos from "./AvisoBonos";

// Resumen de bienvenida: solo compone datos que ya se calculan en otras
// secciones (ningún cálculo nuevo), combinando Apuestas + Entretenimiento.
// El único acceso directo a otra sección es el de los avisos (pendientes
// antiguas, bonos), porque son una acción, no navegación normal.
export default function PantallaInicio({
  apuestas,
  casas,
  movimientos,
  bonos,
  onMarcarResultado,
  onBorrar,
  onEditar,
  onIrASeccion,
}) {
  const stats = calcularEstadisticas(apuestas);
  const racha = calcularRachaActual(apuestas);
  const bankrollTotal = calcularBankrollPorCasa(movimientos, apuestas).reduce(
    (suma, b) => suma + b.bankroll,
    0
  );
  const pendientes = pendientesAntiguas(apuestas);
  // "apuestas" ya viene ordenado de más reciente a más antigua.
  const ultimas = apuestas.slice(0, 5);

  return (
    <div className="space-y-4">
      <AvisoPendientes pendientes={pendientes} onIrASeccion={onIrASeccion} />
      <AvisoBonos bonos={bonos} onIrACasas={() => onIrASeccion("casas")} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface border border-line rounded-xl p-4 text-center">
          <p className="text-xs text-slate">Bankroll total</p>
          <p className="font-mono text-xl font-bold text-goldDark">
            {bankrollTotal.toFixed(2)}€
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
          bonos={bonos}
          onMarcarResultado={onMarcarResultado}
          onBorrar={onBorrar}
          onEditar={onEditar}
          agrupada={false}
        />
      </div>
    </div>
  );
}
