import { useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, X } from "lucide-react";
import ApuestaItem from "./ApuestaItem";
import SelectorDesplegable from "./SelectorDesplegable";
import BotonInfoConcepto from "./BotonInfoConcepto";
import GraficoEvolucion from "./GraficoEvolucion";
import GraficoDistribucionResultados from "./GraficoDistribucionResultados";
import GraficoBeneficioMensual from "./GraficoBeneficioMensual";
import RachasYExtremos from "./RachasYExtremos";
import GraficoBarraDivergente from "./GraficoBarraDivergente";
import CalendarioActividad from "./CalendarioActividad";
import InsightsAutomaticos from "./InsightsAutomaticos";
import TablaFrecuenciaMercados from "./TablaFrecuenciaMercados";
import { calcularEstadisticas, filtrarPorPeriodo } from "../utils/apuestas";
import { calcularBankrollPorCasa, redondearCentimos } from "../utils/movimientos";
import {
  calcularBeneficioPorRangoCuota,
  calcularDesglosePorDeporte,
  calcularFrecuenciaMercados,
} from "../utils/estadisticas";

const FORMATO_PCT = (v) => `${v > 0 ? "+" : ""}${v.toFixed(2)}%`;

// "Todas" primero (a diferencia de EstadisticasDashboard.jsx, que la pone
// al final): aquí es el valor por defecto, para un vistazo rápido a los
// dos bankrolls juntos nada más abrir el panel.
const BANKROLLS = [
  { valor: "todas", etiqueta: "Todas" },
  { valor: "apuestas", etiqueta: "Apuestas" },
  { valor: "entretenimiento", etiqueta: "Entretenimiento" },
];

function Fila({ etiqueta, valor, color, conceptoId }) {
  return (
    <div className="text-center">
      <p className="text-xs text-slate flex items-center justify-center gap-1">
        {etiqueta}
        {conceptoId && <BotonInfoConcepto conceptoId={conceptoId} etiqueta={etiqueta} />}
      </p>
      <p className={`font-mono text-base font-semibold ${color ?? "text-ink"}`}>{valor}</p>
    </div>
  );
}

// Experimento pedido tras ver Bet Analytix: mismas cifras y gráficos que
// EstadisticasDashboard.jsx (misma fórmulas, mismos componentes, reutilizados
// sin cambios), pero en un panel lateral compacto en vez de una página ancha
// — una tarjeta densa de 8 filas (2 columnas, salvo el Bankroll) y un botón
// "Más estadísticas" que despliega los gráficos. No sustituye la página de
// Estadísticas ni su ítem del menú, es un segundo acceso más rápido desde la
// cabecera (ver App.jsx).
export default function PanelEstadisticas({ apuestas, movimientos, casas, oscuro, onCerrar }) {
  const [filtroBankroll, setFiltroBankroll] = useState("todas");
  const [filtroCasa, setFiltroCasa] = useState("todas");
  const [verMas, setVerMas] = useState(false);
  const [apuestaAbiertaId, setApuestaAbiertaId] = useState(null);
  const apuestaAbierta = apuestas.find((a) => a.id === apuestaAbiertaId) ?? null;

  const apuestasDelBankroll =
    filtroBankroll === "todas" ? apuestas : apuestas.filter((a) => a.categoria === filtroBankroll);
  const movimientosDelBankroll =
    filtroBankroll === "todas" ? movimientos : movimientos.filter((m) => m.categoria === filtroBankroll);

  // Sin pastilla de "Ver también archivado" en este panel (no la pidió el
  // usuario, ver plan) — se excluyen siempre, igual que hace el resto de la
  // app por defecto; para ese detalle ya está la página completa.
  const hayFiltro = filtroCasa !== "todas";
  const apuestasFiltradas = apuestasDelBankroll
    .filter((a) => !a.archivado)
    .filter((a) => !hayFiltro || a.casa === filtroCasa);
  const movimientosFiltrados = movimientosDelBankroll
    .filter((m) => !m.archivado)
    .filter((m) => !hayFiltro || m.casa === filtroCasa);

  // Bankroll (fila 1+2): igual que TarjetaBankroll en EstadisticasDashboard.jsx
  // — sobre *DelBankroll (solo filtro de categoría) y, si hay una casa
  // concreta elegida en el desplegable, acotado solo a esa casa (antes
  // sumaba siempre TODAS las casas sin importar cuál estuviera elegida,
  // petición directa tras detectar que el Bankroll no cambiaba nunca al
  // cambiar de casa).
  const bankrollsPorCasa = calcularBankrollPorCasa(movimientosDelBankroll, apuestasDelBankroll);
  const dineroReal = hayFiltro
    ? bankrollsPorCasa.find((b) => b.casa === filtroCasa)?.bankroll ?? 0
    : redondearCentimos(bankrollsPorCasa.reduce((suma, b) => suma + b.bankroll, 0));
  const freebets = casas
    .filter((c) => !hayFiltro || c.nombre === filtroCasa)
    .reduce((suma, c) => {
      if (filtroBankroll === "todas") {
        return suma + c.freebetSaldoApuestas + c.freebetSaldoEntretenimiento;
      }
      const campo = filtroBankroll === "entretenimiento" ? "freebetSaldoEntretenimiento" : "freebetSaldoApuestas";
      return suma + c[campo];
    }, 0);

  const stats = calcularEstadisticas(apuestasFiltradas);
  const statsMes = calcularEstadisticas(filtrarPorPeriodo(apuestasFiltradas, "mes"));
  const ingresosTotal = movimientosFiltrados
    .filter((m) => m.tipo === "ingreso")
    .reduce((suma, m) => suma + m.cantidad, 0);
  const roiPct = ingresosTotal ? (stats.beneficio / ingresosTotal) * 100 : 0;

  const roiPorDeporte = calcularDesglosePorDeporte(apuestasFiltradas)
    .filter((d) => d.numApuestas > 0)
    .map((d) => ({ etiqueta: d.deporte, valor: d.yieldPct }));
  const roiPorCasa = calcularBankrollPorCasa(movimientosFiltrados, apuestasFiltradas)
    .filter((c) => c.ingresos > 0)
    .map((c) => ({ etiqueta: c.casa, valor: c.roiPct }));
  const beneficioPorCuota = calcularBeneficioPorRangoCuota(apuestasFiltradas)
    .filter((r) => r.numApuestas > 0)
    .map((r) => ({ etiqueta: r.rango, valor: r.beneficio }));
  const frecuenciaMercados = calcularFrecuenciaMercados(apuestasFiltradas);

  const gruposCasa = [
    {
      opciones: [
        { valor: "todas", texto: "Estadísticas totales" },
        ...casas.map((c) => ({ valor: c.nombre, texto: c.nombre })),
      ],
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-line">
        <h2 className="font-display text-lg font-semibold text-ink">Estadísticas</h2>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          className="shrink-0 text-slate hover:text-ink transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
      <div className="flex items-center gap-1 bg-paperDim border border-line rounded-xl p-1">
        {BANKROLLS.map(({ valor, etiqueta }) => (
          <button
            key={valor}
            type="button"
            onClick={() => setFiltroBankroll(valor)}
            className={`flex-1 px-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
              filtroBankroll === valor ? "bg-felt text-paper shadow-sm" : "text-slate hover:text-ink"
            }`}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      {casas.length > 0 && (
        <SelectorDesplegable
          valor={filtroCasa}
          placeholder="Estadísticas totales"
          grupos={gruposCasa}
          onElegir={setFiltroCasa}
        />
      )}

      <div className="bg-surface border border-line rounded-xl p-5">
        <div className="text-center pb-4 border-b border-line">
          <p className="text-xs text-slate">Bankroll</p>
          <p className="font-mono text-2xl font-bold text-goldDark">
            {(dineroReal + freebets).toFixed(2)}€
          </p>
        </div>

        <div className="divide-y divide-line">
          <div className="grid grid-cols-2 gap-4 py-3">
            <Fila etiqueta="Dinero real" valor={`${dineroReal.toFixed(2)}€`} />
            <Fila etiqueta="Freebets" valor={`${freebets.toFixed(2)}€`} color="text-gold" />
          </div>
          <div className="grid grid-cols-2 gap-4 py-3">
            <Fila
              etiqueta="ROI"
              valor={`${roiPct > 0 ? "+" : ""}${roiPct.toFixed(2)}%`}
              color={roiPct > 0 ? "text-win" : roiPct < 0 ? "text-lose" : "text-ink"}
              conceptoId="roi"
            />
            <Fila
              etiqueta="Yield"
              valor={`${stats.yieldPct > 0 ? "+" : ""}${stats.yieldPct.toFixed(2)}%`}
              color={stats.yieldPct > 0 ? "text-win" : stats.yieldPct < 0 ? "text-lose" : "text-ink"}
              conceptoId="yield"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 py-3">
            <Fila etiqueta="Nº apuestas" valor={stats.numApuestas} />
            <Fila etiqueta="Cuota media" valor={stats.cuotaMedia.toFixed(2)} conceptoId="cuota" />
          </div>
          <div className="grid grid-cols-2 gap-4 py-3">
            <Fila etiqueta="Media apostada" valor={`${stats.stakeMedio.toFixed(2)}€`} conceptoId="stake" />
            <Fila etiqueta="% Acierto" valor={`${stats.aciertoPct.toFixed(0)}%`} conceptoId="win-rate" />
          </div>
          <div className="grid grid-cols-2 gap-4 py-3">
            <Fila
              etiqueta="En juego"
              valor={`${stats.stakePendienteReal.toFixed(2)}€`}
              color={stats.stakePendienteReal > 0 ? "text-gold" : "text-ink"}
            />
            <Fila etiqueta="Total apostado" valor={`${stats.stakeTotalReal.toFixed(2)}€`} conceptoId="stake" />
          </div>
          <div className="grid grid-cols-2 gap-4 py-3">
            <Fila
              etiqueta="Beneficio (mes)"
              valor={`${statsMes.beneficio > 0 ? "+" : ""}${statsMes.beneficio.toFixed(2)}€`}
              color={statsMes.beneficio > 0 ? "text-win" : statsMes.beneficio < 0 ? "text-lose" : "text-ink"}
            />
            <Fila
              etiqueta="Beneficio"
              valor={`${stats.beneficio > 0 ? "+" : ""}${stats.beneficio.toFixed(2)}€`}
              color={stats.beneficio > 0 ? "text-win" : stats.beneficio < 0 ? "text-lose" : "text-ink"}
            />
          </div>
        </div>

        {stats.stakeTotalFreebet > 0 && (
          <p className="text-xs text-slate mt-3 pt-3 border-t border-line">
            Además, {stats.stakeTotalFreebet.toFixed(2)}€ en stake de freebets (no cuenta en el
            stake total ni en el yield)
            {stats.stakePendienteFreebet > 0 &&
              `, de los cuales ${stats.stakePendienteFreebet.toFixed(2)}€ siguen en juego`}
            .
          </p>
        )}

        <button
          type="button"
          onClick={() => setVerMas((actual) => !actual)}
          className="w-full mt-4 pt-3 border-t border-line flex items-center justify-center gap-1.5 text-sm font-semibold text-gold hover:text-goldDark transition-colors"
        >
          Más estadísticas
          <ChevronDown size={16} className={`transition-transform ${verMas ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Siempre en una sola columna: a diferencia de EstadisticasDashboard.jsx
          (página ancha, "lg:grid-cols-2"), este panel tiene un ancho fijo
          (max-w-xl) independiente del ancho real de la ventana — esa rejilla
          se activaría igual en escritorio y apretaría 2 columnas en un hueco
          estrecho. */}
      {verMas && (
        <div className="space-y-4">
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
          <CalendarioActividad apuestas={apuestasFiltradas} />
          <div className="bg-surface border border-line rounded-xl p-5 sm:p-6">
            <h2 className="font-display text-lg font-semibold text-ink mb-1">Mercados más usados</h2>
            <p className="text-xs text-slate mb-4">
              Cuenta cada mercado dentro de una apuesta, no solo el principal — sin dinero
              asociado (el beneficio no se puede repartir entre los mercados de una misma apuesta).
            </p>
            <TablaFrecuenciaMercados datos={frecuenciaMercados} />
          </div>
          <InsightsAutomaticos apuestas={apuestasFiltradas} />
        </div>
      )}

      {/* Portal a document.body: mismo motivo que SelectorDesplegable.jsx —
          este panel vive dentro de un antecesor que anima con "transform"
          (PanelLateral.jsx), lo que convierte a ese antecesor en el
          "contenedor" de cualquier descendiente "position: fixed", así que
          sin portal este modal se vería mal posicionado en vez de centrado
          en toda la ventana. */}
      {apuestaAbierta &&
        createPortal(
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
                onCerrar={() => setApuestaAbiertaId(null)}
                soloLectura
              />
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}
