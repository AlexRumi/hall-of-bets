import { useEffect, useState } from "react";

// Decide si el panel de un desplegable propio (SelectorDesplegable.jsx,
// SelectorMercado.jsx, los paneles de BuscadorEvento.jsx) abre hacia abajo
// o hacia arriba, según el hueco libre en cada dirección en el momento de
// abrirlo — así encaja bien tanto si el campo está arriba de la pantalla
// como si está pegado abajo del todo (donde antes se cortaba). Se mide solo
// al abrir, no en cada scroll: se decide una vez, sin perseguir al usuario
// mientras el panel ya está abierto.
const MARGEN = 16;
const ALTURA_MINIMA = 120;

export function usePosicionDesplegable(abierto, ref) {
  const [posicion, setPosicion] = useState({ arriba: false, maxAltura: 320 });

  useEffect(() => {
    if (!abierto || !ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const espacioAbajo = window.innerHeight - rect.bottom - MARGEN;
    const espacioArriba = rect.top - MARGEN;
    // Si abajo no hay ni 200px pero arriba hay más sitio, se abre hacia
    // arriba; si no, se queda como siempre (abajo), aunque el hueco sea
    // justo (ya tiene su propio scroll interno).
    const arriba = espacioAbajo < 200 && espacioArriba > espacioAbajo;
    setPosicion({
      arriba,
      maxAltura: Math.max(ALTURA_MINIMA, arriba ? espacioArriba : espacioAbajo),
    });
  }, [abierto, ref]);

  return posicion;
}
