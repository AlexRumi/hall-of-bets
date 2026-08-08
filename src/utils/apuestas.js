// En una combinada, la cuota total es el producto de la cuota de cada
// selección — salvo las marcadas "nula" por partido (ver
// agruparSeleccionesPorPartido / ApuestaItem.jsx), que no cuentan (como si
// su cuota fuera 1): esa pata se anuló y no debe afectar al resultado
// final, igual que anularía esa cuota en un ticket real. Las selecciones
// de apuestas creadas antes de esta función no tienen "resultado" — se
// tratan igual que antes (ninguna se descarta).
//
// "cuotaTotalManual" (opcional) es una vía de escape para combinadas de
// varias patas: multiplicar cuotas ya redondeadas a 2 decimales (las que
// se ven en el ticket) acumula un pequeño error de redondeo frente a la
// cuota total real que calcula la casa (con más precisión interna), y con
// 4-5 patas puede notarse en unos céntimos. Si el usuario introduce el
// importe real que le paga la casa, FormularioApuesta.jsx guarda la cuota
// que sale de ahí (importe / stake) en este campo, y manda sobre el
// producto calculado — a cambio, deja de reajustarse sola si luego se
// marca una pata como nula (ver agruparSeleccionesPorPartido): con un
// valor manual puesto, ya no hay forma de saber qué parte del importe
// correspondía a esa pata.
export function calcularCuotaTotal({ selecciones, cuotaTotalManual }) {
  if (cuotaTotalManual) return cuotaTotalManual;
  return selecciones.reduce(
    (total, seleccion) => (seleccion.resultado === "nula" ? total : total * seleccion.cuota),
    1
  );
}

// Agrupa las selecciones de una apuesta por partido (mismo criterio que usa
// el constructor de apuesta al crearla, ConstructorPartido.jsx: selecciones
// consecutivas del mismo evento con cuota exactamente 1 son mercados extra
// de un "multi" de ese partido). Cada grupo lleva el índice de la selección
// que tiene la cuota real, la propia cuota, y su "resultado" por partido
// (Ganada/Perdida/Nula, independiente del resultado final de toda la
// apuesta) — pensado para reconstruir tanto la edición del formulario como
// el detalle de ApuestaItem.jsx sin repetir la misma lógica dos veces.
export function agruparSeleccionesPorPartido(selecciones) {
  const grupos = [];
  selecciones.forEach((seleccion, indice) => {
    const anterior = grupos[grupos.length - 1];
    const siguePartido =
      anterior && seleccion.evento === anterior.evento && Number(seleccion.cuota) === 1;
    if (siguePartido) {
      anterior.selecciones.push(seleccion);
    } else {
      grupos.push({
        indiceLider: indice,
        evento: seleccion.evento,
        pais: seleccion.pais ?? null,
        competicion: seleccion.competicion ?? null,
        partidoId: seleccion.partidoId ?? null,
        cuota: Number(seleccion.cuota),
        resultado: seleccion.resultado ?? "pendiente",
        selecciones: [seleccion],
      });
    }
  });
  return grupos;
}

// Ganancia real: si gana, stake x (cuota total - 1) tanto en real como en freebet.
// Si pierde con freebet, no se pierde dinero real (el stake no era dinero propio).
// Si se hace cash out, el beneficio no se calcula con la cuota (la casa paga lo
// que decide en ese momento): con dinero real es el importe recibido menos el
// stake puesto; con freebet, el importe recibido es ganancia entera (el stake
// nunca fue dinero propio).
export function calcularBeneficio(apuesta) {
  const { resultado, stake, tipoFondos, cashoutImporte, aumentoPct } = apuesta;
  if (resultado === "pendiente") return 0;

  const cuotaTotal = calcularCuotaTotal(apuesta);
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
    ? apuestas.reduce((suma, a) => suma + calcularCuotaTotal(a), 0) /
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

// Filtra por un rango de fechas libre (ambos límites opcionales) — a
// diferencia de filtrarPorPeriodo, no está atado al calendario (hoy/semana/
// mes/año): se usa para consultar un periodo histórico concreto (Fase C,
// archivado) que puede cruzar datos archivados y activos a la vez.
export function filtrarPorRango(apuestas, desde, hasta) {
  return apuestas.filter((apuesta) => {
    const fecha = fechaLocal(apuesta.fecha);
    if (desde && fecha < fechaLocal(desde)) return false;
    if (hasta && fecha > fechaLocal(hasta)) return false;
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
