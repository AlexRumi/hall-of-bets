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
  // Bug real: sin esto, "partidos: []" significaba dos cosas a la vez —
  // "todavía no ha llegado la respuesta" y "ya llegó, y no hay ninguno" —
  // y PanelPartidos.jsx no podía distinguirlas, así que enseñaba los
  // partidos de ejemplo (pensados para cuando de verdad no hay agenda
  // real, p.ej. en local sin "vercel dev") durante el segundo o así que
  // tarda la petición, hasta que la respuesta de verdad los reemplazaba
  // — un "flash" de partidos que no eran del día. "cargando" empieza en
  // true solo si esta fecha aún no estaba en caché.
  const [cargando, setCargando] = useState(() => !!fecha && !cache.has(fecha));

  useEffect(() => {
    if (!fecha) {
      setCargando(false);
      return;
    }

    if (cache.has(fecha)) {
      setResultado(cache.get(fecha));
      setCargando(false);
      return;
    }

    let vivo = true;
    setCargando(true);
    fetch(`/api/partidos?fecha=${fecha}`)
      .then((r) => (r.ok ? r.json() : VACIO))
      .then((datos) => {
        const valor = {
          partidos: datos.partidos ?? [],
          fueraDeRango: !!datos.fueraDeRango,
          cuotaAgotada: !!datos.cuotaAgotada,
        };
        cache.set(fecha, valor);
        if (vivo) {
          setResultado(valor);
          setCargando(false);
        }
      })
      .catch(() => {
        // Sin conexión, sin la función desplegada (p.ej. en "npm run dev"
        // normal, sin "vercel dev") o cualquier otro fallo: no pasa nada,
        // el buscador simplemente no sugiere nada y se sigue pudiendo
        // escribir el evento a mano como siempre. No se guarda en caché
        // (a diferencia del éxito) — si luego SÍ hay conexión/función,
        // que se vuelva a intentar en vez de quedarse con el fallo fijo.
        if (vivo) {
          setResultado(VACIO);
          setCargando(false);
        }
      });

    return () => {
      vivo = false;
    };
  }, [fecha]);

  return { ...resultado, cargando };
}
