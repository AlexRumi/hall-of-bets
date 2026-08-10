import { useEffect, useState } from "react";

// Caché a nivel de módulo, por partido: mismo patrón que usePlantilla.js —
// una única petición por partido dentro de la visita, sin repetirla. Se
// descartó el "en directo" (repetir la petición cada pocos minutos
// mientras el partido siga en juego): con una combinada de varios
// partidos en juego a la vez, se comía la cuota diaria (100 peticiones)
// muy rápido. Así, si el partido aún no ha terminado cuando se pide, se
// enseña la hora sin más — para ver el resultado final basta con volver
// a abrir el detalle más tarde (nueva visita = nueva petición).
const cache = new Map();

export function usePartidoInfo(partidoId) {
  const [partido, setPartido] = useState(() => cache.get(partidoId) ?? null);

  useEffect(() => {
    if (!partidoId) {
      setPartido(null);
      return;
    }

    if (cache.has(partidoId)) {
      setPartido(cache.get(partidoId));
      return;
    }

    let vivo = true;
    fetch(`/api/partido?id=${partidoId}`)
      .then((r) => (r.ok ? r.json() : { partido: null }))
      .then((datos) => {
        const info = datos.partido ?? null;
        cache.set(partidoId, info);
        if (vivo) setPartido(info);
      })
      .catch(() => {
        // Sin conexión, sin la función desplegada (npm run dev normal, sin
        // vercel dev) o cualquier otro fallo: no pasa nada, simplemente no
        // se muestra la hora/resultado en la esquina — nunca bloquea el
        // detalle de la apuesta.
        if (vivo) setPartido(null);
      });

    return () => {
      vivo = false;
    };
  }, [partidoId]);

  return partido;
}
