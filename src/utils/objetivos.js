import { calcularEstadisticas, filtrarPorPeriodo } from "./apuestas";

const ETIQUETAS_TIPO = {
  beneficio: "Beneficio",
  yield: "Yield",
  num_apuestas: "Nº apuestas",
  acierto: "% Acierto",
};

const ETIQUETAS_PERIODO = {
  semana: "esta semana",
  mes: "este mes",
  anio: "este año",
};

function valorActual(tipo, stats) {
  if (tipo === "beneficio") return stats.beneficio;
  if (tipo === "yield") return stats.yieldPct;
  if (tipo === "num_apuestas") return stats.numApuestas;
  if (tipo === "acierto") return stats.aciertoPct;
  return 0;
}

function formatearValor(tipo, valor) {
  if (tipo === "beneficio") return `${valor.toFixed(2)}€`;
  if (tipo === "yield" || tipo === "acierto") return `${valor.toFixed(1)}%`;
  return `${Math.round(valor)}`;
}

// Progreso del objetivo, siempre contra el periodo *actual* de su
// `periodo` (si es "mes", el mes en curso) — no guarda a qué mes concreto
// pertenece, así que al cambiar de periodo el progreso se reinicia solo.
export function calcularProgresoObjetivo(objetivo, apuestasDelBankroll) {
  const { tipo, periodo, valorObjetivo } = objetivo;
  const stats = calcularEstadisticas(filtrarPorPeriodo(apuestasDelBankroll, periodo));
  const actual = valorActual(tipo, stats);
  const pct = valorObjetivo > 0 ? Math.min(100, Math.max(0, (actual / valorObjetivo) * 100)) : 0;

  return {
    actual,
    pct,
    texto: `${formatearValor(tipo, actual)} / ${formatearValor(tipo, valorObjetivo)} ${ETIQUETAS_PERIODO[periodo]}`,
    cumplido: actual >= valorObjetivo,
  };
}

export { ETIQUETAS_TIPO, ETIQUETAS_PERIODO };
