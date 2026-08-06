import {
  calcularBeneficio,
  calcularCuotaTotal,
  ordenarCronologicamente,
} from "./apuestas";

function calcularMejorRacha(apuestasCronologicas) {
  let mejor = 0;
  let actual = 0;
  for (const apuesta of apuestasCronologicas) {
    if (apuesta.resultado === "ganada") {
      actual++;
      mejor = Math.max(mejor, actual);
    } else {
      actual = 0;
    }
  }
  return mejor;
}

// Detecta una victoria justo después de 3 o más derrotas seguidas (una remontada).
function hayRemontada(apuestasCronologicas) {
  let derrotasSeguidas = 0;
  for (const apuesta of apuestasCronologicas) {
    if (apuesta.resultado === "perdida") {
      derrotasSeguidas++;
    } else if (apuesta.resultado === "ganada") {
      if (derrotasSeguidas >= 3) return true;
      derrotasSeguidas = 0;
    }
  }
  return false;
}

// Todos los datos que necesitan los trofeos, calculados una sola vez.
function construirContexto(apuestas) {
  const cronologicas = ordenarCronologicamente(apuestas);
  const ganadas = apuestas.filter((a) => a.resultado === "ganada");
  const decididas = apuestas.filter(
    (a) => a.resultado === "ganada" || a.resultado === "perdida"
  );
  const freebetsGanadas = ganadas.filter((a) => a.tipoFondos === "freebet");

  return {
    totalApuestas: apuestas.length,
    mejorRacha: calcularMejorRacha(cronologicas),
    mejorCuotaAcertada: ganadas.reduce(
      (max, a) => Math.max(max, calcularCuotaTotal(a.selecciones)),
      0
    ),
    combinadaGanada: ganadas.some((a) => a.selecciones.length > 1),
    remontada: hayRemontada(cronologicas),
    aciertoPerfecto:
      decididas.length >= 10 && decididas.every((a) => a.resultado === "ganada"),
    casasDistintas: new Set(apuestas.map((a) => a.casa)).size,
    mejorBeneficioFreebet: freebetsGanadas.reduce(
      (max, a) => Math.max(max, calcularBeneficio(a)),
      0
    ),
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
    id: "cien-apuestas",
    nombre: "Historiador",
    descripcion: "Registra 100 apuestas",
    tier: "platino",
    categoria: "volumen",
    comprobar: (ctx) => ctx.totalApuestas >= 100,
    progreso: (ctx) => progresoNumerico(ctx.totalApuestas, 100, "apuestas"),
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
    id: "racha-10",
    nombre: "Leyenda",
    descripcion: "Consigue 10 victorias seguidas",
    tier: "oro",
    categoria: "rachas",
    comprobar: (ctx) => ctx.mejorRacha >= 10,
    progreso: (ctx) => progresoNumerico(ctx.mejorRacha, 10, "victorias seguidas"),
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
    id: "combinada-ganada",
    nombre: "Combinada ganadora",
    descripcion: "Acierta una combinada de 2 o más selecciones",
    tier: "bronce",
    categoria: "combinadas",
    comprobar: (ctx) => ctx.combinadaGanada,
  },
  {
    id: "remontada",
    nombre: "El fénix",
    descripcion:
      "Consigue una victoria justo después de perder 3 apuestas seguidas",
    tier: "plata",
    categoria: "especiales",
    oculto: true,
    comprobar: (ctx) => ctx.remontada,
  },
  {
    id: "perfeccionista",
    nombre: "Perfeccionista",
    descripcion:
      "Consigue un 100% de acierto con al menos 10 apuestas decididas",
    tier: "platino",
    categoria: "especiales",
    oculto: true,
    comprobar: (ctx) => ctx.aciertoPerfecto,
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
    id: "freebet-rentable",
    nombre: "Dinero gratis",
    descripcion: "Saca más de 20€ de beneficio de una sola freebet",
    tier: "plata",
    categoria: "especiales",
    oculto: true,
    comprobar: (ctx) => ctx.mejorBeneficioFreebet > 20,
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
