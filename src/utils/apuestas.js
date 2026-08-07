// En una combinada, la cuota total es el producto de la cuota de cada selección.
export function calcularCuotaTotal(selecciones) {
  return selecciones.reduce((total, seleccion) => total * seleccion.cuota, 1);
}

// Ganancia real: si gana, stake x (cuota total - 1) tanto en real como en freebet.
// Si pierde con freebet, no se pierde dinero real (el stake no era dinero propio).
// Si se hace cash out, el beneficio no se calcula con la cuota (la casa paga lo
// que decide en ese momento): con dinero real es el importe recibido menos el
// stake puesto; con freebet, el importe recibido es ganancia entera (el stake
// nunca fue dinero propio).
export function calcularBeneficio(apuesta) {
  const { resultado, stake, selecciones, tipoFondos, cashoutImporte, aumentoPct } = apuesta;
  if (resultado === "pendiente") return 0;

  const cuotaTotal = calcularCuotaTotal(selecciones);
  if (resultado === "ganada") {
    const base = stake * (cuotaTotal - 1);
    // Aumento de cuota: la casa añade un % sobre la ganancia neta, no
    // sobre el retorno total (comprobado con una captura real de Bet365:
    // cuota 4,00, 5€, 30% de aumento → 15€ base × 1,30 = 19,50€, no 20€×1,30).
    return aumentoPct ? base * (1 + aumentoPct / 100) : base;
  }
  if (resultado === "perdida") return tipoFondos === "freebet" ? 0 : -stake;
  if (resultado === "cashout") {
    return tipoFondos === "freebet" ? cashoutImporte : cashoutImporte - stake;
  }
  return 0;
}

// Estadísticas del conjunto de apuestas recibido (ya filtrado por bankroll/casa/fondos fuera de aquí).
// El stake de las freebets no cuenta como dinero invertido: se excluye del stake total y del yield.
export function calcularEstadisticas(apuestas) {
  const decididas = apuestas.filter(
    (a) => a.resultado === "ganada" || a.resultado === "perdida"
  );
  const resueltas = apuestas.filter((a) => a.resultado !== "pendiente");
  const pendientes = apuestas.filter((a) => a.resultado === "pendiente");
  const reales = apuestas.filter((a) => a.tipoFondos === "real");
  const freebets = apuestas.filter((a) => a.tipoFondos === "freebet");

  const stakeTotalReal = reales.reduce((suma, a) => suma + a.stake, 0);
  const stakeTotalFreebet = freebets.reduce((suma, a) => suma + a.stake, 0);
  const beneficio = resueltas.reduce(
    (suma, a) => suma + calcularBeneficio(a),
    0
  );
  const cuotaMedia = apuestas.length
    ? apuestas.reduce((suma, a) => suma + calcularCuotaTotal(a.selecciones), 0) /
      apuestas.length
    : 0;

  return {
    numApuestas: apuestas.length,
    stakeMedio: reales.length ? stakeTotalReal / reales.length : 0,
    cuotaMedia,
    stakeTotalReal,
    stakeTotalFreebet,
    // Dinero que sigue "en juego": apuestas pendientes de resolver.
    numPendientes: pendientes.length,
    stakePendienteReal: pendientes
      .filter((a) => a.tipoFondos === "real")
      .reduce((suma, a) => suma + a.stake, 0),
    beneficio,
    yieldPct: stakeTotalReal ? (beneficio / stakeTotalReal) * 100 : 0,
    aciertoPct: decididas.length
      ? (decididas.filter((a) => a.resultado === "ganada").length /
          decididas.length) *
        100
      : 0,
  };
}

// Apuestas ya resueltas (sin pendientes), de la más antigua a la más reciente.
export function ordenarCronologicamente(apuestas) {
  return [...apuestas]
    .filter((a) => a.resultado !== "pendiente")
    .reverse() // el array guarda las más nuevas primero; así quedan las más antiguas primero
    .sort((a, b) => a.fecha.localeCompare(b.fecha)); // sort estable: mantiene el orden anterior dentro del mismo día
}

// Beneficio acumulado a lo largo del tiempo, para el gráfico. Solo cuentan
// las apuestas ya resueltas (una pendiente todavía no ha movido el bankroll).
export function calcularSerieAcumulada(apuestas) {
  let acumulado = 0;
  return ordenarCronologicamente(apuestas).map((apuesta) => {
    acumulado += calcularBeneficio(apuesta);
    return { fecha: apuesta.fecha, acumulado };
  });
}

// Convierte "YYYY-MM-DD" a Date en horario local (evita el lío de zonas horarias de new Date("YYYY-MM-DD")).
function fechaLocal(fechaStr) {
  const [anio, mes, dia] = fechaStr.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

function obtenerInicioSemana(referencia) {
  const dia = referencia.getDay(); // 0 = domingo … 6 = sábado
  const diffHastaLunes = dia === 0 ? -6 : 1 - dia;
  return new Date(
    referencia.getFullYear(),
    referencia.getMonth(),
    referencia.getDate() + diffHastaLunes
  );
}

// Filtra apuestas por periodo de calendario (hoy / semana en curso, lunes a domingo / mes / año).
export function filtrarPorPeriodo(apuestas, periodo, referencia = new Date()) {
  if (periodo === "todo") return apuestas;

  return apuestas.filter((apuesta) => {
    const fecha = fechaLocal(apuesta.fecha);

    if (periodo === "hoy") {
      return (
        fecha.getFullYear() === referencia.getFullYear() &&
        fecha.getMonth() === referencia.getMonth() &&
        fecha.getDate() === referencia.getDate()
      );
    }

    if (periodo === "semana") {
      const inicioSemana = obtenerInicioSemana(referencia);
      const finSemana = new Date(
        inicioSemana.getFullYear(),
        inicioSemana.getMonth(),
        inicioSemana.getDate() + 6
      );
      return fecha >= inicioSemana && fecha <= finSemana;
    }

    if (periodo === "mes") {
      return (
        fecha.getFullYear() === referencia.getFullYear() &&
        fecha.getMonth() === referencia.getMonth()
      );
    }

    if (periodo === "anio") {
      return fecha.getFullYear() === referencia.getFullYear();
    }

    return true;
  });
}

// Agrupa las apuestas por mes ("YYYY-MM") y calcula las mismas estadísticas
// que calcularEstadisticas para cada mes, del más reciente al más antiguo.
export function calcularInformeMensual(apuestas) {
  const grupos = new Map();
  for (const apuesta of apuestas) {
    const clave = apuesta.fecha.slice(0, 7);
    if (!grupos.has(clave)) grupos.set(clave, []);
    grupos.get(clave).push(apuesta);
  }

  return [...grupos.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([mes, apuestasDelMes]) => ({
      mes,
      ...calcularEstadisticas(apuestasDelMes),
    }));
}

// Agrupa las apuestas por casa y calcula las mismas estadísticas que
// calcularEstadisticas para cada una, de más a menos rentable.
export function calcularDesglosePorCasa(apuestas) {
  const grupos = new Map();
  for (const apuesta of apuestas) {
    if (!grupos.has(apuesta.casa)) grupos.set(apuesta.casa, []);
    grupos.get(apuesta.casa).push(apuesta);
  }

  return [...grupos.entries()]
    .map(([casa, apuestasDeCasa]) => ({
      casa,
      ...calcularEstadisticas(apuestasDeCasa),
    }))
    .sort((a, b) => b.beneficio - a.beneficio);
}

// Apuestas pendientes cuyo evento ya pasó (la fecha guardada es la del
// partido, no la de creación) — candidatas a que el usuario actualice el
// resultado. No usa un umbral de días: si el partido ya se jugó, ya se
// puede marcar.
export function pendientesAntiguas(apuestas, referencia = new Date()) {
  const hoy = new Date(referencia.getFullYear(), referencia.getMonth(), referencia.getDate());
  return apuestas.filter(
    (a) => a.resultado === "pendiente" && fechaLocal(a.fecha) < hoy
  );
}

// Racha actual de victorias: cuenta desde la apuesta resuelta más reciente
// hacia atrás mientras todas sean "ganada". Cualquier perdida o nula la corta.
// Se calcula siempre sobre todo el bankroll, sin filtros de casa/fondos/periodo,
// para que no cambie según lo que el usuario esté viendo en cada momento.
export function calcularRachaActual(apuestas) {
  const resueltas = apuestas.filter((a) => a.resultado !== "pendiente");
  let racha = 0;
  for (const apuesta of resueltas) {
    if (apuesta.resultado !== "ganada") break;
    racha++;
  }
  return racha;
}
