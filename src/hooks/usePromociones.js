import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function desdeFila(fila) {
  return {
    id: fila.id,
    fecha: fila.fecha,
    casa: fila.casa,
    tipo: fila.tipo,
    valor: Number(fila.valor),
    estado: fila.estado,
    beneficioNeto: fila.beneficio_neto === null ? null : Number(fila.beneficio_neto),
  };
}

export function usePromociones(userId) {
  const [promociones, setPromociones] = useState([]);

  useEffect(() => {
    if (!userId) return;

    let vivo = true;
    supabase
      .from("promociones")
      .select("*")
      .order("creado_en", { ascending: false })
      .then(({ data, error }) => {
        if (vivo && !error) setPromociones(data.map(desdeFila));
      });

    const canal = supabase
      .channel("cambios-promociones")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "promociones", filter: `user_id=eq.${userId}` },
        (payload) => {
          setPromociones((actuales) => {
            if (payload.eventType === "DELETE") {
              return actuales.filter((p) => p.id !== payload.old.id);
            }
            const fila = desdeFila(payload.new);
            const yaEstaba = actuales.some((p) => p.id === fila.id);
            return yaEstaba
              ? actuales.map((p) => (p.id === fila.id ? fila : p))
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

  async function agregarPromocion({ fecha, casa, tipo, valor }) {
    const { data, error } = await supabase
      .from("promociones")
      .insert({
        user_id: userId,
        fecha,
        casa,
        tipo,
        valor: Number(valor),
        estado: "pendiente",
        beneficio_neto: null,
      })
      .select()
      .single();

    if (!error) {
      setPromociones((actuales) => [desdeFila(data), ...actuales]);
    }
  }

  // El beneficio neto no se puede calcular solo (cada promoción funciona
  // distinto), así que lo introduce el usuario al resolverla.
  async function resolverPromocion(id, estado, beneficioNeto) {
    const { data, error } = await supabase
      .from("promociones")
      .update({ estado, beneficio_neto: Number(beneficioNeto) })
      .eq("id", id)
      .select()
      .single();

    if (!error) {
      setPromociones((actuales) =>
        actuales.map((p) => (p.id === id ? desdeFila(data) : p))
      );
    }
  }

  async function borrarPromocion(id) {
    const { error } = await supabase.from("promociones").delete().eq("id", id);
    if (!error) {
      setPromociones((actuales) => actuales.filter((p) => p.id !== id));
    }
  }

  async function borrarTodasPromociones() {
    const { error } = await supabase
      .from("promociones")
      .delete()
      .eq("user_id", userId);

    if (!error) setPromociones([]);
  }

  return {
    promociones,
    agregarPromocion,
    resolverPromocion,
    borrarPromocion,
    borrarTodasPromociones,
  };
}
