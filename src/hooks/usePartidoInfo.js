import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { ESTADOS_TERMINADOS_PARTIDO as ESTADOS_TERMINADOS, MARGEN_RESULTADO_MS as MARGEN_MS } from "../utils/apuestas";

// Caché en dos niveles, pensada para gastar como mucho 1 llamada a
// API-Football por partido EN TODA LA VIDA de la app (no solo por sesión):
// 1. Caché en memoria (por pestaña, mismo patrón que usePlantilla.js).
// 2. Caché compartida en Supabase (tabla resultados_partidos, sin
//    caducidad): si tú, tu amigo o cualquier otra visita ya guardó el
//    resultado de este partido, se lee de ahí sin gastar ninguna llamada
//    nueva a la API.
// Si el partido probablemente no ha terminado todavía (hora de inicio + 2,5h
// sin pasar), no se consulta nada — ni la caché de Supabase ni la API: no
// tendría sentido, nadie podría haber guardado ya un resultado final.
// "horaInicioMs" puede ser null (partidos guardados antes de tener la hora
// del partido, o sin partido conectado) — en ese caso se consulta siempre,
// caso raro y autolimitado según se vayan creando apuestas nuevas.
const cache = new Map();

export function usePartidoInfo(partidoId, horaInicioMs) {
  const [partido, setPartido] = useState(() => cache.get(partidoId) ?? null);

  useEffect(() => {
    // Bug real (2026-09-03, migración a GOAL API): los ids de partido de
    // GOAL son strings; los de apuestas guardadas ANTES de la migración
    // son números de API-Football. GOAL API reutiliza esos mismos
    // números como su propio campo interno "apiId" — comprobado a mano:
    // pedir /fixtures/<número al azar de formato API-Football> puede
    // "acertar" por pura coincidencia un partido de GOAL sin relación
    // ninguna con el real, y devolver su resultado como si fuera el
    // bueno, sin ningún error. Para una apuesta de antes de la migración
    // no hay forma fiable de recuperar su resultado (el proveedor
    // antiguo sigue suspendido) — mejor no enseñar nada que enseñar un
    // marcador falso.
    if (!partidoId || typeof partidoId !== "string") {
      setPartido(null);
      return;
    }

    if (cache.has(partidoId)) {
      setPartido(cache.get(partidoId));
      return;
    }

    if (horaInicioMs && Date.now() < horaInicioMs + MARGEN_MS) {
      return;
    }

    let vivo = true;

    async function cargar() {
      const { data: enCache } = await supabase
        .from("resultados_partidos")
        .select("estado, goles_local, goles_visitante")
        .eq("partido_id", partidoId)
        .maybeSingle();

      if (enCache) {
        const info = {
          estado: enCache.estado,
          golesLocal: enCache.goles_local,
          golesVisitante: enCache.goles_visitante,
        };
        cache.set(partidoId, info);
        if (vivo) setPartido(info);
        return;
      }

      try {
        const respuesta = await fetch(`/api/partido?id=${partidoId}`);
        const datos = respuesta.ok ? await respuesta.json() : { partido: null };
        const info = datos.partido ?? null;

        if (info && ESTADOS_TERMINADOS.has(info.estado)) {
          // Se guarda para siempre en la caché compartida: a partir de
          // ahora, cualquiera que consulte este partido lo lee de aquí sin
          // gastar otra llamada. Si no está terminado (aplazado, o
          // sorprendentemente sigue en juego pasado el margen), no se
          // guarda — la próxima vez que se abra el detalle se volverá a
          // consultar.
          await supabase.from("resultados_partidos").upsert({
            partido_id: partidoId,
            estado: info.estado,
            goles_local: info.golesLocal,
            goles_visitante: info.golesVisitante,
          });
        }

        cache.set(partidoId, info);
        if (vivo) setPartido(info);
      } catch {
        // Sin conexión, sin la función desplegada (npm run dev normal, sin
        // vercel dev) o cualquier otro fallo: no pasa nada, simplemente no
        // se muestra el resultado — nunca bloquea el detalle de la apuesta.
        if (vivo) setPartido(null);
      }
    }

    cargar();

    return () => {
      vivo = false;
    };
  }, [partidoId, horaInicioMs]);

  return partido;
}
