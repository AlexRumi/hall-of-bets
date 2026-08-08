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
// de "trofeos-vistos", que es solo local): por ahora solo guarda la fecha
// de la última copia de seguridad exportada (Fase D), para que el aviso en
// Ajustes se vea igual en el móvil y en el PC.
export function useAjustes(userId) {
  const [ultimaCopia, setUltimaCopia] = useState(null);

  useEffect(() => {
    if (!userId) return;

    let vivo = true;
    supabase
      .from("ajustes")
      .select("ultima_copia")
      .maybeSingle()
      .then(({ data, error }) => {
        if (vivo && !error) {
          setUltimaCopia((actual) => masReciente(actual, data?.ultima_copia ?? null));
        }
      });

    const canal = supabase
      .channel("cambios-ajustes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ajustes", filter: `user_id=eq.${userId}` },
        (payload) => {
          const valor =
            payload.eventType === "DELETE" ? null : payload.new.ultima_copia ?? null;
          setUltimaCopia((actual) => masReciente(actual, valor));
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

  return { ultimaCopia, registrarCopiaRealizada };
}
