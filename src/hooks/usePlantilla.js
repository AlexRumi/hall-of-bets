import { useEffect, useState } from "react";

// Caché a nivel de módulo, por equipo: las plantillas apenas cambian, así
// que una vez pedida la de un equipo en esta visita no se vuelve a pedir
// — a diferencia de usePartidos.js, que cachea por fecha porque los
// partidos sí cambian cada día.
const cache = new Map();
// Peticiones en curso, también por equipo (bug real, visto en el
// dashboard de API-Football: hasta 10 llamadas casi seguidas a
// v3/players/squads?team=X para el MISMO equipo). "Mercados" pinta una
// tarjeta por cada mercado de jugador —una docena— y todas arrancan con
// "Local" por defecto: al montar la vista, las doce llaman a
// usePlantilla(mismoEquipoLocal) en el mismo instante, y como la caché de
// arriba solo se rellena cuando la respuesta YA ha llegado, ninguna veía
// la petición de las demás y las doce disparaban su propio fetch. Ahora
// se guarda la PROMESA en curso por equipo — la primera llamada la crea,
// el resto se limita a esperar esa misma promesa en vez de lanzar otra.
const enCurso = new Map();

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
    let promesa = enCurso.get(equipoId);
    if (!promesa) {
      promesa = fetch(`/api/jugadores?equipo=${equipoId}`)
        .then((r) => (r.ok ? r.json() : { jugadores: [] }))
        .then((datos) => {
          const lista = datos.jugadores ?? [];
          // Solo se cachea un éxito real — un fallo (sin conexión, sin la
          // función desplegada) no se guarda, para que el próximo montaje
          // lo reintente en vez de quedarse con la lista vacía para
          // siempre (mismo criterio que ya tenía esto antes de este fix).
          cache.set(equipoId, lista);
          return lista;
        })
        .catch(() => {
          // Sin conexión, sin la función desplegada (npm run dev normal,
          // sin vercel dev) o cualquier otro fallo: no pasa nada, el
          // desplegable de jugador simplemente no tiene opciones y se cae
          // al campo de texto libre (ver SelectorMercado.jsx).
          return [];
        })
        .finally(() => enCurso.delete(equipoId));
      enCurso.set(equipoId, promesa);
    }

    promesa.then((lista) => {
      if (vivo) setJugadores(lista);
    });

    return () => {
      vivo = false;
    };
  }, [equipoId]);

  return jugadores;
}
