import { useEffect, useState } from "react";

const CLAVE_ALMACENAMIENTO = "hall-of-bets:casas";

function cargarCasas() {
  try {
    const guardado = localStorage.getItem(CLAVE_ALMACENAMIENTO);
    return guardado ? JSON.parse(guardado) : [];
  } catch {
    return [];
  }
}

export function useCasas() {
  const [casas, setCasas] = useState(cargarCasas);

  useEffect(() => {
    localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(casas));
  }, [casas]);

  function agregarCasa(nombre) {
    const limpio = nombre.trim();
    if (!limpio) return;

    setCasas((actuales) =>
      actuales.some((casa) => casa.toLowerCase() === limpio.toLowerCase())
        ? actuales
        : [...actuales, limpio]
    );
  }

  return { casas, agregarCasa };
}
