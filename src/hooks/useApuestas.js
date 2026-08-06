import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function desdeFila(fila) {
  return {
    id: fila.id,
    fecha: fila.fecha,
    casa: fila.casa,
    stake: Number(fila.stake),
    selecciones: fila.selecciones,
    resultado: fila.resultado,
    categoria: fila.categoria,
    tipoFondos: fila.tipo_fondos,
    cashoutImporte:
      fila.cashout_importe === null ? null : Number(fila.cashout_importe),
    // Las apuestas de antes de tener este campo no tienen deporte asignado.
    deporte: fila.deporte ?? "Otro",
  };
}

// Los datos viven en Supabase (tabla "apuestas"), no en localStorage: así
// PC y móvil ven siempre lo mismo. Al cargar se leen todas las apuestas del
// usuario, y una suscripción de Realtime mantiene la lista al día si se
// registra, edita o borra una apuesta desde otro dispositivo.
export function useApuestas(userId) {
  const [apuestas, setApuestas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!userId) return;

    let vivo = true;
    supabase
      .from("apuestas")
      .select("*")
      .order("creado_en", { ascending: false })
      .then(({ data, error }) => {
        if (!vivo) return;
        if (!error) setApuestas(data.map(desdeFila));
        setCargando(false);
      });

    const canal = supabase
      .channel("cambios-apuestas")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "apuestas", filter: `user_id=eq.${userId}` },
        (payload) => {
          setApuestas((actuales) => {
            if (payload.eventType === "DELETE") {
              return actuales.filter((a) => a.id !== payload.old.id);
            }
            const fila = desdeFila(payload.new);
            const yaEstaba = actuales.some((a) => a.id === fila.id);
            return yaEstaba
              ? actuales.map((a) => (a.id === fila.id ? fila : a))
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

  async function agregarApuesta({
    fecha,
    casa,
    stake,
    selecciones,
    categoria,
    tipoFondos,
    deporte,
  }) {
    const { data, error } = await supabase
      .from("apuestas")
      .insert({
        user_id: userId,
        fecha,
        casa,
        stake: Number(stake),
        tipo_fondos: tipoFondos,
        categoria,
        deporte,
        resultado: "pendiente",
        selecciones: selecciones.map((seleccion) => ({
          id: crypto.randomUUID(),
          evento: seleccion.evento,
          apuesta: seleccion.apuesta,
          cuota: Number(seleccion.cuota),
        })),
      })
      .select()
      .single();

    // Se añade también en local al momento (no hay que esperar al eco de
    // Realtime), que igualmente llegará después y no duplicará nada.
    if (!error) {
      setApuestas((actuales) => [desdeFila(data), ...actuales]);
    }
  }

  // Actualiza los datos de una apuesta ya creada (para corregir errores al
  // escribirla), sin tocar su resultado ni el bankroll al que pertenece.
  async function editarApuesta(id, { fecha, casa, stake, selecciones, tipoFondos, deporte }) {
    const { data, error } = await supabase
      .from("apuestas")
      .update({
        fecha,
        casa,
        stake: Number(stake),
        tipo_fondos: tipoFondos,
        deporte,
        selecciones: selecciones.map((seleccion) => ({
          id: crypto.randomUUID(),
          evento: seleccion.evento,
          apuesta: seleccion.apuesta,
          cuota: Number(seleccion.cuota),
        })),
      })
      .eq("id", id)
      .select()
      .single();

    if (!error) {
      setApuestas((actuales) =>
        actuales.map((a) => (a.id === id ? desdeFila(data) : a))
      );
    }
  }

  // "cashoutImporte" solo se usa (y se guarda) cuando resultado es "cashout";
  // en cualquier otro caso se limpia, por si se estaba corrigiendo un cash out.
  async function marcarResultado(id, resultado, cashoutImporte = null) {
    const { data, error } = await supabase
      .from("apuestas")
      .update({
        resultado,
        cashout_importe: resultado === "cashout" ? Number(cashoutImporte) : null,
      })
      .eq("id", id)
      .select()
      .single();

    if (!error) {
      setApuestas((actuales) =>
        actuales.map((a) => (a.id === id ? desdeFila(data) : a))
      );
    }
  }

  async function borrarApuesta(id) {
    const { error } = await supabase.from("apuestas").delete().eq("id", id);
    if (!error) {
      setApuestas((actuales) => actuales.filter((a) => a.id !== id));
    }
  }

  // Borra todas las apuestas de un bankroll (Apuestas o Entretenimiento),
  // sin tocar las del otro.
  async function borrarTodoBankroll(categoria) {
    const { error } = await supabase
      .from("apuestas")
      .delete()
      .eq("user_id", userId)
      .eq("categoria", categoria);

    if (!error) {
      setApuestas((actuales) => actuales.filter((a) => a.categoria !== categoria));
    }
  }

  return {
    apuestas,
    cargando,
    agregarApuesta,
    editarApuesta,
    marcarResultado,
    borrarApuesta,
    borrarTodoBankroll,
  };
}
