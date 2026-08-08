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
    seguroFreebetImporte:
      fila.seguro_freebet_importe === null ? null : Number(fila.seguro_freebet_importe),
    aumentoPct: fila.aumento_pct === null ? null : Number(fila.aumento_pct),
    archivado: fila.archivado ?? false,
    cuotaTotalManual:
      fila.cuota_total_manual === null || fila.cuota_total_manual === undefined
        ? null
        : Number(fila.cuota_total_manual),
  };
}

// Los datos viven en Supabase (tabla "apuestas"), no en localStorage: así
// PC y móvil ven siempre lo mismo. Al cargar se leen todas las apuestas del
// usuario, y una suscripción de Realtime mantiene la lista al día si se
// registra, edita o borra una apuesta desde otro dispositivo.
export function useApuestas(userId) {
  const [apuestas, setApuestas] = useState([]);

  useEffect(() => {
    if (!userId) return;

    let vivo = true;
    supabase
      .from("apuestas")
      .select("*")
      .order("creado_en", { ascending: false })
      .then(({ data, error }) => {
        if (vivo && !error) setApuestas(data.map(desdeFila));
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
    seguroFreebetImporte = null,
    aumentoPct = null,
    cuotaTotalManual = null,
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
        seguro_freebet_importe: seguroFreebetImporte,
        aumento_pct: aumentoPct,
        cuota_total_manual: cuotaTotalManual,
        selecciones: selecciones.map((seleccion) => ({
          id: crypto.randomUUID(),
          evento: seleccion.evento,
          apuesta: seleccion.apuesta,
          cuota: Number(seleccion.cuota),
          pais: seleccion.pais ?? null,
          competicion: seleccion.competicion ?? null,
          partidoId: seleccion.partidoId ?? null,
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
  async function editarApuesta(
    id,
    {
      fecha,
      casa,
      stake,
      selecciones,
      tipoFondos,
      deporte,
      seguroFreebetImporte = null,
      aumentoPct = null,
      cuotaTotalManual = null,
    }
  ) {
    const { data, error } = await supabase
      .from("apuestas")
      .update({
        fecha,
        casa,
        stake: Number(stake),
        tipo_fondos: tipoFondos,
        deporte,
        seguro_freebet_importe: seguroFreebetImporte,
        aumento_pct: aumentoPct,
        cuota_total_manual: cuotaTotalManual,
        selecciones: selecciones.map((seleccion) => ({
          id: crypto.randomUUID(),
          evento: seleccion.evento,
          apuesta: seleccion.apuesta,
          cuota: Number(seleccion.cuota),
          pais: seleccion.pais ?? null,
          competicion: seleccion.competicion ?? null,
          partidoId: seleccion.partidoId ?? null,
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

  // Resultado de una selección concreta dentro de una combinada (Ganada/
  // Perdida/Nula por partido, independiente del resultado final de toda la
  // apuesta — ver agruparSeleccionesPorPartido en utils/apuestas.js). Solo
  // se marca en la selección "líder" de ese partido (la que lleva la cuota
  // real); calcularCuotaTotal ya sabe ignorar las marcadas "nula" al
  // calcular el total. Al no haber una columna propia por selección
  // (jsonb), se reescribe el array completo con esa selección actualizada.
  async function marcarResultadoSeleccion(id, indice, resultado) {
    const apuestaActual = apuestas.find((a) => a.id === id);
    if (!apuestaActual) return;

    const nuevasSelecciones = apuestaActual.selecciones.map((seleccion, i) =>
      i === indice ? { ...seleccion, resultado } : seleccion
    );

    const { data, error } = await supabase
      .from("apuestas")
      .update({ selecciones: nuevasSelecciones })
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

  // Fase C: archiva (o desarchiva) todas las apuestas de un rango de
  // fechas, sin importar el bankroll — no se borra nada, solo se marcan
  // para que las vistas normales dejen de mostrarlas por defecto.
  async function archivarPorRango(desde, hasta, archivado) {
    const { error } = await supabase
      .from("apuestas")
      .update({ archivado })
      .eq("user_id", userId)
      .gte("fecha", desde)
      .lte("fecha", hasta);

    if (!error) {
      setApuestas((actuales) =>
        actuales.map((a) =>
          a.fecha >= desde && a.fecha <= hasta ? { ...a, archivado } : a
        )
      );
    }
  }

  return {
    apuestas,
    agregarApuesta,
    editarApuesta,
    marcarResultado,
    marcarResultadoSeleccion,
    borrarApuesta,
    borrarTodoBankroll,
    archivarPorRango,
  };
}
