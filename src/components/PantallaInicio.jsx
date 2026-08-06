import { Landmark, PieChart } from "lucide-react";
import { calcularEstadisticas, calcularRachaActual } from "../utils/apuestas";
import { calcularBankrollPorCasa } from "../utils/movimientos";
import ListaApuestas from "./ListaApuestas";

// Apuestas y Entretenimiento no están aquí: ya son las pestañas de arriba,
// repetirlas como acceso rápido era redundante. Estos dos sí, porque solo
// se llega a ellos desde el menú ☰.
const ACCESOS = [
  { id: "casas", etiqueta: "Casas de apuestas", Icono: Landmark },
  { id: "estadisticas", etiqueta: "Estadísticas", Icono: PieChart },
];

// Resumen de bienvenida: solo compone datos que ya se calculan en otras
// secciones (ningún cálculo nuevo), combinando Apuestas + Entretenimiento.
export default function PantallaInicio({
  apuestas,
  casas,
  movimientos,
  onCambiarSeccion,
  onMarcarResultado,
  onBorrar,
  onEditar,
}) {
  const stats = calcularEstadisticas(apuestas);
  const racha = calcularRachaActual(apuestas);
  const bankrollTotal = calcularBankrollPorCasa(movimientos, apuestas).reduce(
    (suma, b) => suma + b.bankroll,
    0
  );
  // "apuestas" ya viene ordenado de más reciente a más antigua.
  const ultimas = apuestas.slice(0, 5);

  return (
    <div className="space-y-4">
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

      <div className="flex flex-wrap gap-2 justify-center">
        {ACCESOS.map(({ id, etiqueta, Icono }) => (
          <button
            key={id}
            type="button"
            onClick={() => onCambiarSeccion(id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border border-line text-ink hover:bg-paperDim transition-colors"
          >
            <Icono size={15} />
            {etiqueta}
          </button>
        ))}
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold text-ink mb-2">
          Últimas apuestas
        </h2>
        <ListaApuestas
          apuestas={ultimas}
          casas={casas}
          onMarcarResultado={onMarcarResultado}
          onBorrar={onBorrar}
          onEditar={onEditar}
        />
      </div>
    </div>
  );
}
