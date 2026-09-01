import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// Las dos fechas ISO se pueden comparar como texto (mismo formato que ya usa
// el resto de la app, ver "fecha" en apuestas/movimientos). Se usa para no
// dejar que una respuesta que tarda más en llegar (el fetch inicial, la
// carga del canal realtime) pise por detrás el valor que ya se puso al
// registrar una copia — sin esto, exportar justo al entrar en Ajustes podía
// dejar el aviso desactualizado hasta la siguiente exportación.
function masReciente(a, b) {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

// Una sola fila por usuario, sincronizada entre dispositivos (a diferencia
// de "trofeos-vistos", que es solo local): la fecha de la última copia de
// seguridad exportada (Fase D) y, desde que se pidió unificar escritorio y
// móvil, qué ligas se han fijado con la estrellita en el buscador de
// partidos (antes vivía solo en localStorage de cada navegador — petición
// directa, para que fijar una liga en el móvil también se vea en el PC).
export function useAjustes(userId) {
  const [ultimaCopia, setUltimaCopia] = useState(null);
  const [ligasFijadas, setLigasFijadas] = useState(() => new Set());

  useEffect(() => {
    if (!userId) return;

    let vivo = true;
    supabase
      .from("ajustes")
      .select("ultima_copia, ligas_fijadas")
      .maybeSingle()
      .then(({ data, error }) => {
        if (vivo && !error) {
          setUltimaCopia((actual) => masReciente(actual, data?.ultima_copia ?? null));
          if (data?.ligas_fijadas) setLigasFijadas(new Set(data.ligas_fijadas));
        }
      });

    const canal = supabase
      .channel("cambios-ajustes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ajustes", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setUltimaCopia(null);
            setLigasFijadas(new Set());
            return;
          }
          const valor = payload.new.ultima_copia ?? null;
          setUltimaCopia((actual) => masReciente(actual, valor));
          setLigasFijadas(new Set(payload.new.ligas_fijadas ?? []));
        }
      )
      .subscribe();

    return () => {
      vivo = false;
      supabase.removeChannel(canal);
    };
  }, [userId]);

  // Upsert por user_id: como mucho hay una fila por usuario, así que
  // siempre sustituye a la anterior en vez de duplicar.
  async function registrarCopiaRealizada() {
    const ahora = new Date().toISOString();
    const { error } = await supabase
      .from("ajustes")
      .upsert({ user_id: userId, ultima_copia: ahora }, { onConflict: "user_id" });

    if (!error) setUltimaCopia((actual) => masReciente(actual, ahora));
  }

  // Optimista (actualiza el estado local antes de esperar la respuesta):
  // tocar la estrellita se nota al instante, sin esperar al viaje de ida y
  // vuelta a Supabase; si la escritura fallara, el canal realtime del otro
  // dispositivo simplemente no vería el cambio, pero este sigue mostrando
  // lo que el usuario acaba de marcar.
  async function alternarLigaFijada(clave) {
    const siguiente = new Set(ligasFijadas);
    if (siguiente.has(clave)) siguiente.delete(clave);
    else siguiente.add(clave);
    setLigasFijadas(siguiente);
    await supabase
      .from("ajustes")
      .upsert({ user_id: userId, ligas_fijadas: [...siguiente] }, { onConflict: "user_id" });
  }

  return { ultimaCopia, registrarCopiaRealizada, ligasFijadas, alternarLigaFijada };
}
