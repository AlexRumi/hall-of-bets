import { useEffect, useState } from "react";

const CLAVE_ALMACENAMIENTO = "hall-of-bets:apuestas";

// Convierte apuestas guardadas con el formato de la Fase 2 (un solo
// evento + cuota) al formato con selecciones de la Fase 3, para no
// perder los datos que ya hubiera en localStorage.
function migrarApuesta(apuesta) {
  let migrada = apuesta;

  if (!migrada.selecciones) {
    const { evento, cuota, ...resto } = migrada;
    migrada = {
      ...resto,
      selecciones: [{ id: crypto.randomUUID(), evento, cuota }],
    };
  }

  // Las apuestas guardadas antes de la Fase 4 no tenían bankroll: las
  // damos por hechas en "Apuestas" (el bankroll principal).
  if (!migrada.categoria) {
    migrada = { ...migrada, categoria: "apuestas" };
  }

  // Las apuestas guardadas antes de la Fase 5 no tenían tipo de fondos:
  // todas eran con dinero real.
  if (!migrada.tipoFondos) {
    migrada = { ...migrada, tipoFondos: "real" };
  }

  return migrada;
}

function cargarApuestas() {
  try {
    const guardado = localStorage.getItem(CLAVE_ALMACENAMIENTO);
    return guardado ? JSON.parse(guardado).map(migrarApuesta) : [];
  } catch {
    return [];
  }
}

export function useApuestas() {
  const [apuestas, setApuestas] = useState(cargarApuestas);

  // Guardamos en localStorage cada vez que la lista cambia, para que no se pierda al recargar.
  useEffect(() => {
    localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(apuestas));
  }, [apuestas]);

  function agregarApuesta({
    fecha,
    casa,
    stake,
    selecciones,
    categoria,
    tipoFondos,
  }) {
    const nueva = {
      id: crypto.randomUUID(),
      fecha,
      casa,
      stake: Number(stake),
      selecciones: selecciones.map((seleccion) => ({
        id: crypto.randomUUID(),
        evento: seleccion.evento,
        cuota: Number(seleccion.cuota),
      })),
      resultado: "pendiente",
      categoria,
      tipoFondos,
    };
    setApuestas((actuales) => [nueva, ...actuales]);
  }

  function marcarResultado(id, resultado) {
    setApuestas((actuales) =>
      actuales.map((apuesta) =>
        apuesta.id === id ? { ...apuesta, resultado } : apuesta
      )
    );
  }

  function borrarApuesta(id) {
    setApuestas((actuales) => actuales.filter((apuesta) => apuesta.id !== id));
  }

  // Borra todas las apuestas de un bankroll (Apuestas o Entretenimiento),
  // sin tocar las del otro.
  function borrarTodoBankroll(categoria) {
    setApuestas((actuales) =>
      actuales.filter((apuesta) => apuesta.categoria !== categoria)
    );
  }

  return {
    apuestas,
    agregarApuesta,
    marcarResultado,
    borrarApuesta,
    borrarTodoBankroll,
  };
}
