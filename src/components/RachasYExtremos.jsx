import { calcularBeneficio, calcularRachaActual } from "../utils/apuestas";
import { calcularMejorYPeorApuesta, calcularRachas } from "../utils/estadisticas";

function TarjetaApuesta({ titulo, apuesta, color }) {
  if (!apuesta) return null;
  const beneficio = calcularBeneficio(apuesta);

  return (
    <div className="bg-surface border border-line rounded-xl p-4 space-y-1">
      <p className="text-xs text-slate">{titulo}</p>
      <p className="text-sm font-bold text-ink truncate">
        {apuesta.selecciones[0].evento}
      </p>
      <p className="text-xs text-slate">
        {apuesta.casa} · {apuesta.fecha}
      </p>
      <p className={`font-mono text-lg font-bold ${color}`}>
        {beneficio > 0 ? "+" : ""}
        {beneficio.toFixed(2)}€
      </p>
    </div>
  );
}

export default function RachasYExtremos({ apuestas }) {
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
          <TarjetaApuesta titulo="Mejor apuesta" apuesta={mejor} color="text-win" />
          <TarjetaApuesta titulo="Peor apuesta" apuesta={peor} color="text-lose" />
        </div>
      )}
    </div>
  );
}
