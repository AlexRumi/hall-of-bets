import { useEffect, useState } from "react";

// Caché a nivel de módulo, por partido: reabrir el diálogo de cuotas para
// el mismo partido durante la misma visita no vuelve a llamar a la función
// (mismo patrón que usePartidos.js para el buscador).
const cache = new Map();

export function useCuotas(partidoId, activo) {
  const [cuotas, setCuotas] = useState(() => cache.get(partidoId) ?? null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!activo || !partidoId) return;

    if (cache.has(partidoId)) {
      setCuotas(cache.get(partidoId));
      setError(false);
      return;
    }

    let vivo = true;
    setCargando(true);
    setError(false);

    fetch(`/api/cuotas?partido=${partidoId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((datos) => {
        const lista = datos.cuotas ?? [];
        cache.set(partidoId, lista);
        if (vivo) setCuotas(lista);
      })
      .catch(() => {
        if (vivo) setError(true);
      })
      .finally(() => {
        if (vivo) setCargando(false);
      });

    return () => {
      vivo = false;
    };
  }, [activo, partidoId]);

  return { cuotas, cargando, error };
}
