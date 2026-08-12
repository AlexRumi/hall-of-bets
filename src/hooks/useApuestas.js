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

  // Cuota de un partido concreto, ajustada a mano tras anular uno de sus
  // picks (ver ApuestaItem.jsx: el aviso "¿cuál es la nueva cuota de la
  // casa?"). Se guarda en la selección "líder" de ese partido — la misma
  // que ya lleva la cuota real del grupo — mismo patrón que
  // marcarResultadoSeleccion: no hay columna propia por selección (jsonb),
  // así que se reescribe el array completo.
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

  // Marcador final escrito a mano (petición directa, solo para "Otras
  // ligas": sin partidoId no hay forma de traer el resultado automático de
  // API-Football — ver ApuestaItem.jsx/usePartidoInfo.js — así que es la
  // única manera de dejarlo anotado). Mismo patrón que
  // actualizarCuotaSeleccion: se guarda en la selección líder del partido.
  async function actualizarMarcadorManual(id, indice, golesLocal, golesVisitante) {
    const apuestaActual = apuestas.find((a) => a.id === id);
    if (!apuestaActual) return;

    const nuevasSelecciones = apuestaActual.selecciones.map((seleccion, i) =>
      i === indice
        ? { ...seleccion, golesLocalManual: golesLocal, golesVisitanteManual: golesVisitante }
        : seleccion
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
    actualizarCuotaSeleccion,
    actualizarMarcadorManual,
    borrarApuesta,
    borrarTodoBankroll,
    archivarPorRango,
  };
}
