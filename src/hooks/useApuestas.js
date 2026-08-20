import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { desdeFila } from "../utils/apuestas";

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
    stakeFreebet = null,
    selecciones,
    categoria,
    tipoFondos,
    deporte,
    titulo = null,
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
        stake_freebet: stakeFreebet != null ? Number(stakeFreebet) : null,
        tipo_fondos: tipoFondos,
        categoria,
        deporte,
        titulo: titulo?.trim() ? titulo.trim() : null,
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
          // Bug real (2026-08-10): esta lista blanca no llevaba los ids de
          // equipo — se perdían ya al CREAR la apuesta, así que el
          // desplegable de jugador nunca podría haber encontrado la
          // plantilla al editarla después (nunca llegó a guardarse el id).
          equipoLocalId: seleccion.equipoLocalId ?? null,
          equipoVisitanteId: seleccion.equipoVisitanteId ?? null,
          hora: seleccion.hora ?? null,
          fecha: seleccion.fecha ?? null,
          golesLocalManual: seleccion.golesLocalManual ?? null,
          golesVisitanteManual: seleccion.golesVisitanteManual ?? null,
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
      stakeFreebet = null,
      selecciones,
      tipoFondos,
      deporte,
      titulo = null,
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
        stake_freebet: stakeFreebet != null ? Number(stakeFreebet) : null,
        tipo_fondos: tipoFondos,
        deporte,
        titulo: titulo?.trim() ? titulo.trim() : null,
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
          // Bug real (2026-08-10): esta lista blanca no llevaba
          // "resultado" ni los ids de equipo — editar una apuesta ya
          // marcada por picks (o con jugador elegido) por aquí los
          // borraba en silencio. Ahora que "resultado" deriva el
          // resultado real de la apuesta (beneficio/freebet/racha), no
          // solo el sello decorativo, era un fallo real.
          equipoLocalId: seleccion.equipoLocalId ?? null,
          equipoVisitanteId: seleccion.equipoVisitanteId ?? null,
          hora: seleccion.hora ?? null,
          fecha: seleccion.fecha ?? null,
          golesLocalManual: seleccion.golesLocalManual ?? null,
          golesVisitanteManual: seleccion.golesVisitanteManual ?? null,
          resultado: seleccion.resultado,
          // Marca interna del bot (api/telegram-avisos.js): si no se
          // preserva aquí, editar la apuesta por el formulario completo la
          // "olvidaría" en silencio y el aviso de partido terminado podría
          // repetirse una vez para ese partido — mismo motivo que ya llevó
          // a no perder "resultado" al editar.
          avisoEnviado: seleccion.avisoEnviado ?? null,
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

  // Resultado de UN PARTIDO dentro de una apuesta (Ganada/Perdida/Nula,
  // "Modificar" en ApuestaItem.jsx/TicketApuesta.jsx) — "indices" son los
  // de TODOS los picks de ese partido (un multi-mercado se marca entero
  // de una vez, no mercado a mercado), así que en una sola escritura basta
  // — "una llamada menos" que si se marcara pick a pick. Al no haber una
  // columna propia por selección (jsonb), se reescribe el array completo.
  async function marcarResultadoGrupo(id, indices, resultado) {
    const apuestaActual = apuestas.find((a) => a.id === id);
    if (!apuestaActual) return;

    const nuevasSelecciones = apuestaActual.selecciones.map((seleccion, i) =>
      indices.includes(i) ? { ...seleccion, resultado } : seleccion
    );

    // Si el partido ENTRA o SALE de "Nula", el conjunto de partidos que
    // cuentan en el producto cambia (ver calcularCuotaTotal) — un
    // cuotaTotalManual puesto antes se calculó para la combinada
    // completa, así que deja de tener sentido: se limpia para que la
    // cuota total vuelva a calcularse sola (petición directa, detectado
    // al probarlo con una combinada real).
    const eraNula = indices.some((i) => apuestaActual.selecciones[i]?.resultado === "nula");
    const limpiarCuotaManual =
      (eraNula || resultado === "nula") && apuestaActual.cuotaTotalManual != null;

    const { data, error } = await supabase
      .from("apuestas")
      .update({
        selecciones: nuevasSelecciones,
        ...(limpiarCuotaManual ? { cuota_total_manual: null } : {}),
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

  // Cuota de un partido concreto, ajustada a mano cuando la casa recalcula
  // tras anular UN MERCADO suyo (ej. un jugador que no fue titular) — ver
  // "Ajustar cuota (mercado anulado)" en ApuestaItem.jsx. Acción siempre
  // disponible, independiente del estado del partido (Ganada/Perdida/Nula
  // son otra cosa: el partido entero fuera de la combinada). Se guarda en
  // la selección "líder" de ese partido — la misma que ya lleva la cuota
  // real del grupo — no hay columna propia por selección (jsonb), así que
  // se reescribe el array completo.
  async function actualizarCuotaSeleccion(id, indice, nuevaCuota) {
    const apuestaActual = apuestas.find((a) => a.id === id);
    if (!apuestaActual) return;

    const nuevasSelecciones = apuestaActual.selecciones.map((seleccion, i) =>
      i === indice ? { ...seleccion, cuota: nuevaCuota } : seleccion
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
    marcarResultadoGrupo,
    actualizarCuotaSeleccion,
    borrarApuesta,
    borrarTodoBankroll,
    archivarPorRango,
  };
}
