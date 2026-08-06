import { useEffect, useState } from "react";

// Caché a nivel de módulo, por fecha: si ya se pidieron los partidos de un
// día en esta visita, no se vuelve a llamar a /api/partidos (que a su vez
// solo llama a API-Football si Vercel no lo tiene ya en su propia caché).
const cache = new Map();

export function usePartidos(fecha) {
  const [partidos, setPartidos] = useState(() => cache.get(fecha) ?? []);

  useEffect(() => {
    if (!fecha) return;

    if (cache.has(fecha)) {
      setPartidos(cache.get(fecha));
      return;
    }

    let vivo = true;
    fetch(`/api/partidos?fecha=${fecha}`)
      .then((r) => (r.ok ? r.json() : { partidos: [] }))
      .then((datos) => {
        const lista = datos.partidos ?? [];
        cache.set(fecha, lista);
        if (vivo) setPartidos(lista);
      })
      .catch(() => {
        // Sin conexión, sin la función desplegada (p.ej. en "npm run dev"
        // normal, sin "vercel dev") o cualquier otro fallo: no pasa nada,
        // el buscador simplemente no sugiere nada y se sigue pudiendo
        // escribir el evento a mano como siempre.
        if (vivo) setPartidos([]);
      });

    return () => {
      vivo = false;
    };
  }, [fecha]);

  return partidos;
}
