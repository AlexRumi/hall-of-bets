import {
  calcularBeneficio,
  calcularCuotaTotal,
  calcularEstadisticas,
  ordenarCronologicamente,
  agruparSeleccionesPorPartido,
} from "./apuestas";
import { CATEGORIAS_MERCADO, buscarMercadoPorTexto, equiposDesdeEvento } from "./mercados";

// Mejor racha de victorias y peor racha de derrotas del histórico completo.
// Una apuesta "nula" corta ambas rachas sin contar como ninguna de las dos
// (mismo criterio que calcularRachaActual en utils/apuestas.js).
export function calcularRachas(apuestas) {
  let mejorRacha = 0;
  let peorRacha = 0;
  let actualGanadas = 0;
  let actualPerdidas = 0;

  for (const apuesta of ordenarCronologicamente(apuestas)) {
    if (apuesta.resultado === "ganada") {
      actualGanadas++;
      actualPerdidas = 0;
      mejorRacha = Math.max(mejorRacha, actualGanadas);
    } else if (apuesta.resultado === "perdida") {
      actualPerdidas++;
      actualGanadas = 0;
      peorRacha = Math.max(peorRacha, actualPerdidas);
    } else {
      actualGanadas = 0;
      actualPerdidas = 0;
    }
  }

  return { mejorRacha, peorRacha };
}

// La apuesta con más beneficio y la de más pérdida, entre las ya resueltas.
export function calcularMejorYPeorApuesta(apuestas) {
  const resueltas = apuestas.filter((a) => a.resultado !== "pendiente");
  if (resueltas.length === 0) return { mejor: null, peor: null };

  let mejor = resueltas[0];
  let peor = resueltas[0];
  let mejorBeneficio = calcularBeneficio(mejor);
  let peorBeneficio = mejorBeneficio;

  for (const apuesta of resueltas) {
    const beneficio = calcularBeneficio(apuesta);
    if (beneficio > mejorBeneficio) {
      mejor = apuesta;
      mejorBeneficio = beneficio;
    }
    if (beneficio < peorBeneficio) {
      peor = apuesta;
      peorBeneficio = beneficio;
    }
  }

  return { mejor, peor };
}

// Mismo patrón que calcularDesglosePorCasa (utils/apuestas.js), agrupando
// por deporte en vez de por casa.
export function calcularDesglosePorDeporte(apuestas) {
  const grupos = new Map();
  for (const apuesta of apuestas) {
    const deporte = apuesta.deporte ?? "Otro";
    if (!grupos.has(deporte)) grupos.set(deporte, []);
    grupos.get(deporte).push(apuesta);
  }

  return [...grupos.entries()]
    .map(([deporte, apuestasDeDeporte]) => ({
      deporte,
      ...calcularEstadisticas(apuestasDeDeporte),
    }))
    .sort((a, b) => b.beneficio - a.beneficio);
}

// Mismo patrón que calcularDesglosePorCasa/calcularDesglosePorDeporte,
// agrupando por categoría de mercado (utils/mercados.js) — Resultado,
// Goles, Hándicap asiático... Con varios mercados/partidos en la misma
// apuesta no tiene sentido repartir su stake/beneficio entre categorías,
// así que se atribuye entera a la categoría de la selección "líder": la
// primera del primer partido (mismo criterio que ya usa
// agruparSeleccionesPorPartido para la cuota real del bloque). Si el texto
// no coincide con ningún mercado del catálogo (escrito a mano, o de antes
// de tener el desplegable), cuenta como "Otro mercado".
export function calcularEstadisticasPorMercado(apuestas) {
  const grupos = new Map();
  for (const apuesta of apuestas) {
    const [primerGrupo] = agruparSeleccionesPorPartido(apuesta.selecciones);
    if (!primerGrupo) continue;

    const liderSeleccion = apuesta.selecciones[primerGrupo.indiceLider];
    const equipos = equiposDesdeEvento(primerGrupo.evento);
    const encontrado = buscarMercadoPorTexto(liderSeleccion.apuesta, equipos);
    const categoriaId = encontrado?.categoriaId ?? "otro";

    if (!grupos.has(categoriaId)) grupos.set(categoriaId, []);
    grupos.get(categoriaId).push(apuesta);
  }

  return [...grupos.entries()]
    .map(([categoriaId, apuestasCategoria]) => ({
      categoriaId,
      etiqueta: CATEGORIAS_MERCADO.find((c) => c.id === categoriaId)?.etiqueta ?? "Otro mercado",
      ...calcularEstadisticas(apuestasCategoria),
    }))
    .sort((a, b) => b.beneficio - a.beneficio);
}

// Frecuencia de uso por categoría de mercado — a diferencia de
// calcularEstadisticasPorMercado (que atribuye la apuesta entera a la
// categoría de su selección líder, para no contar el mismo dinero dos
// veces), aquí se cuenta CADA selección de CADA apuesta por su propia
// categoría: así los mercados "secundarios" de una combinada o de un bet
// builder (los que no llevan la cuota real del bloque) también cuentan,
// aunque solo como frecuencia de uso — sin dinero asociado, porque el
// beneficio de una apuesta no se puede repartir de forma real entre sus
// mercados.
export function calcularFrecuenciaMercados(apuestas) {
  const conteo = new Map();
  for (const apuesta of apuestas) {
    for (const seleccion of apuesta.selecciones) {
      const equipos = equiposDesdeEvento(seleccion.evento);
      const encontrado = buscarMercadoPorTexto(seleccion.apuesta, equipos);
      const categoriaId = encontrado?.categoriaId ?? "otro";
      conteo.set(categoriaId, (conteo.get(categoriaId) ?? 0) + 1);
    }
  }

  return [...conteo.entries()]
    .map(([categoriaId, veces]) => ({
      categoriaId,
      etiqueta: CATEGORIAS_MERCADO.find((c) => c.id === categoriaId)?.etiqueta ?? "Otro mercado",
      veces,
    }))
    .sort((a, b) => b.veces - a.veces);
}

const RANGOS_CUOTA = [
  { id: "1,01–1,5", min: 1.01, max: 1.5 },
  { id: "1,5–2", min: 1.5, max: 2 },
  { id: "2–3", min: 2, max: 3 },
  { id: "3–5", min: 3, max: 5 },
  { id: "5+", min: 5, max: Infinity },
];

// Beneficio agrupado por franja de cuota total, solo entre apuestas resueltas.
export function calcularBeneficioPorRangoCuota(apuestas) {
  const resueltas = apuestas.filter((a) => a.resultado !== "pendiente");

  return RANGOS_CUOTA.map(({ id, min, max }) => {
    const delRango = resueltas.filter((a) => {
      const cuota = calcularCuotaTotal(a);
      return cuota >= min && cuota < max;
    });
    return {
      rango: id,
      numApuestas: delRango.length,
      beneficio: delRango.reduce((suma, a) => suma + calcularBeneficio(a), 0),
    };
  });
}

function fechaLocal(fechaStr) {
  const [anio, mes, dia] = fechaStr.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

const VENTANAS_DIAS = { "7d": 7, "30d": 30, "90d": 90 };

// Filtro de ventana relativa (termina hoy), distinto de filtrarPorPeriodo
// (que es por calendario: hoy/semana en curso/mes en curso/año en curso).
export function filtrarPorVentana(apuestas, ventana, referencia = new Date()) {
  if (ventana === "todo") return apuestas;

  if (ventana === "anio") {
    return apuestas.filter(
      (a) => fechaLocal(a.fecha).getFullYear() === referencia.getFullYear()
    );
  }

  const dias = VENTANAS_DIAS[ventana];
  const inicio = new Date(referencia);
  inicio.setDate(inicio.getDate() - dias + 1);
  inicio.setHours(0, 0, 0, 0);

  return apuestas.filter((a) => fechaLocal(a.fecha) >= inicio);
}

// Mueve una fecha ±1 semana/mes/año. Sirve tanto para las flechas de
// navegación del Informe como para calcular a qué periodo anterior comparar.
export function avanzarPeriodo(granularidad, fecha, direccion) {
  const nueva = new Date(fecha);
  if (granularidad === "semana") nueva.setDate(nueva.getDate() + 7 * direccion);
  if (granularidad === "mes") nueva.setMonth(nueva.getMonth() + direccion);
  if (granularidad === "anio") nueva.setFullYear(nueva.getFullYear() + direccion);
  return nueva;
}
