import {
  calcularBeneficio,
  calcularCuotaTotal,
  ordenarCronologicamente,
  agruparSeleccionesPorPartido,
  derivarResultadoApuesta,
  cuentaComoGanada,
  cuentaComoPerdida,
} from "./apuestas";

// Un cash out con beneficio cuenta como victoria para la racha (mismo
// criterio que calcularRachaActual en utils/apuestas.js) — cerraste con más
// dinero del que arriesgaste, igual que ganar la apuesta entera.
function calcularMejorRacha(apuestasCronologicas) {
  let mejor = 0;
  let actual = 0;
  for (const apuesta of apuestasCronologicas) {
    if (cuentaComoGanada(apuesta)) {
      actual++;
      mejor = Math.max(mejor, actual);
    } else {
      actual = 0;
    }
  }
  return mejor;
}

// Detecta una victoria (o cash out con beneficio) justo después de 3 o más
// derrotas seguidas (una remontada) — un cash out con pérdida también
// cuenta como derrota para esto.
function hayRemontada(apuestasCronologicas) {
  let derrotasSeguidas = 0;
  for (const apuesta of apuestasCronologicas) {
    if (cuentaComoPerdida(apuesta)) {
      derrotasSeguidas++;
    } else if (cuentaComoGanada(apuesta)) {
      if (derrotasSeguidas >= 3) return true;
      derrotasSeguidas = 0;
    }
  }
  return false;
}

// Petición directa del usuario: una combinada cerrada con Cash Out una vez
// todos sus partidos ya estaban marcados Ganada no contaba para "Cazador
// de cuotas" ni "Combinada ganadora" — el "resultado" guardado se queda en
// "cashout" a propósito (ver manejarMarcarResultadoPartido en App.jsx), así
// que un "a.resultado === 'ganada'" literal se lo perdía. Se considera
// "ganada de verdad" si el resultado guardado ya es "ganada", o si es un
// cash out cuyos partidos, derivados uno por uno (Modificar, por partido —
// ver ApuestaItem.jsx), dan "ganada" en conjunto — es decir, cobraste
// antes de tiempo pero todos los partidos acabaron acertados de todas
// formas. Un cash out con algún partido aún sin marcar sigue sin contar.
function esGanadaDeVerdad(apuesta) {
  if (apuesta.resultado === "ganada") return true;
  if (apuesta.resultado !== "cashout") return false;
  return derivarResultadoApuesta(agruparSeleccionesPorPartido(apuesta.selecciones)) === "ganada";
}

function numeroPartidos(apuesta) {
  return agruparSeleccionesPorPartido(apuesta.selecciones).length;
}

// Todos los datos que necesitan los trofeos, calculados una sola vez.
function construirContexto(apuestas) {
  const cronologicas = ordenarCronologicamente(apuestas);
  const ganadas = apuestas.filter(esGanadaDeVerdad);
  // "decididas" sí cuenta los cash out con beneficio o pérdida (mismo
  // criterio que aciertoPct en calcularEstadisticas), para que
  // "Perfeccionista" no se quede corto ni se pase de listo frente al %
  // de acierto real.
  const decididas = apuestas.filter((a) => cuentaComoGanada(a) || cuentaComoPerdida(a));
  const freebetsGanadas = ganadas.filter((a) => a.tipoFondos === "freebet");
  // Solo combinadas (2+ partidos) entre las ganadas de verdad, para los
  // trofeos de "Combinadas" — cuenta partidos, no mercados sueltos: un
  // "multi" de un solo partido (un bet builder) no es una combinada.
  const partidosCombinadasGanadas = ganadas
    .map(numeroPartidos)
    .filter((n) => n > 1);

  return {
    totalApuestas: apuestas.length,
    mejorRacha: calcularMejorRacha(cronologicas),
    mejorCuotaAcertada: ganadas.reduce(
      (max, a) => Math.max(max, calcularCuotaTotal(a)),
      0
    ),
    combinadaGanada: partidosCombinadasGanadas.length > 0,
    combinadaCreada: apuestas.some((a) => numeroPartidos(a) > 1),
    mejorCombinadaGanada: partidosCombinadasGanadas.length
      ? Math.max(...partidosCombinadasGanadas)
      : 0,
    numCombinadasGanadas: partidosCombinadasGanadas.length,
    remontada: hayRemontada(cronologicas),
    aciertoPerfecto: decididas.length >= 10 && decididas.every((a) => cuentaComoGanada(a)),
    casasDistintas: new Set(apuestas.map((a) => a.casa)).size,
    deportesDistintos: new Set(apuestas.map((a) => a.deporte)).size,
    bankrollsUsados: new Set(apuestas.map((a) => a.categoria)).size,
    mejorBeneficioFreebet: freebetsGanadas.reduce(
      (max, a) => Math.max(max, calcularBeneficio(a)),
      0
    ),
    numCashouts: apuestas.filter((a) => a.resultado === "cashout").length,
    tieneSeguro: apuestas.some((a) => a.seguroFreebetImporte),
    numFreebets: apuestas.filter((a) => a.tipoFondos === "freebet").length,
  };
}

// Categorías para agrupar la sala de trofeos. El orden aquí es el orden en
// que se muestran las secciones.
export const CATEGORIAS = [
  { id: "volumen", etiqueta: "Volumen" },
  { id: "rachas", etiqueta: "Rachas" },
  { id: "cuotas", etiqueta: "Cuotas" },
  { id: "combinadas", etiqueta: "Combinadas" },
  { id: "especiales", etiqueta: "Especiales" },
];

// Progreso numérico genérico (actual/objetivo) para las barras de progreso
// de los trofeos todavía no conseguidos. "decimales" es 0 para conteos
// (apuestas, casas...) y 2 para cuotas.
function progresoNumerico(actual, objetivo, sufijo, decimales = 0) {
  return {
    pct: Math.min(100, (actual / objetivo) * 100),
    texto: `${actual.toFixed(decimales)} / ${objetivo.toFixed(decimales)} ${sufijo}`,
  };
}

// Catálogo de trofeos. Añadir uno nuevo es solo añadir un objeto más a este
// array: "oculto: true" lo mantiene en secreto (se ve como "???") hasta
// conseguirlo — y, para no delatarlo antes de tiempo, los trofeos ocultos
// no llevan "progreso" (no se muestra barra hasta desbloquearlos).
//
// Esta misma forma (id, categoria, tier, comprobar, progreso opcional) es
// la que usaría un futuro "objetivo personal" definido por el usuario: no
// haría falta cambiar SalaTrofeos.jsx, solo añadir objetos con esta forma
// a una lista aparte y combinarlas antes de evaluarTrofeos. No implementado
// todavía (fase 22), solo la arquitectura ya lo permite.
export const TROFEOS = [
  {
    id: "primera-apuesta",
    nombre: "Primeros pasos",
    descripcion: "Registra tu primera apuesta",
    tier: "bronce",
    categoria: "volumen",
    comprobar: (ctx) => ctx.totalApuestas >= 1,
    progreso: (ctx) => progresoNumerico(ctx.totalApuestas, 1, "apuestas"),
  },
  {
    id: "cinco-apuestas",
    nombre: "Cogiendo ritmo",
    descripcion: "Registra 5 apuestas",
    tier: "bronce",
    categoria: "volumen",
    comprobar: (ctx) => ctx.totalApuestas >= 5,
    progreso: (ctx) => progresoNumerico(ctx.totalApuestas, 5, "apuestas"),
  },
  {
    id: "veinticinco-apuestas",
    nombre: "Cuaderno lleno",
    descripcion: "Registra 25 apuestas",
    tier: "plata",
    categoria: "volumen",
    comprobar: (ctx) => ctx.totalApuestas >= 25,
    progreso: (ctx) => progresoNumerico(ctx.totalApuestas, 25, "apuestas"),
  },
  {
    id: "cincuenta-apuestas",
    nombre: "Medio centenar",
    descripcion: "Registra 50 apuestas",
    tier: "oro",
    categoria: "volumen",
    comprobar: (ctx) => ctx.totalApuestas >= 50,
    progreso: (ctx) => progresoNumerico(ctx.totalApuestas, 50, "apuestas"),
  },
  {
    id: "cien-apuestas",
    nombre: "Historiador",
    descripcion: "Registra 100 apuestas",
    tier: "platino",
    categoria: "volumen",
    comprobar: (ctx) => ctx.totalApuestas >= 100,
    progreso: (ctx) => progresoNumerico(ctx.totalApuestas, 100, "apuestas"),
  },
  {
    id: "doscientas-cincuenta-apuestas",
    nombre: "Enciclopedia",
    descripcion: "Registra 250 apuestas",
    tier: "platino",
    categoria: "volumen",
    comprobar: (ctx) => ctx.totalApuestas >= 250,
    progreso: (ctx) => progresoNumerico(ctx.totalApuestas, 250, "apuestas"),
  },
  {
    id: "racha-3",
    nombre: "En racha",
    descripcion: "Consigue 3 victorias seguidas",
    tier: "bronce",
    categoria: "rachas",
    comprobar: (ctx) => ctx.mejorRacha >= 3,
    progreso: (ctx) => progresoNumerico(ctx.mejorRacha, 3, "victorias seguidas"),
  },
  {
    id: "racha-5",
    nombre: "Imparable",
    descripcion: "Consigue 5 victorias seguidas",
    tier: "plata",
    categoria: "rachas",
    comprobar: (ctx) => ctx.mejorRacha >= 5,
    progreso: (ctx) => progresoNumerico(ctx.mejorRacha, 5, "victorias seguidas"),
  },
  {
    id: "racha-7",
    nombre: "Sobre ruedas",
    descripcion: "Consigue 7 victorias seguidas",
    tier: "oro",
    categoria: "rachas",
    comprobar: (ctx) => ctx.mejorRacha >= 7,
    progreso: (ctx) => progresoNumerico(ctx.mejorRacha, 7, "victorias seguidas"),
  },
  {
    id: "racha-10",
    nombre: "Leyenda",
    descripcion: "Consigue 10 victorias seguidas",
    tier: "oro",
    categoria: "rachas",
    comprobar: (ctx) => ctx.mejorRacha >= 10,
    progreso: (ctx) => progresoNumerico(ctx.mejorRacha, 10, "victorias seguidas"),
  },
  {
    id: "racha-15",
    nombre: "Máquina de guerra",
    descripcion: "Consigue 15 victorias seguidas",
    tier: "platino",
    categoria: "rachas",
    comprobar: (ctx) => ctx.mejorRacha >= 15,
    progreso: (ctx) => progresoNumerico(ctx.mejorRacha, 15, "victorias seguidas"),
  },
  {
    // Movido de "especiales" a "rachas" (petición directa: esa categoría
    // se había quedado con demasiados trofeos, casi la mitad de los
    // ocultos de toda la app) — encaja mejor aquí de todas formas, es una
    // racha (de derrotas cortada por una victoria), no un logro suelto.
    id: "remontada",
    nombre: "El fénix",
    descripcion:
      "Consigue una victoria justo después de perder 3 apuestas seguidas",
    tier: "plata",
    categoria: "rachas",
    oculto: true,
    comprobar: (ctx) => ctx.remontada,
  },
  {
    // Mismo motivo que "El fénix": un 100% de acierto sostenido es, en el
    // fondo, la racha perfecta — encaja en "Rachas" tanto como en
    // "Especiales", y ayuda a repartir mejor los trofeos ocultos entre
    // categorías.
    id: "perfeccionista",
    nombre: "Perfeccionista",
    descripcion:
      "Consigue un 100% de acierto con al menos 10 apuestas decididas",
    tier: "platino",
    categoria: "rachas",
    oculto: true,
    comprobar: (ctx) => ctx.aciertoPerfecto,
  },
  {
    id: "cuota-1-8",
    nombre: "Valentía premiada",
    descripcion: "Acierta una apuesta con cuota ≥ 1,8",
    tier: "bronce",
    categoria: "cuotas",
    comprobar: (ctx) => ctx.mejorCuotaAcertada >= 1.8,
    progreso: (ctx) => progresoNumerico(ctx.mejorCuotaAcertada, 1.8, "de cuota", 2),
  },
  {
    id: "cuota-3",
    nombre: "Cazador de cuotas",
    descripcion: "Acierta una apuesta con cuota ≥ 3",
    tier: "plata",
    categoria: "cuotas",
    comprobar: (ctx) => ctx.mejorCuotaAcertada >= 3,
    progreso: (ctx) => progresoNumerico(ctx.mejorCuotaAcertada, 3, "de cuota", 2),
  },
  {
    id: "cuota-5",
    nombre: "Pelotazo",
    descripcion: "Acierta una apuesta con cuota ≥ 5",
    tier: "oro",
    categoria: "cuotas",
    comprobar: (ctx) => ctx.mejorCuotaAcertada >= 5,
    progreso: (ctx) => progresoNumerico(ctx.mejorCuotaAcertada, 5, "de cuota", 2),
  },
  {
    id: "cuota-10",
    nombre: "Rompebancas",
    descripcion: "Acierta una apuesta con cuota ≥ 10",
    tier: "platino",
    categoria: "cuotas",
    comprobar: (ctx) => ctx.mejorCuotaAcertada >= 10,
    progreso: (ctx) => progresoNumerico(ctx.mejorCuotaAcertada, 10, "de cuota", 2),
  },
  {
    id: "cuota-20",
    nombre: "Milagro",
    descripcion: "Acierta una apuesta con cuota ≥ 20",
    tier: "platino",
    categoria: "cuotas",
    oculto: true,
    comprobar: (ctx) => ctx.mejorCuotaAcertada >= 20,
  },
  {
    id: "primera-combinada",
    nombre: "Tu primera combinada",
    descripcion: "Registra una combinada de 2 o más partidos",
    tier: "bronce",
    categoria: "combinadas",
    comprobar: (ctx) => ctx.combinadaCreada,
  },
  {
    id: "combinada-ganada",
    nombre: "Combinada ganadora",
    descripcion: "Acierta una combinada de 2 o más partidos",
    tier: "bronce",
    categoria: "combinadas",
    comprobar: (ctx) => ctx.combinadaGanada,
  },
  {
    id: "combinada-4",
    nombre: "Póker de aciertos",
    descripcion: "Acierta una combinada de 4 o más partidos",
    tier: "plata",
    categoria: "combinadas",
    comprobar: (ctx) => ctx.mejorCombinadaGanada >= 4,
    progreso: (ctx) => progresoNumerico(ctx.mejorCombinadaGanada, 4, "partidos"),
  },
  {
    id: "cinco-combinadas-ganadas",
    nombre: "Máquina de combinadas",
    descripcion: "Acierta 5 combinadas distintas",
    tier: "oro",
    categoria: "combinadas",
    comprobar: (ctx) => ctx.numCombinadasGanadas >= 5,
    progreso: (ctx) => progresoNumerico(ctx.numCombinadasGanadas, 5, "combinadas"),
  },
  {
    id: "combinada-6",
    nombre: "Sextuple",
    descripcion: "Acierta una combinada de 6 o más partidos",
    tier: "oro",
    categoria: "combinadas",
    comprobar: (ctx) => ctx.mejorCombinadaGanada >= 6,
    progreso: (ctx) => progresoNumerico(ctx.mejorCombinadaGanada, 6, "partidos"),
  },
  {
    id: "combinada-8",
    nombre: "El más difícil todavía",
    descripcion: "Acierta una combinada de 8 o más partidos",
    tier: "platino",
    categoria: "combinadas",
    oculto: true,
    comprobar: (ctx) => ctx.mejorCombinadaGanada >= 8,
  },
  {
    id: "cinco-casas",
    nombre: "Coleccionista",
    descripcion: "Usa 5 casas de apuestas distintas",
    tier: "plata",
    categoria: "especiales",
    oculto: true,
    comprobar: (ctx) => ctx.casasDistintas >= 5,
  },
  {
    id: "diez-casas",
    nombre: "Explorador",
    descripcion: "Usa 10 casas de apuestas distintas",
    tier: "oro",
    categoria: "especiales",
    oculto: true,
    comprobar: (ctx) => ctx.casasDistintas >= 10,
  },
  {
    id: "freebet-rentable",
    nombre: "Dinero gratis",
    descripcion: "Saca más de 20€ de beneficio de una sola freebet",
    tier: "plata",
    categoria: "especiales",
    oculto: true,
    comprobar: (ctx) => ctx.mejorBeneficioFreebet > 20,
  },
  {
    id: "cazafreebets",
    nombre: "Cazafreebets",
    descripcion: "Juega 5 freebets distintas",
    tier: "plata",
    categoria: "especiales",
    oculto: true,
    comprobar: (ctx) => ctx.numFreebets >= 5,
  },
  {
    id: "cashout-maestro",
    nombre: "Salida a tiempo",
    descripcion: "Haz Cash Out en 10 apuestas distintas",
    tier: "plata",
    categoria: "especiales",
    oculto: true,
    comprobar: (ctx) => ctx.numCashouts >= 10,
  },
  {
    id: "doble-juego",
    nombre: "Doble juego",
    descripcion: "Registra apuestas tanto en Apuestas como en Entretenimiento",
    tier: "bronce",
    categoria: "especiales",
    oculto: true,
    comprobar: (ctx) => ctx.bankrollsUsados >= 2,
  },
  {
    id: "todoterreno",
    nombre: "Todoterreno",
    descripcion: "Apuesta en 3 deportes distintos",
    tier: "plata",
    categoria: "especiales",
    oculto: true,
    comprobar: (ctx) => ctx.deportesDistintos >= 3,
  },
  {
    id: "red-seguridad",
    nombre: "Red de seguridad",
    descripcion: "Registra una apuesta asegurada",
    tier: "bronce",
    categoria: "especiales",
    oculto: true,
    comprobar: (ctx) => ctx.tieneSeguro,
  },
];

export function evaluarTrofeos(apuestas) {
  const contexto = construirContexto(apuestas);
  return TROFEOS.map((trofeo) => {
    const conseguido = trofeo.comprobar(contexto);
    return {
      ...trofeo,
      conseguido,
      // Sin progreso en los ocultos hasta desbloquearlos, para no delatar
      // el objetivo por adelantado.
      progreso:
        trofeo.progreso && !(trofeo.oculto && !conseguido)
          ? trofeo.progreso(contexto)
          : null,
    };
  });
}
