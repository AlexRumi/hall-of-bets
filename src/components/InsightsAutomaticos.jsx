import { Sparkles } from "lucide-react";
import {
  calcularDesglosePorCasa,
  calcularInformeMensual,
  calcularRachaActual,
} from "../utils/apuestas";
import { calcularDesglosePorDeporte } from "../utils/estadisticas";

function formatearMes(claveMes) {
  const [anio, mes] = claveMes.split("-").map(Number);
  const texto = new Date(anio, mes - 1, 1).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Frases sueltas derivadas de cálculos que ya existen — sin narrativa ni
// comparación entre periodos, eso lo hace la fase 19 (Informe profesional).
export default function InsightsAutomaticos({ apuestas }) {
  const frases = [];

  const racha = calcularRachaActual(apuestas);
  if (racha >= 3) {
    frases.push(`Llevas ${racha} apuestas ganadas seguidas.`);
  }

  const mejorCasa = calcularDesglosePorCasa(apuestas).filter(
    (c) => c.numApuestas >= 3
  )[0];
  if (mejorCasa && mejorCasa.beneficio > 0) {
    frases.push(
      `Tu casa más rentable es ${mejorCasa.casa}, con ${mejorCasa.beneficio.toFixed(
        2
      )}€ de beneficio.`
    );
  }

  const mejorDeporte = calcularDesglosePorDeporte(apuestas).filter(
    (d) => d.numApuestas >= 3
  )[0];
  if (mejorDeporte && mejorDeporte.beneficio > 0) {
    frases.push(
      `En ${mejorDeporte.deporte} llevas ${mejorDeporte.beneficio.toFixed(
        2
      )}€ de beneficio, tu mejor deporte.`
    );
  }

  const meses = calcularInformeMensual(apuestas).filter((m) => m.numApuestas > 0);
  const mejorMes = [...meses].sort((a, b) => b.beneficio - a.beneficio)[0];
  if (mejorMes && mejorMes.beneficio > 0) {
    frases.push(
      `Tu mejor mes fue ${formatearMes(mejorMes.mes)}, con ${mejorMes.beneficio.toFixed(
        2
      )}€ de beneficio.`
    );
  }

  return (
    <div className="bg-surface border border-line rounded-xl p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold text-ink mb-4 flex items-center gap-2">
        <Sparkles size={18} className="text-gold" />
        Insights
      </h2>

      {frases.length === 0 ? (
        <p className="text-sm text-slate">
          Todavía no hay suficientes datos para sacar conclusiones.
        </p>
      ) : (
        <ul className="space-y-2">
          {frases.map((frase, i) => (
            <li key={i} className="text-sm text-ink flex items-start gap-2">
              <span className="text-gold mt-0.5">•</span>
              {frase}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
