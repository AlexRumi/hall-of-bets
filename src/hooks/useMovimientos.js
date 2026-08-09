import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function desdeFila(fila) {
  return {
    id: fila.id,
    fecha: fila.fecha,
    casa: fila.casa,
    tipo: fila.tipo,
    cantidad: Number(fila.cantidad),
    archivado: fila.archivado ?? false,
    // Movimientos de antes de esta columna (o cualquiera sin categoría
    // asignada) quedan fuera de los dos bankrolls hasta que se corrijan a
    // mano — calcularBankrollPorCasa (utils/movimientos.js) los ignora al
    // filtrar por categoria, no cuentan ni para Apuestas ni Entretenimiento.
    categoria: fila.categoria ?? null,
  };
}

export function useMovimientos(userId) {
  const [movimientos, setMovimientos] = useState([]);

  useEffect(() => {
    if (!userId) return;

    let vivo = true;
    supabase
      .from("movimientos")
      .select("*")
      .order("creado_en", { ascending: false })
      .then(({ data, error }) => {
        if (vivo && !error) setMovimientos(data.map(desdeFila));
      });

    const canal = supabase
      .channel("cambios-movimientos")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "movimientos", filter: `user_id=eq.${userId}` },
        (payload) => {
          setMovimientos((actuales) => {
            if (payload.eventType === "DELETE") {
              return actuales.filter((m) => m.id !== payload.old.id);
            }
            const fila = desdeFila(payload.new);
            const yaEstaba = actuales.some((m) => m.id === fila.id);
            return yaEstaba
              ? actuales.map((m) => (m.id === fila.id ? fila : m))
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

  async function agregarMovimiento({ fecha, casa, tipo, cantidad, categoria }) {
    const { data, error } = await supabase
      .from("movimientos")
      .insert({ user_id: userId, fecha, casa, tipo, cantidad: Number(cantidad), categoria })
      .select()
      .single();

    if (!error) {
      setMovimientos((actuales) => [desdeFila(data), ...actuales]);
    }
  }

  async function borrarMovimiento(id) {
    const { error } = await supabase.from("movimientos").delete().eq("id", id);
    if (!error) {
      setMovimientos((actuales) => actuales.filter((m) => m.id !== id));
    }
  }

  async function borrarTodosMovimientos() {
    const { error } = await supabase
      .from("movimientos")
      .delete()
      .eq("user_id", userId);

    if (!error) setMovimientos([]);
  }

  // Fase C: archiva (o desarchiva) los movimientos de un rango de fechas
  // (mismo patrón que archivarPorRango de useApuestas.js).
  async function archivarPorRango(desde, hasta, archivado) {
    const { error } = await supabase
      .from("movimientos")
      .update({ archivado })
      .eq("user_id", userId)
      .gte("fecha", desde)
      .lte("fecha", hasta);

    if (!error) {
      setMovimientos((actuales) =>
        actuales.map((m) =>
          m.fecha >= desde && m.fecha <= hasta ? { ...m, archivado } : m
        )
      );
    }
  }

  return {
    movimientos,
    agregarMovimiento,
    borrarMovimiento,
    borrarTodosMovimientos,
    archivarPorRango,
  };
}
