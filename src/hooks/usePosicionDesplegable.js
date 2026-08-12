import { useEffect, useState } from "react";

// Decide si el panel de un desplegable propio (SelectorDesplegable.jsx)
// abre hacia abajo o hacia arriba, según el hueco libre en cada dirección
// en el momento de abrirlo — así encaja bien tanto si el campo está arriba
// de la pantalla como si está pegado abajo del todo (donde antes se
// cortaba). Se mide solo al abrir, no en cada scroll: se decide una vez,
// sin perseguir al usuario mientras el panel ya está abierto (para eso,
// SelectorDesplegable.jsx cierra el panel si detecta scroll mientras está
// abierto, en vez de intentar recolocarlo).
//
// Bug real: el hueco se calculaba bien respecto a la VENTANA, pero el
// panel en sí iba en "position: absolute" — si el campo vivía dentro de
// un contenedor con su propio scroll y alto limitado (p.ej. el modal de
// detalle de una apuesta, ListaApuestas.jsx), ese contenedor recortaba el
// panel por su propio borde, sin que "el hueco de la ventana" tuviera
// nada que ver — el recorte real dependía de por dónde estuviera
// scrolleado ESE contenedor, no la ventana. Ahora se exponen también las
// coordenadas absolutas (left/width/top/bottom, en píxeles de ventana)
// para que el panel pueda ir en "position: fixed" — eso escapa de
// cualquier contenedor con scroll propio, ya no depende de dónde esté
// recortado ningún padre.
const MARGEN = 16;
const ALTURA_MINIMA = 120;

export function usePosicionDesplegable(abierto, ref) {
  const [posicion, setPosicion] = useState({
    arriba: false,
    maxAltura: 320,
    left: 0,
    width: 0,
    top: 0,
    bottom: 0,
  });

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
      left: rect.left,
      width: rect.width,
      top: rect.bottom,
      bottom: window.innerHeight - rect.top,
    });
  }, [abierto, ref]);

  return posicion;
}
