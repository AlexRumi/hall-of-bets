// Resultado de un partido/grupo, derivado del "resultado" de sus picks.
// Segunda vuelta del rediseño del marcado (ver CHANGELOG.md, "de un
// resultado por apuesta a marcar por partido"): "Modificar" en
// ApuestaItem.jsx/TicketApuesta.jsx marca TODOS los picks de un mismo
// partido a la vez con el mismo resultado (no hay marcado mercado a
// mercado), así que en la práctica esta función siempre encuentra o bien
// todos los picks del grupo iguales, o bien ninguno decidido. Ganada si
// todos los picks no anulados están Ganada; Perdida en cuanto alguno esté
// Perdida; Nula si TODOS los picks están anulados; Pendiente en
// cualquier otro caso.
export function derivarResultadoGrupo(selecciones) {
  const noAnuladas = selecciones.filter((s) => s.resultado !== "nula");
  if (noAnuladas.length === 0) return "nula";
  if (noAnuladas.some((s) => s.resultado === "perdida")) return "perdida";
  if (noAnuladas.every((s) => s.resultado === "ganada")) return "ganada";
  return "pendiente";
}

// Mismo criterio que derivarResultadoGrupo, un nivel más arriba: el
// resultado de toda la apuesta a partir del resultado (ya derivado) de
// cada uno de sus partidos — ya no se pone a mano ("Modificar" solo
// existe por partido), este es el único sitio donde se decide el
// resultado real de la apuesta (ver manejarMarcarResultadoPartido en
// App.jsx).
export function derivarResultadoApuesta(gruposPartido) {
  const resultados = gruposPartido.map((g) => g.resultado);
  const noAnulados = resultados.filter((r) => r !== "nula");
  if (noAnulados.length === 0) return "nula";
  if (noAnulados.some((r) => r === "perdida")) return "perdida";
  if (noAnulados.every((r) => r === "ganada")) return "ganada";
  return "pendiente";
}

// En una combinada, la cuota total es el producto de la cuota de cada
// partido/grupo — salvo los que hayan quedado "nula" (ver
// derivarResultadoGrupo), que no cuentan (como si su cuota fuera 1): ese
// partido se anuló y no debe afectar al resultado final, igual que
// anularía esa cuota en un ticket real.
//
// "cuotaTotalManual" (opcional) es una vía de escape para combinadas de
// varias patas: multiplicar cuotas ya redondeadas a 2 decimales (las que
// se ven en el ticket) acumula un pequeño error de redondeo frente a la
// cuota total real que calcula la casa (con más precisión interna), y con
// 4-5 patas puede notarse en unos céntimos. Si el usuario introduce el
// importe real que le paga la casa, FormularioApuesta.jsx guarda la cuota
// que sale de ahí (importe / stake) en este campo, y manda sobre el
// producto calculado — a cambio, deja de reajustarse sola si luego se
// anula un partido: con un valor manual puesto, ya no hay forma de saber
// qué parte del importe correspondía a esa pata.
export function calcularCuotaTotal({ selecciones, cuotaTotalManual }) {
  if (cuotaTotalManual) return cuotaTotalManual;
  return agruparSeleccionesPorPartido(selecciones).reduce(
    (total, grupo) => (grupo.resultado === "nula" ? total : total * grupo.cuota),
    1
  );
}

// Agrupa las selecciones de una apuesta por partido (mismo criterio que usa
// el constructor de apuesta al crearla, ConstructorPartido.jsx: selecciones
// consecutivas del mismo evento con cuota exactamente 1 son mercados extra
// de un "multi" de ese partido). Cada grupo lleva el índice de la selección
// que tiene la cuota real, la propia cuota, y su "resultado" ya derivado de
// TODOS sus picks (derivarResultadoGrupo, usado por calcularCuotaTotal para
// excluir un partido anulado del producto) — pensado para reconstruir tanto
// la edición del formulario como el detalle de ApuestaItem.jsx sin repetir
// la misma lógica dos veces. Cada pick dentro de "selecciones" lleva su
// "indice" absoluto dentro del array original — "Modificar" (por
// partido, ver ApuestaItem.jsx) marca TODOS los índices de un mismo
// grupo a la vez con el mismo resultado.
export function agruparSeleccionesPorPartido(selecciones) {
  const grupos = [];
  selecciones.forEach((seleccion, indice) => {
    const anterior = grupos[grupos.length - 1];
    const siguePartido =
      anterior && seleccion.evento === anterior.evento && Number(seleccion.cuota) === 1;
    if (siguePartido) {
      anterior.selecciones.push({ ...seleccion, indice });
    } else {
      grupos.push({
        indiceLider: indice,
        evento: seleccion.evento,
        pais: seleccion.pais ?? null,
        competicion: seleccion.competicion ?? null,
        partidoId: seleccion.partidoId ?? null,
        // Ids de equipo (Fase "Jugador"): solo presentes si la selección
        // se creó eligiendo un partido del buscador después de esa fase.
        equipoLocalId: seleccion.equipoLocalId ?? null,
        equipoVisitanteId: seleccion.equipoVisitanteId ?? null,
        // Hora de inicio (HH:MM, hora de España) y fecha propia de ESTE
        // partido — no la de toda la apuesta, que en una combinada de
        // varios días no coincide con cada uno. Solo presentes si la
        // selección se creó eligiendo un partido después de la fase del
        // marcador final en caché — usadas por ApuestaItem.jsx para saber
        // desde cuándo pedirlo sin gastar una llamada de más.
        hora: seleccion.hora ?? null,
        fecha: seleccion.fecha ?? null,
        cuota: Number(seleccion.cuota),
        // Marcador escrito a mano (petición directa, solo tiene sentido en
        // "Otras ligas": sin partidoId no hay forma de traer el resultado
        // automático, así que es la única manera de dejarlo anotado) — ver
        // ApuestaItem.jsx.
        golesLocalManual: seleccion.golesLocalManual ?? null,
        golesVisitanteManual: seleccion.golesVisitanteManual ?? null,
        // Si el bot de Telegram ya avisó de que este partido ha terminado
        // (api/telegram-avisos.js) — para no repetir el mismo aviso. Solo
        // se lee/escribe desde ahí; expuesto aquí para que
        // FormularioApuesta.jsx lo preserve al editar la apuesta.
        avisoEnviado: seleccion.avisoEnviado ?? false,
        selecciones: [{ ...seleccion, indice }],
      });
    }
  });
  return grupos.map((grupo) => ({ ...grupo, resultado: derivarResultadoGrupo(grupo.selecciones) }));
}

// Ganancia real: si gana, stake x (cuota total - 1) tanto en real como en freebet.
// Si pierde con freebet, no se pierde dinero real (el stake no era dinero propio).
// Si se hace cash out, el beneficio no se calcula con la cuota (la casa paga lo
// que decide en ese momento): con dinero real es el importe recibido menos el
// stake puesto; con freebet, el importe recibido es ganancia entera (el stake
// nunca fue dinero propio).
export function calcularBeneficio(apuesta) {
  const { resultado, stake, stakeFreebet, tipoFondos, cashoutImporte, aumentoPct, gananciaTotalManual } =
    apuesta;
  if (resultado === "pendiente") return 0;

  const cuotaTotal = calcularCuotaTotal(apuesta);
  if (resultado === "ganada") {
    // Ajuste de ganancia (petición directa): algunas casas (Bet365, sobre
    // todo) pagan un poco más de "stake × cuota" por redondeos internos,
    // sin ser una promoción con % conocido (eso es "aumentoPct", más
    // abajo) — con el TOTAL real que pagó la casa ya guardado, el
    // beneficio sale de ahí en vez de calcularlo, mismo criterio que
    // Cash Out (resta el stake real; con freebet puro, el importe ya es
    // ganancia entera porque el stake nunca fue dinero propio).
    if (gananciaTotalManual != null) {
      return tipoFondos === "freebet" ? gananciaTotalManual : gananciaTotalManual - stake;
    }
    // "mixta": se gana sobre TODO lo apostado, parte real + parte freebet
    // (stakeFreebet es null/0 en real y freebet puras, así que sumarlo no
    // cambia nada ahí).
    const base = (stake + (stakeFreebet ?? 0)) * (cuotaTotal - 1);
    // Aumento de cuota: la casa añade un % sobre la ganancia neta, no
    // sobre el retorno total (comprobado con una captura real de Bet365:
    // cuota 4,00, 5€, 30% de aumento → 15€ base × 1,30 = 19,50€, no 20€×1,30).
    return aumentoPct ? base * (1 + aumentoPct / 100) : base;
  }
  // "perdida"/"cashout": solo se resta/pierde la parte REAL (stake) — en
  // "mixta" ese campo ya es solo la parte real (ver desdeFila), así que la
  // parte freebet nunca "se pierde de verdad", igual que en freebet pura.
  if (resultado === "perdida") return tipoFondos === "freebet" ? 0 : -stake;
  if (resultado === "cashout") {
    return tipoFondos === "freebet" ? cashoutImporte : cashoutImporte - stake;
  }
  return 0;
}

// Estadísticas del conjunto de apuestas recibido (ya filtrado por bankroll/casa/fondos fuera de aquí).
// El stake de las freebets no cuenta como dinero invertido: se excluye del stake total y del yield.
export function calcularEstadisticas(apuestas) {
  // "Decididas" (para el % de acierto) son las ganadas/perdidas de
  // siempre, más los cash out con beneficio o pérdida (cuentaComoGanada/
  // cuentaComoPerdida, definidas más abajo). Un cash out que recupera
  // justo el stake (ni gana ni pierde) se queda fuera, igual que una nula.
  const decididas = apuestas.filter((a) => cuentaComoGanada(a) || cuentaComoPerdida(a));
  const resueltas = apuestas.filter((a) => a.resultado !== "pendiente");
  const pendientes = apuestas.filter((a) => a.resultado === "pendiente");
  // "mixta" cuenta como "real" para el dinero real apostado (su .stake ya
  // es solo la parte real, ver desdeFila) — por eso el filtro es
  // "!== freebet" en vez de "=== real".
  const reales = apuestas.filter((a) => a.tipoFondos !== "freebet");
  const freebets = apuestas.filter((a) => a.tipoFondos === "freebet");

  const stakeTotalReal = reales.reduce((suma, a) => suma + a.stake, 0);
  // El total de freebet sale de .stake en las freebet puras, pero de
  // .stakeFreebet en las mixtas (su .stake es la parte real, no la freebet).
  const stakeTotalFreebet = apuestas.reduce(
    (suma, a) => suma + (a.tipoFondos === "freebet" ? a.stake : a.tipoFondos === "mixta" ? a.stakeFreebet ?? 0 : 0),
    0
  );
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
      .filter((a) => a.tipoFondos !== "freebet")
      .reduce((suma, a) => suma + a.stake, 0),
    // Mismo criterio que stakeTotalFreebet (arriba), pero solo sobre
    // pendientes: cuánto freebet sigue "en juego", sin poder tocarse hasta
    // que la apuesta se resuelva — se muestra aparte de stakePendienteReal
    // (petición directa: no mezclar dinero real y freebet en una sola
    // cifra, mismo criterio que ya sigue el resto de la app).
    stakePendienteFreebet: pendientes.reduce(
      (suma, a) =>
        suma + (a.tipoFondos === "freebet" ? a.stake : a.tipoFondos === "mixta" ? a.stakeFreebet ?? 0 : 0),
      0
    ),
    beneficio,
    yieldPct: stakeTotalReal ? (beneficio / stakeTotalReal) * 100 : 0,
    aciertoPct: decididas.length
      ? (decididas.filter((a) => cuentaComoGanada(a)).length / decididas.length) * 100
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
// las apuestas ya resueltas (una pendiente todavía no ha movido el
// bankroll). Un punto por DÍA (no por apuesta, petición directa: con
// varias apuestas el mismo día, antes salía un punto por cada una y el eje
// repetía la misma fecha varias veces seguidas) — cada punto es el
// acumulado justo después de sumar todo el beneficio de ese día entero.
export function calcularSerieAcumulada(apuestas) {
  const beneficioPorDia = new Map();
  for (const apuesta of ordenarCronologicamente(apuestas)) {
    const beneficioAnterior = beneficioPorDia.get(apuesta.fecha) ?? 0;
    beneficioPorDia.set(apuesta.fecha, beneficioAnterior + calcularBeneficio(apuesta));
  }

  let acumulado = 0;
  return [...beneficioPorDia.entries()].map(([fecha, beneficioDia]) => {
    acumulado += beneficioDia;
    return { fecha, acumulado };
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

// Todas las apuestas sin resolver, de los dos bankrolls a la vez — usada
// por el aviso de Inicio y el filtro "Pendientes" de Historial (ver
// AvisoPendientes.jsx/Historial.jsx). Antes se exigía además que la fecha
// del partido ya hubiera pasado (pendientesAntiguas, día a día, sin hora
// ni margen) para considerarla "vencida" — se descartó (petición directa):
// una combinada puede incluir un partido dentro de varios días que la API
// de fútbol (plan gratuito) todavía no puede confirmar como jugado, así
// que "ya debería haber terminado" no siempre era cierto. Ahora es
// simplemente "sigue pendiente", sin intentar adivinar si el partido ya
// se jugó.
export function todasPendientes(apuestas) {
  return apuestas.filter((a) => a.resultado === "pendiente");
}

// Para rachas y % de acierto (aquí, utils/trofeos.js y
// utils/estadisticas.js): un cash out se juzga por si dejó beneficio o no,
// igual que ganar o perder la apuesta entera. Con beneficio cuenta como
// victoria; con pérdida (cerraste por menos de lo apostado), como derrota.
// Solo el caso exacto de "recuperar justo el stake, ni más ni menos" se
// queda neutral, igual que una apuesta nula — no hubo ni acierto ni fallo.
export function cuentaComoGanada(apuesta) {
  return (
    apuesta.resultado === "ganada" ||
    (apuesta.resultado === "cashout" && calcularBeneficio(apuesta) > 0)
  );
}

export function cuentaComoPerdida(apuesta) {
  return (
    apuesta.resultado === "perdida" ||
    (apuesta.resultado === "cashout" && calcularBeneficio(apuesta) < 0)
  );
}

// Racha actual de victorias: cuenta desde la apuesta resuelta más reciente
// hacia atrás mientras todas cuenten como victoria (ganada, o cash out con
// beneficio). Cualquier otra cosa la corta.
// Se calcula siempre sobre todo el bankroll, sin filtros de casa/fondos/periodo,
// para que no cambie según lo que el usuario esté viendo en cada momento.
export function calcularRachaActual(apuestas) {
  const resueltas = apuestas.filter((a) => a.resultado !== "pendiente");
  let racha = 0;
  for (const apuesta of resueltas) {
    if (!cuentaComoGanada(apuesta)) break;
    racha++;
  }
  return racha;
}

// Fila de Supabase (snake_case) → objeto que usa el resto de la app
// (camelCase). Vive aquí (no en useApuestas.js) porque este archivo no
// importa nada del navegador — así api/telegram-apuesta.js (Mini App del
// bot de Telegram, corre en Node, no en el navegador) puede reutilizarla
// tal cual en vez de reescribir el mismo mapeo por su cuenta.
export function desdeFila(fila) {
  return {
    id: fila.id,
    fecha: fila.fecha,
    casa: fila.casa,
    stake: Number(fila.stake),
    // Solo relevante cuando tipoFondos es "mixta" — la parte freebet de la
    // apuesta (stake ya es la parte real, ver calcularBeneficio/
    // calcularEstadisticas). null en apuestas de antes de este campo, y en
    // las de tipo "real"/"freebet" (100% de un solo tipo).
    stakeFreebet: fila.stake_freebet == null ? null : Number(fila.stake_freebet),
    selecciones: fila.selecciones,
    resultado: fila.resultado,
    categoria: fila.categoria,
    tipoFondos: fila.tipo_fondos,
    cashoutImporte:
      fila.cashout_importe === null ? null : Number(fila.cashout_importe),
    // Las apuestas de antes de tener este campo no tienen deporte asignado.
    deporte: fila.deporte ?? "Otro",
    // Título opcional libre (ej. "Winiela") para identificar apuestas de una
    // promoción concreta de la casa — no filtra ni calcula nada, solo se
    // muestra en el ticket.
    titulo: fila.titulo ?? null,
    seguroFreebetImporte:
      fila.seguro_freebet_importe === null ? null : Number(fila.seguro_freebet_importe),
    aumentoPct: fila.aumento_pct === null ? null : Number(fila.aumento_pct),
    // Ajuste de ganancia (petición directa): algunas casas pagan un poco
    // más de lo calculado por redondeos internos, sin ser una promoción
    // con % conocido — el total real que pagó la casa (stake + beneficio),
    // ver calcularBeneficio. null = sin ajustar, se calcula solo.
    gananciaTotalManual:
      fila.ganancia_total_manual === null || fila.ganancia_total_manual === undefined
        ? null
        : Number(fila.ganancia_total_manual),
    archivado: fila.archivado ?? false,
    cuotaTotalManual:
      fila.cuota_total_manual === null || fila.cuota_total_manual === undefined
        ? null
        : Number(fila.cuota_total_manual),
  };
}

// Desfase (en minutos) entre UTC y Europe/Madrid en un instante concreto:
// CET = UTC+1 en invierno, CEST = UTC+2 en verano. Se calcula formateando
// ese instante en la zona de Madrid con Intl (siempre disponible, sin
// librería nueva) y comparando contra la misma hora leída como si fuera
// UTC — la diferencia es el desfase real en ese momento del año.
function desfaseMadridMinutos(timestampUTC) {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Madrid",
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(timestampUTC)
      .map((p) => [p.type, p.value])
  );
  // El formateador puede devolver "24" para medianoche en vez de "00".
  const hora = partes.hour === "24" ? 0 : Number(partes.hour);
  const comoUTC = Date.UTC(partes.year, partes.month - 1, partes.day, hora, partes.minute);
  return Math.round((comoUTC - timestampUTC) / 60000);
}

// Combina la fecha del partido con su hora (las dos guardadas en la
// selección desde el buscador, ver ConstructorPartido.jsx) para saber desde
// cuándo tendría sentido pedir el resultado final. Esa hora viene siempre en
// hora de España (api/partidos.js pide con timezone=Europe/Madrid) — pero
// "new Date('YYYY-MM-DDTHH:mm:00')" (sin zona) se interpreta en la zona
// horaria de donde corra el código, y Vercel (donde corre
// api/telegram-avisos.js) va en UTC, no en hora de España.
//
// Bug real: esto hacía que el margen de espera del aviso de Telegram
// (api/telegram-avisos.js) se retrasara de más el desfase real entre
// Madrid y UTC (1h en invierno, 2h en verano) — el comentario anterior de
// esta función lo daba por "caso raro de cambio de hora a mitad de
// consulta", pero en realidad es el desfase de TODOS los días del año, no
// solo el momento del cambio de hora: con el margen de 2h del aviso, en
// verano hacían falta 4h reales desde el inicio del partido para que se
// disparara, no 2h. Detectado porque el aviso no llegaba ni esperando 2h30.
// Se corrige calculando el desfase real de Madrid en ese instante
// (desfaseMadridMinutos, con Intl — sin librería nueva) y restándolo, así
// da el mismo resultado corra donde corra el código.
export function horaInicioPartido(fecha, hora) {
  if (!fecha || !hora) return null;
  const comoUTC = new Date(`${fecha}T${hora}:00Z`).getTime();
  return comoUTC - desfaseMadridMinutos(comoUTC) * 60 * 1000;
}

// Margen tras la hora de inicio para asumir que un partido ya debería
// haber terminado (reglamentario + descanso + margen amplio para prórroga
// o penaltis) — mismo valor que ya usaba solo usePartidoInfo.js, ahora
// compartido también con api/telegram-avisos.js.
export const MARGEN_RESULTADO_MS = 2.5 * 60 * 60 * 1000;

// Estados "terminado" de API-Football — en cualquier otro estado (por
// empezar o en juego) no hay resultado final fiable que mostrar ni que
// guardar en caché para siempre. Compartido por usePartidoInfo.js,
// ApuestaItem.jsx y api/telegram-avisos.js: los tres necesitaban
// exactamente el mismo criterio, antes cada uno con su propia copia.
export const ESTADOS_TERMINADOS_PARTIDO = new Set(["FT", "AET", "PEN", "CANC", "ABD", "AWD", "WO"]);
