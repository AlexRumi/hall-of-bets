import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function desdeFila(fila) {
  return {
    id: fila.id,
    casa: fila.casa,
    importe: Number(fila.importe),
    motivo: fila.motivo,
    fecha: fila.fecha,
  };
}

// Mismo patrón que useMovimientos.js. Sin "marcar como resuelto": borrar la
// fila (al registrar el freebet como apuesta, o simplemente al descartarlo)
// es el único estado final.
export function useBonosPendientes(userId) {
  const [bonos, setBonos] = useState([]);

  useEffect(() => {
    if (!userId) return;

    let vivo = true;
    supabase
      .from("bonos_pendientes")
      .select("*")
      .order("creado_en", { ascending: false })
      .then(({ data, error }) => {
        if (vivo && !error) setBonos(data.map(desdeFila));
      });

    const canal = supabase
      .channel("cambios-bonos-pendientes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bonos_pendientes",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setBonos((actuales) => {
            if (payload.eventType === "DELETE") {
              return actuales.filter((b) => b.id !== payload.old.id);
            }
            const fila = desdeFila(payload.new);
            const yaEstaba = actuales.some((b) => b.id === fila.id);
            return yaEstaba
              ? actuales.map((b) => (b.id === fila.id ? fila : b))
              : [fila, ...actuales];
          });
        }
      )
      .subscribe();

    return () => {
      vivo = false;
      supabase.removeChannel(canal);
    };
  }, [userId]);

  async function agregarBono({ casa, importe, motivo, fecha }) {
    const { data, error } = await supabase
      .from("bonos_pendientes")
      .insert({
        user_id: userId,
        casa,
        importe: Number(importe),
        motivo: motivo || null,
        fecha,
      })
      .select()
      .single();

    if (!error) {
      setBonos((actuales) => [desdeFila(data), ...actuales]);
    }
  }

  async function borrarBono(id) {
    const { error } = await supabase.from("bonos_pendientes").delete().eq("id", id);
    if (!error) {
      setBonos((actuales) => actuales.filter((b) => b.id !== id));
    }
  }

  return { bonos, agregarBono, borrarBono };
}
