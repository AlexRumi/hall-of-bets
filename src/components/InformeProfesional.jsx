import { useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { calcularEstadisticas, filtrarPorPeriodo } from "../utils/apuestas";
import { avanzarPeriodo } from "../utils/estadisticas";
import BotonInfoConcepto from "./BotonInfoConcepto";

const BANKROLLS = [
  { id: "apuestas", etiqueta: "Apuestas" },
  { id: "entretenimiento", etiqueta: "Entretenimiento" },
];

const GRANULARIDADES = [
  { id: "semana", etiqueta: "Semana" },
  { id: "mes", etiqueta: "Mes" },
  { id: "anio", etiqueta: "Año" },
];

function obtenerInicioSemana(fecha) {
  const dia = fecha.getDay(); // 0 = domingo … 6 = sábado
  const diff = dia === 0 ? -6 : 1 - dia;
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + diff);
}

function formatearPeriodo(granularidad, fecha) {
  if (granularidad === "anio") return String(fecha.getFullYear());

  if (granularidad === "mes") {
    const texto = fecha.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  const inicio = obtenerInicioSemana(fecha);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 6);
  const inicioTxt = inicio.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  const finTxt = fin.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
  return `${inicioTxt} – ${finTxt}`;
}

function esPeriodoActual(granularidad, fecha, hoy) {
  if (granularidad === "anio") return fecha.getFullYear() === hoy.getFullYear();
  if (granularidad === "mes") {
    return (
      fecha.getFullYear() === hoy.getFullYear() && fecha.getMonth() === hoy.getMonth()
    );
  }
  return obtenerInicioSemana(fecha).getTime() === obtenerInicioSemana(hoy).getTime();
}

function Delta({ actual, anterior }) {
  if (anterior === 0) {
    if (actual === 0) return null;
    return <span className="text-xs font-medium text-slate">nuevo</span>;
  }

  const cambio = ((actual - anterior) / Math.abs(anterior)) * 100;
  if (Math.abs(cambio) < 0.5) {
    return <span className="text-xs text-slate">= vs. anterior</span>;
  }

  return (
    <span className={`text-xs font-medium ${cambio > 0 ? "text-win" : "text-lose"}`}>
      {cambio > 0 ? "▲" : "▼"} {Math.abs(cambio).toFixed(0)}% vs. anterior
    </span>
  );
}

function generarConclusiones(statsActual, statsAnterior, etiquetaAnterior) {
  if (statsActual.numApuestas === 0) {
    return ["Todavía no has registrado apuestas en este periodo."];
  }

  const frases = [
    `Has registrado ${statsActual.numApuestas} ${
      statsActual.numApuestas === 1 ? "apuesta" : "apuestas"
    }.`,
    statsActual.beneficio > 0
      ? `Beneficio de ${statsActual.beneficio.toFixed(2)}€, con un yield del ${statsActual.yieldPct.toFixed(2)}%.`
      : statsActual.beneficio < 0
      ? `Pérdida de ${Math.abs(statsActual.beneficio).toFixed(2)}€, con un yield del ${statsActual.yieldPct.toFixed(2)}%.`
      : "Sin beneficio ni pérdida en este periodo.",
  ];

  if (statsAnterior.numApuestas === 0) {
    frases.push(`No hay apuestas en ${etiquetaAnterior} para comparar.`);
  } else if (statsActual.beneficio > statsAnterior.beneficio) {
    frases.push(
      `Mejora respecto a ${etiquetaAnterior}, donde el beneficio fue de ${statsAnterior.beneficio.toFixed(2)}€.`
    );
  } else if (statsActual.beneficio < statsAnterior.beneficio) {
    frases.push(
      `Peor resultado que en ${etiquetaAnterior}, donde el beneficio fue de ${statsAnterior.beneficio.toFixed(2)}€.`
    );
  } else {
    frases.push(`Mismo beneficio que en ${etiquetaAnterior}.`);
  }

  return frases;
}

// Informe de UN periodo a la vez (no una lista de todos los meses), con
// comparación automática al periodo anterior y conclusiones en texto. Se
// mantiene como un único bloque de contenido estático (sin pestañas
// ocultas) para que exportarlo a PDF más adelante sea sencillo.
export default function InformeProfesional({ apuestas }) {
  const [bankroll, setBankroll] = useState("apuestas");
  const [granularidad, setGranularidad] = useState("mes");
  const [referencia, setReferencia] = useState(new Date());

  const apuestasBankroll = apuestas.filter((a) => a.categoria === bankroll);
  const hoy = new Date();
  const enPeriodoActual = esPeriodoActual(granularidad, referencia, hoy);
  const referenciaAnterior = avanzarPeriodo(granularidad, referencia, -1);

  const statsActual = calcularEstadisticas(
    filtrarPorPeriodo(apuestasBankroll, granularidad, referencia)
  );
  const statsAnterior = calcularEstadisticas(
    filtrarPorPeriodo(apuestasBankroll, granularidad, referenciaAnterior)
  );

  const etiquetaAnterior = formatearPeriodo(granularidad, referenciaAnterior);
  const conclusiones = generarConclusiones(statsActual, statsAnterior, etiquetaAnterior);

  const tiles = [
    { etiqueta: "Nº apuestas", actual: statsActual.numApuestas, anterior: statsAnterior.numApuestas, texto: `${statsActual.numApuestas}` },
    {
      etiqueta: "Beneficio",
      actual: statsActual.beneficio,
      anterior: statsAnterior.beneficio,
      texto: `${statsActual.beneficio > 0 ? "+" : ""}${statsActual.beneficio.toFixed(2)}€`,
      color: statsActual.beneficio > 0 ? "text-win" : statsActual.beneficio < 0 ? "text-lose" : "text-ink",
    },
    {
      etiqueta: "Yield",
      actual: statsActual.yieldPct,
      anterior: statsAnterior.yieldPct,
      texto: `${statsActual.yieldPct > 0 ? "+" : ""}${statsActual.yieldPct.toFixed(2)}%`,
      color: statsActual.yieldPct > 0 ? "text-win" : statsActual.yieldPct < 0 ? "text-lose" : "text-ink",
      conceptoId: "yield",
    },
    {
      etiqueta: "% Acierto",
      actual: statsActual.aciertoPct,
      anterior: statsAnterior.aciertoPct,
      texto: `${statsActual.aciertoPct.toFixed(0)}%`,
      conceptoId: "win-rate",
    },
  ];

  function manejarCambioGranularidad(nueva) {
    setGranularidad(nueva);
    setReferencia(new Date());
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-2">
        {BANKROLLS.map(({ id, etiqueta }) => (
          <button
            key={id}
            type="button"
            onClick={() => setBankroll(id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              bankroll === id
                ? "bg-felt text-paper border-felt"
                : "border-line text-slate hover:text-ink"
            }`}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      <div className="bg-surface border border-line rounded-xl p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-1">
            {GRANULARIDADES.map(({ id, etiqueta }) => (
              <button
                key={id}
                type="button"
                onClick={() => manejarCambioGranularidad(id)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  granularidad === id ? "bg-felt text-paper" : "text-slate hover:text-ink"
                }`}
              >
                {etiqueta}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setReferencia(avanzarPeriodo(granularidad, referencia, -1))}
              aria-label="Periodo anterior"
              className="p-1 rounded-full text-slate hover:text-ink hover:bg-paperDim transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-ink min-w-[9rem] text-center">
              {formatearPeriodo(granularidad, referencia)}
            </span>
            <button
              type="button"
              onClick={() =>
                !enPeriodoActual &&
                setReferencia(avanzarPeriodo(granularidad, referencia, 1))
              }
              disabled={enPeriodoActual}
              aria-label="Periodo siguiente"
              className="p-1 rounded-full text-slate hover:text-ink hover:bg-paperDim transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {tiles.map(({ etiqueta, actual, anterior, texto, color, conceptoId }) => (
            <div key={etiqueta}>
              <p className="text-xs text-slate flex items-center gap-1">
                {etiqueta}
                <BotonInfoConcepto conceptoId={conceptoId} etiqueta={etiqueta} />
              </p>
              <p className={`font-mono text-lg font-medium ${color ?? "text-ink"}`}>
                {texto}
              </p>
              <Delta actual={actual} anterior={anterior} />
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-line">
          <p className="flex items-center gap-2 text-xs font-medium text-slate mb-2">
            <Sparkles size={14} className="text-gold" />
            Conclusiones
          </p>
          <ul className="space-y-1.5">
            {conclusiones.map((frase, i) => (
              <li key={i} className="text-sm text-ink">
                {frase}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
