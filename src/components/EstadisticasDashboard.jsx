import { useState } from "react";
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

export default function EstadisticasDashboard({ apuestas, movimientos, casas, oscuro }) {
  const [filtroCasa, setFiltroCasa] = useState("todas");
  const hayFiltro = filtroCasa !== "todas";

  // Todo el dashboard se recalcula sobre las apuestas (y movimientos, para
  // el bankroll) de la casa elegida, en vez de sobre todas.
  const apuestasFiltradas = hayFiltro
    ? apuestas.filter((a) => a.casa === filtroCasa)
    : apuestas;
  const movimientosFiltrados = hayFiltro
    ? movimientos.filter((m) => m.casa === filtroCasa)
    : movimientos;

  // "ROI por deporte" no tiene un concepto de ingresos propio (los ingresos
  // van ligados a la casa, no al deporte): se usa el yield (beneficio /
  // stake) como mejor aproximación disponible.
  const roiPorDeporte = calcularDesglosePorDeporte(apuestasFiltradas)
    .filter((d) => d.numApuestas > 0)
    .map((d) => ({ etiqueta: d.deporte, valor: d.yieldPct }));

  // "ROI por casa" sí puede ser el ROI real (beneficio / ingresos), como en
  // la sección Casas de apuestas. Con una casa ya seleccionada no aporta
  // nada (solo saldría una barra, y el KPI "ROI" de arriba ya es ese dato).
  const roiPorCasa = calcularBankrollPorCasa(movimientosFiltrados, apuestasFiltradas)
    .filter((c) => c.ingresos > 0)
    .map((c) => ({ etiqueta: c.casa, valor: c.roiPct }));

  const beneficioPorCuota = calcularBeneficioPorRangoCuota(apuestasFiltradas)
    .filter((r) => r.numApuestas > 0)
    .map((r) => ({ etiqueta: r.rango, valor: r.beneficio }));

  return (
    <div className="space-y-4">
      {casas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFiltroCasa("todas")}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-colors ${
              filtroCasa === "todas"
                ? "bg-felt text-paper border-felt"
                : "border-gold/40 text-ink hover:border-gold"
            }`}
          >
            Estadísticas Totales
          </button>
          {casas.map((casa) => (
            <button
              key={casa.nombre}
              type="button"
              onClick={() => setFiltroCasa(casa.nombre)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-colors ${
                filtroCasa === casa.nombre
                  ? "bg-felt text-paper border-felt"
                  : "border-gold/40 text-ink hover:border-gold"
              }`}
            >
              {casa.nombre}
            </button>
          ))}
        </div>
      )}

      <KpisEstadisticas apuestas={apuestasFiltradas} movimientos={movimientosFiltrados} />
      <GraficoEvolucion apuestas={apuestasFiltradas} oscuro={oscuro} />
      <GraficoDistribucionResultados apuestas={apuestasFiltradas} oscuro={oscuro} />
      <GraficoBeneficioMensual apuestas={apuestasFiltradas} oscuro={oscuro} />
      <RachasYExtremos apuestas={apuestasFiltradas} />
      <GraficoBarraDivergente
        titulo="ROI por deporte"
        datos={roiPorDeporte}
        oscuro={oscuro}
        formatoValor={FORMATO_PCT}
        mensajeVacio="Todavía no hay suficientes apuestas por deporte."
      />
      {!hayFiltro && (
        <GraficoBarraDivergente
          titulo="ROI por casa"
          datos={roiPorCasa}
          oscuro={oscuro}
          formatoValor={FORMATO_PCT}
          mensajeVacio="Todavía no hay ingresos registrados en ninguna casa."
        />
      )}
      <GraficoBarraDivergente
        titulo="Beneficio por rango de cuota"
        datos={beneficioPorCuota}
        oscuro={oscuro}
        mensajeVacio="Todavía no hay apuestas resueltas suficientes."
      />
      <CalendarioActividad apuestas={apuestasFiltradas} />
      <InsightsAutomaticos apuestas={apuestasFiltradas} />
    </div>
  );
}
