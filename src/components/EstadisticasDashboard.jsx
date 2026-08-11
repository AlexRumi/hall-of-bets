import { useState } from "react";
import ApuestaItem from "./ApuestaItem";
import KpisEstadisticas from "./KpisEstadisticas";
import GraficoEvolucion from "./GraficoEvolucion";
import GraficoDistribucionResultados from "./GraficoDistribucionResultados";
import GraficoBeneficioMensual from "./GraficoBeneficioMensual";
import RachasYExtremos from "./RachasYExtremos";
import GraficoBarraDivergente from "./GraficoBarraDivergente";
import CalendarioActividad from "./CalendarioActividad";
import InsightsAutomaticos from "./InsightsAutomaticos";
import TablaEstadisticasMercado from "./TablaEstadisticasMercado";
import TablaFrecuenciaMercados from "./TablaFrecuenciaMercados";
import { calcularDesglosePorCasa, filtrarPorRango } from "../utils/apuestas";
import { calcularBankrollPorCasa } from "../utils/movimientos";
import {
  calcularBeneficioPorRangoCuota,
  calcularDesglosePorDeporte,
  calcularEstadisticasPorMercado,
  calcularFrecuenciaMercados,
} from "../utils/estadisticas";

const FORMATO_PCT = (v) => `${v > 0 ? "+" : ""}${v.toFixed(2)}%`;

const BANKROLLS = [
  { valor: "apuestas", etiqueta: "Apuestas" },
  { valor: "entretenimiento", etiqueta: "Entretenimiento" },
  { valor: "todas", etiqueta: "Todas" },
];

export default function EstadisticasDashboard({
  apuestas,
  movimientos,
  casas,
  oscuro,
  onMarcarResultado,
  onMarcarResultadoSeleccion,
  onActualizarCuotaSeleccion,
  onBorrar,
  onEditar,
}) {
  // "Mejor apuesta"/"Peor apuesta" (RachasYExtremos) se pueden abrir en el
  // mismo modal de detalle que ya usa ListaApuestas.jsx — mismo patrón
  // (guardar solo el id y buscarlo en el array completo sin filtrar, para
  // que si se marca un resultado o se edita desde aquí, el modal siempre
  // refleje el dato en vivo).
  const [apuestaAbiertaId, setApuestaAbiertaId] = useState(null);
  const apuestaAbierta = apuestas.find((a) => a.id === apuestaAbiertaId) ?? null;
  // Por defecto solo "Apuestas": las de Entretenimiento suelen ser más
  // experimentales (varios mercados en la misma apuesta, tipo bet
  // builder), y mezclarlas con las de verdad ensuciaba sobre todo el
  // desglose por tipo de mercado (una combinada de Entretenimiento con
  // Resultado + Goles + Córners solo contaba como "Resultado Final").
  const [filtroBankroll, setFiltroBankroll] = useState("apuestas");
  const [filtroCasa, setFiltroCasa] = useState("todas");
  // Fase C: archivado. "Ver también archivado" solo aplica al modo normal
  // (pastillas de casa); el modo "Rango de fechas" siempre cruza archivado
  // y activo, es justo su propósito (consultar un periodo histórico
  // completo aunque esté parcialmente archivado).
  const [incluirArchivado, setIncluirArchivado] = useState(false);
  const [verRango, setVerRango] = useState(false);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const hayFiltro = filtroCasa !== "todas";
  const rangoListo = verRango && desde && hasta;

  const apuestasDelBankroll =
    filtroBankroll === "todas" ? apuestas : apuestas.filter((a) => a.categoria === filtroBankroll);
  // Bug real: este filtro solo se aplicaba a las apuestas — "movimientos"
  // se quedó sin filtrar por bankroll desde que se escribió este dashboard,
  // porque en ese momento ni siquiera tenía columna "categoria" propia (se
  // añadió después, ver "Bankroll separado de verdad por Apuestas/
  // Entretenimiento" en CLAUDE.md). Con eso ya resuelto, el comentario que
  // había aquí ("los movimientos no tienen categoria") ya no era cierto, y
  // el "Bankroll"/"ROI" del panel de KPIs (y "ROI por casa") seguían
  // mezclando Apuestas y Entretenimiento aunque la pastilla de arriba
  // dijera "Apuestas" — así se detectó, con un ingreso solo de
  // Entretenimiento sumando igualmente al Bankroll con "Apuestas"
  // seleccionado. Ahora sí se filtra igual que las apuestas.
  const movimientosDelBankroll =
    filtroBankroll === "todas" ? movimientos : movimientos.filter((m) => m.categoria === filtroBankroll);

  // Todo el dashboard se recalcula sobre las apuestas y movimientos de la
  // casa elegida, en vez de sobre todas.
  const apuestasFiltradas = rangoListo
    ? filtrarPorRango(apuestasDelBankroll, desde, hasta)
    : (hayFiltro
        ? apuestasDelBankroll.filter((a) => a.casa === filtroCasa)
        : apuestasDelBankroll
      ).filter((a) => incluirArchivado || !a.archivado);
  const movimientosFiltrados = rangoListo
    ? filtrarPorRango(movimientosDelBankroll, desde, hasta)
    : (hayFiltro ? movimientosDelBankroll.filter((m) => m.casa === filtroCasa) : movimientosDelBankroll).filter(
        (m) => incluirArchivado || !m.archivado
      );

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

  const estadisticasPorMercado = calcularEstadisticasPorMercado(apuestasFiltradas).filter(
    (m) => m.numApuestas > 0
  );
  const roiPorMercado = estadisticasPorMercado.map((m) => ({
    etiqueta: m.etiqueta,
    valor: m.yieldPct,
  }));
  const frecuenciaMercados = calcularFrecuenciaMercados(apuestasFiltradas);

  return (
    <div className="space-y-4">
      {/* Segmented control, deliberadamente distinto de las pastillas de
          casa/rango de más abajo (contorno + fondo felt en vez de pastillas
          sueltas): es el filtro más importante de la página (decide qué
          bankroll se analiza entero), así que necesitaba su propia caja en
          vez de leerse como una fila más de pastillas — antes las dos filas
          se veían casi idénticas, pegadas una a la otra. */}
      <div className="flex items-center gap-1 bg-paperDim border border-line rounded-xl p-1">
        {BANKROLLS.map(({ valor, etiqueta }) => (
          <button
            key={valor}
            type="button"
            onClick={() => setFiltroBankroll(valor)}
            className={`flex-1 px-1 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
              filtroBankroll === valor
                ? "bg-felt text-paper shadow-sm"
                : "text-slate hover:text-ink"
            }`}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2">
        {!verRango && casas.length > 0 && (
          <>
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
          </>
        )}
        <button
          type="button"
          onClick={() => setVerRango((actual) => !actual)}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-colors ${
            verRango
              ? "bg-felt text-paper border-felt"
              : "border-gold/40 text-ink hover:border-gold"
          }`}
        >
          Rango de fechas
        </button>
      </div>

      {/* Rango libre (Fase C): pensado para consultar un periodo histórico
          completo (p.ej. un año entero ya archivado) — por eso siempre
          incluye archivado y activo a la vez, sin pasar por el checkbox
          de abajo. */}
      {verRango ? (
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-slate mb-1">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="border border-line rounded-lg px-3 py-1.5 text-sm bg-surface text-ink"
            />
          </div>
          <div>
            <label className="block text-xs text-slate mb-1">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="border border-line rounded-lg px-3 py-1.5 text-sm bg-surface text-ink"
            />
          </div>
          {!rangoListo && (
            <p className="text-xs text-slate pb-2">Elige las dos fechas para ver el rango.</p>
          )}
        </div>
      ) : (
        <label className="flex items-center gap-1.5 text-sm text-slate cursor-pointer">
          <input
            type="checkbox"
            checked={incluirArchivado}
            onChange={(e) => setIncluirArchivado(e.target.checked)}
            className="accent-gold"
          />
          Ver también archivado
        </label>
      )}

      <KpisEstadisticas apuestas={apuestasFiltradas} movimientos={movimientosFiltrados} />
      <GraficoEvolucion apuestas={apuestasFiltradas} oscuro={oscuro} />
      <GraficoDistribucionResultados apuestas={apuestasFiltradas} oscuro={oscuro} />
      <GraficoBeneficioMensual apuestas={apuestasFiltradas} oscuro={oscuro} />
      <RachasYExtremos apuestas={apuestasFiltradas} onAbrir={setApuestaAbiertaId} />
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
      {/* Las apuestas de Entretenimiento suelen ser bet builders con varios
          mercados a la vez: el dinero atribuido a "la categoría líder" (ver
          calcularEstadisticasPorMercado) sale engañoso ahí, así que estas
          dos vistas de dinero por mercado se ocultan en Entretenimiento —
          "Mercados más usados" (sin dinero, cuenta todos los mercados por
          igual) sigue viéndose siempre, esa sí tiene sentido en cualquier
          bankroll. */}
      {filtroBankroll !== "entretenimiento" && (
        <GraficoBarraDivergente
          titulo="ROI por tipo de mercado"
          datos={roiPorMercado}
          oscuro={oscuro}
          formatoValor={FORMATO_PCT}
          mensajeVacio="Todavía no hay suficientes apuestas por tipo de mercado."
        />
      )}
      {filtroBankroll !== "entretenimiento" && (
        <div className="bg-surface border border-line rounded-xl p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold text-ink mb-4">
            Estadísticas por tipo de mercado
          </h2>
          <TablaEstadisticasMercado datos={estadisticasPorMercado} />
        </div>
      )}
      <div className="bg-surface border border-line rounded-xl p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-ink mb-1">
          Mercados más usados
        </h2>
        <p className="text-xs text-slate mb-4">
          Cuenta cada mercado dentro de una apuesta, no solo el principal — sin dinero
          asociado (el beneficio no se puede repartir entre los mercados de una misma apuesta).
        </p>
        <TablaFrecuenciaMercados datos={frecuenciaMercados} />
      </div>
      <CalendarioActividad apuestas={apuestasFiltradas} />
      <InsightsAutomaticos apuestas={apuestasFiltradas} />

      {apuestaAbierta && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center px-4 pb-4 pt-36 md:pt-20 z-50"
          onClick={() => setApuestaAbiertaId(null)}
        >
          <div
            className="w-full max-w-xl max-h-[calc(100dvh-10rem)] md:max-h-[calc(100dvh-6rem)] overflow-y-auto scrollbar-oculto"
            onClick={(e) => e.stopPropagation()}
          >
            <ApuestaItem
              apuesta={apuestaAbierta}
              casas={casas}
              movimientos={movimientos}
              todasApuestas={apuestas}
              onMarcarResultado={onMarcarResultado}
              onMarcarResultadoSeleccion={onMarcarResultadoSeleccion}
              onActualizarCuotaSeleccion={onActualizarCuotaSeleccion}
              onBorrar={onBorrar}
              onEditar={onEditar}
              onCerrar={() => setApuestaAbiertaId(null)}
              soloLectura
            />
          </div>
        </div>
      )}
    </div>
  );
}
