import { calcularBeneficio, calcularRachaActual, agruparSeleccionesPorPartido } from "../utils/apuestas";
import { calcularMejorYPeorApuesta, calcularRachas } from "../utils/estadisticas";

function TarjetaApuesta({ titulo, apuesta, color, onAbrir }) {
  if (!apuesta) return null;
  const beneficio = calcularBeneficio(apuesta);
  // Bug real: con una combinada, mostrar solo selecciones[0].evento parecía
  // una apuesta a un único partido — mismo criterio "Combinada · N
  // partidos" que ya usan ApuestaItem.jsx/TarjetaApuestaResumen.jsx
  // (cuenta partidos, no mercados sueltos: un "multi" de un solo partido
  // con varios mercados no es una combinada).
  const numPartidos = agruparSeleccionesPorPartido(apuesta.selecciones).length;
  const descripcion =
    numPartidos > 1 ? `Combinada · ${numPartidos} partidos` : apuesta.selecciones[0].evento;

  return (
    <button
      type="button"
      onClick={() => onAbrir(apuesta.id)}
      className="w-full text-left bg-surface border border-line rounded-xl p-4 space-y-1 hover:border-gold/40 transition-colors"
    >
      <p className="text-xs text-slate">{titulo}</p>
      <p className="text-sm font-bold text-ink truncate">{descripcion}</p>
      <p className="text-xs text-slate">
        {apuesta.casa} · {apuesta.fecha}
      </p>
      <p className={`font-mono text-lg font-bold ${color}`}>
        {beneficio > 0 ? "+" : ""}
        {beneficio.toFixed(2)}€
      </p>
    </button>
  );
}

export default function RachasYExtremos({ apuestas, onAbrir }) {
  const rachaActual = calcularRachaActual(apuestas);
  const { mejorRacha, peorRacha } = calcularRachas(apuestas);
  const { mejor, peor } = calcularMejorYPeorApuesta(apuestas);

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-line rounded-xl p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-ink mb-4">
          Rachas
        </h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-slate">Actual</p>
            <p className="font-mono text-2xl font-bold text-gold">{rachaActual}</p>
          </div>
          <div>
            <p className="text-xs text-slate">Mejor</p>
            <p className="font-mono text-2xl font-bold text-win">{mejorRacha}</p>
          </div>
          <div>
            <p className="text-xs text-slate">Peor</p>
            <p className="font-mono text-2xl font-bold text-lose">{peorRacha}</p>
          </div>
        </div>
      </div>

      {(mejor || peor) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TarjetaApuesta titulo="Mejor apuesta" apuesta={mejor} color="text-win" onAbrir={onAbrir} />
          <TarjetaApuesta titulo="Peor apuesta" apuesta={peor} color="text-lose" onAbrir={onAbrir} />
        </div>
      )}
    </div>
  );
}
