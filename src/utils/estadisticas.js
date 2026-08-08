import {
  calcularBeneficio,
  calcularCuotaTotal,
  calcularEstadisticas,
  ordenarCronologicamente,
} from "./apuestas";

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
