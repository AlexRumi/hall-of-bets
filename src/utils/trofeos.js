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
function construirContexto(apuestas, promociones) {
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
    promoCompletada: promociones.some((p) => p.estado === "completada"),
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

// Catálogo de trofeos. Añadir uno nuevo es solo añadir un objeto más a este
// array: "oculto: true" lo mantiene en secreto (se ve como "???") hasta conseguirlo.
export const TROFEOS = [
  {
    id: "primera-apuesta",
    nombre: "Primeros pasos",
    descripcion: "Registra tu primera apuesta",
    tier: "bronce",
    comprobar: (ctx) => ctx.totalApuestas >= 1,
  },
  {
    id: "cinco-apuestas",
    nombre: "Cogiendo ritmo",
    descripcion: "Registra 5 apuestas",
    tier: "bronce",
    comprobar: (ctx) => ctx.totalApuestas >= 5,
  },
  {
    id: "veinticinco-apuestas",
    nombre: "Cuaderno lleno",
    descripcion: "Registra 25 apuestas",
    tier: "plata",
    comprobar: (ctx) => ctx.totalApuestas >= 25,
  },
  {
    id: "cien-apuestas",
    nombre: "Historiador",
    descripcion: "Registra 100 apuestas",
    tier: "platino",
    comprobar: (ctx) => ctx.totalApuestas >= 100,
  },
  {
    id: "racha-3",
    nombre: "En racha",
    descripcion: "Consigue 3 victorias seguidas",
    tier: "bronce",
    comprobar: (ctx) => ctx.mejorRacha >= 3,
  },
  {
    id: "racha-5",
    nombre: "Imparable",
    descripcion: "Consigue 5 victorias seguidas",
    tier: "plata",
    comprobar: (ctx) => ctx.mejorRacha >= 5,
  },
  {
    id: "racha-10",
    nombre: "Leyenda",
    descripcion: "Consigue 10 victorias seguidas",
    tier: "oro",
    comprobar: (ctx) => ctx.mejorRacha >= 10,
  },
  {
    id: "cuota-1-8",
    nombre: "Valentía premiada",
    descripcion: "Acierta una apuesta con cuota ≥ 1,8",
    tier: "bronce",
    comprobar: (ctx) => ctx.mejorCuotaAcertada >= 1.8,
  },
  {
    id: "cuota-3",
    nombre: "Cazador de cuotas",
    descripcion: "Acierta una apuesta con cuota ≥ 3",
    tier: "plata",
    comprobar: (ctx) => ctx.mejorCuotaAcertada >= 3,
  },
  {
    id: "cuota-5",
    nombre: "Pelotazo",
    descripcion: "Acierta una apuesta con cuota ≥ 5",
    tier: "oro",
    comprobar: (ctx) => ctx.mejorCuotaAcertada >= 5,
  },
  {
    id: "combinada-ganada",
    nombre: "Combinada ganadora",
    descripcion: "Acierta una combinada de 2 o más selecciones",
    tier: "bronce",
    comprobar: (ctx) => ctx.combinadaGanada,
  },
  {
    id: "primera-promo",
    nombre: "Cazapromos",
    descripcion: "Completa tu primera promoción",
    tier: "bronce",
    comprobar: (ctx) => ctx.promoCompletada,
  },
  {
    id: "remontada",
    nombre: "El fénix",
    descripcion:
      "Consigue una victoria justo después de perder 3 apuestas seguidas",
    tier: "plata",
    oculto: true,
    comprobar: (ctx) => ctx.remontada,
  },
  {
    id: "perfeccionista",
    nombre: "Perfeccionista",
    descripcion:
      "Consigue un 100% de acierto con al menos 10 apuestas decididas",
    tier: "platino",
    oculto: true,
    comprobar: (ctx) => ctx.aciertoPerfecto,
  },
  {
    id: "cinco-casas",
    nombre: "Coleccionista",
    descripcion: "Usa 5 casas de apuestas distintas",
    tier: "plata",
    oculto: true,
    comprobar: (ctx) => ctx.casasDistintas >= 5,
  },
  {
    id: "freebet-rentable",
    nombre: "Dinero gratis",
    descripcion: "Saca más de 20€ de beneficio de una sola freebet",
    tier: "plata",
    oculto: true,
    comprobar: (ctx) => ctx.mejorBeneficioFreebet > 20,
  },
];

export function evaluarTrofeos(apuestas, promociones) {
  const contexto = construirContexto(apuestas, promociones);
  return TROFEOS.map((trofeo) => ({
    ...trofeo,
    conseguido: trofeo.comprobar(contexto),
  }));
}
