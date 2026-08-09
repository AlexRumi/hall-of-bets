import { useEffect, useState } from "react";

// Caché a nivel de módulo, por equipo: las plantillas apenas cambian, así
// que una vez pedida la de un equipo en esta visita no se vuelve a pedir
// — a diferencia de usePartidos.js, que cachea por fecha porque los
// partidos sí cambian cada día.
const cache = new Map();

export function usePlantilla(equipoId) {
  const [jugadores, setJugadores] = useState(() => cache.get(equipoId) ?? []);

  useEffect(() => {
    if (!equipoId) {
      setJugadores([]);
      return;
    }

    if (cache.has(equipoId)) {
      setJugadores(cache.get(equipoId));
      return;
    }

    let vivo = true;
    fetch(`/api/jugadores?equipo=${equipoId}`)
      .then((r) => (r.ok ? r.json() : { jugadores: [] }))
      .then((datos) => {
        const lista = datos.jugadores ?? [];
        cache.set(equipoId, lista);
        if (vivo) setJugadores(lista);
      })
      .catch(() => {
        // Sin conexión, sin la función desplegada (npm run dev normal, sin
        // vercel dev) o cualquier otro fallo: no pasa nada, el desplegable
        // de jugador simplemente no tiene opciones y se cae al campo de
        // texto libre (ver SelectorMercado.jsx).
        if (vivo) setJugadores([]);
      });

    return () => {
      vivo = false;
    };
  }, [equipoId]);

  return jugadores;
}
