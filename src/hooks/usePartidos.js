import { useEffect, useState } from "react";

// Caché a nivel de módulo, por fecha: si ya se pidieron los partidos de un
// día en esta visita, no se vuelve a llamar a /api/partidos (que a su vez
// solo llama a API-Football si Vercel no lo tiene ya en su propia caché).
// Guarda el objeto { partidos, fueraDeRango, cuotaAgotada } completo, no
// solo la lista, para no tener que volver a pedirlo solo por el aviso.
const cache = new Map();
const VACIO = { partidos: [], fueraDeRango: false, cuotaAgotada: false };

export function usePartidos(fecha) {
  const [resultado, setResultado] = useState(() => cache.get(fecha) ?? VACIO);

  useEffect(() => {
    if (!fecha) return;

    if (cache.has(fecha)) {
      setResultado(cache.get(fecha));
      return;
    }

    let vivo = true;
    fetch(`/api/partidos?fecha=${fecha}`)
      .then((r) => (r.ok ? r.json() : VACIO))
      .then((datos) => {
        const valor = {
          partidos: datos.partidos ?? [],
          fueraDeRango: !!datos.fueraDeRango,
          cuotaAgotada: !!datos.cuotaAgotada,
        };
        cache.set(fecha, valor);
        if (vivo) setResultado(valor);
      })
      .catch(() => {
        // Sin conexión, sin la función desplegada (p.ej. en "npm run dev"
        // normal, sin "vercel dev") o cualquier otro fallo: no pasa nada,
        // el buscador simplemente no sugiere nada y se sigue pudiendo
        // escribir el evento a mano como siempre.
        if (vivo) setResultado(VACIO);
      });

    return () => {
      vivo = false;
    };
  }, [fecha]);

  return resultado;
}
