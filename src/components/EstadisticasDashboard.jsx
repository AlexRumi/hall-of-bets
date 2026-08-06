import KpisEstadisticas from "./KpisEstadisticas";
import GraficoEvolucion from "./GraficoEvolucion";
import GraficoDistribucionResultados from "./GraficoDistribucionResultados";
import GraficoBeneficioMensual from "./GraficoBeneficioMensual";
import RachasYExtremos from "./RachasYExtremos";
import GraficoBarraDivergente from "./GraficoBarraDivergente";
import CalendarioActividad from "./CalendarioActividad";
import InsightsAutomaticos from "./InsightsAutomaticos";
import { calcularDesglosePorCasa } from "../utils/apuestas";
import { calcularBankrollPorCasa } from "../utils/movimientos";
import { calcularBeneficioPorRangoCuota, calcularDesglosePorDeporte } from "../utils/estadisticas";

const FORMATO_PCT = (v) => `${v > 0 ? "+" : ""}${v.toFixed(2)}%`;

export default function EstadisticasDashboard({ apuestas, movimientos, oscuro }) {
  // "ROI por deporte" no tiene un concepto de ingresos propio (los ingresos
  // van ligados a la casa, no al deporte): se usa el yield (beneficio /
  // stake) como mejor aproximación disponible.
  const roiPorDeporte = calcularDesglosePorDeporte(apuestas)
    .filter((d) => d.numApuestas > 0)
    .map((d) => ({ etiqueta: d.deporte, valor: d.yieldPct }));

  // "ROI por casa" sí puede ser el ROI real (beneficio / ingresos), como en
  // la sección Casas de apuestas.
  const roiPorCasa = calcularBankrollPorCasa(movimientos, apuestas)
    .filter((c) => c.ingresos > 0)
    .map((c) => ({ etiqueta: c.casa, valor: c.roiPct }));

  const beneficioPorCuota = calcularBeneficioPorRangoCuota(apuestas)
    .filter((r) => r.numApuestas > 0)
    .map((r) => ({ etiqueta: r.rango, valor: r.beneficio }));

  return (
    <div className="space-y-4">
      <KpisEstadisticas apuestas={apuestas} movimientos={movimientos} />
      <GraficoEvolucion apuestas={apuestas} oscuro={oscuro} />
      <GraficoDistribucionResultados apuestas={apuestas} oscuro={oscuro} />
      <GraficoBeneficioMensual apuestas={apuestas} oscuro={oscuro} />
      <RachasYExtremos apuestas={apuestas} />
      <GraficoBarraDivergente
        titulo="ROI por deporte"
        datos={roiPorDeporte}
        oscuro={oscuro}
        formatoValor={FORMATO_PCT}
        mensajeVacio="Todavía no hay suficientes apuestas por deporte."
      />
      <GraficoBarraDivergente
        titulo="ROI por casa"
        datos={roiPorCasa}
        oscuro={oscuro}
        formatoValor={FORMATO_PCT}
        mensajeVacio="Todavía no hay ingresos registrados en ninguna casa."
      />
      <GraficoBarraDivergente
        titulo="Beneficio por rango de cuota"
        datos={beneficioPorCuota}
        oscuro={oscuro}
        mensajeVacio="Todavía no hay apuestas resueltas suficientes."
      />
      <CalendarioActividad apuestas={apuestas} />
      <InsightsAutomaticos apuestas={apuestas} />
    </div>
  );
}
