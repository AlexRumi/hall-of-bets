import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function desdeFila(fila) {
  return {
    categoria: fila.categoria,
    tipo: fila.tipo,
    periodo: fila.periodo,
    valorObjetivo: fila.valor_objetivo,
  };
}

// Mismo patrón que useCasas.js (fetch inicial + canal realtime + estado
// optimista). Como mucho hay 2 objetivos por usuario (uno por categoria,
// gracias al unique(user_id, categoria) de la tabla).
export function useObjetivos(userId) {
  const [objetivos, setObjetivos] = useState([]);

  useEffect(() => {
    if (!userId) return;

    let vivo = true;
    supabase
      .from("objetivos")
      .select("*")
      .then(({ data, error }) => {
        if (vivo && !error) setObjetivos(data.map(desdeFila));
      });

    const canal = supabase
      .channel("cambios-objetivos")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "objetivos", filter: `user_id=eq.${userId}` },
        (payload) => {
          setObjetivos((actuales) => {
            if (payload.eventType === "DELETE") {
              return actuales.filter((o) => o.categoria !== payload.old.categoria);
            }
            const fila = desdeFila(payload.new);
            const yaEstaba = actuales.some((o) => o.categoria === fila.categoria);
            return yaEstaba
              ? actuales.map((o) => (o.categoria === fila.categoria ? fila : o))
              : [...actuales, fila];
          });
        }
      )
      .subscribe();

    return () => {
      vivo = false;
      supabase.removeChannel(canal);
    };
  }, [userId]);

  // Upsert por (user_id, categoria): guardar uno nuevo para la misma
  // categoría sustituye al anterior, nunca crea un duplicado.
  async function guardarObjetivo({ categoria, tipo, periodo, valorObjetivo }) {
    const { data, error } = await supabase
      .from("objetivos")
      .upsert(
        {
          user_id: userId,
          categoria,
          tipo,
          periodo,
          valor_objetivo: valorObjetivo,
        },
        { onConflict: "user_id,categoria" }
      )
      .select()
      .single();

    if (!error) {
      const fila = desdeFila(data);
      setObjetivos((actuales) => {
        const yaEstaba = actuales.some((o) => o.categoria === fila.categoria);
        return yaEstaba
          ? actuales.map((o) => (o.categoria === fila.categoria ? fila : o))
          : [...actuales, fila];
      });
    }
  }

  async function borrarObjetivo(categoria) {
    const { error } = await supabase
      .from("objetivos")
      .delete()
      .eq("user_id", userId)
      .eq("categoria", categoria);

    if (!error) {
      setObjetivos((actuales) => actuales.filter((o) => o.categoria !== categoria));
    }
  }

  return { objetivos, guardarObjetivo, borrarObjetivo };
}
