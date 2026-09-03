import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { desdeFila } from "../utils/apuestas";

// Bug real: "crypto.randomUUID()" solo existe en contextos seguros
// (localhost o HTTPS) — entrando desde el móvil por IP local
// (http://192.168.x.x:5173, ni localhost ni HTTPS) no existe, y guardar
// una apuesta explotaba con "crypto.randomUUID is not a function" (en
// escritorio, localhost, sí funcionaba). Este id solo identifica cada
// selección dentro del jsonb (no tiene ninguna relevancia de seguridad),
// así que un id de repuesto con Math.random vale igual cuando no está
// disponible el de verdad.
function idSeleccion() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `sel-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
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
          id: idSeleccion(),
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
          // Bug real (2026-09-03, migración a GOAL API): mismo motivo que
          // el de arriba con los ids de equipo — esta lista blanca
          // tampoco llevaba los escudos, así que se perdían al crear la
          // apuesta y el ticket caía siempre al icono de repuesto.
          escudoLocal: seleccion.escudoLocal ?? null,
          escudoVisitante: seleccion.escudoVisitante ?? null,
          hora: seleccion.hora ?? null,
          fecha: seleccion.fecha ?? null,
          golesLocalManual: seleccion.golesLocalManual ?? null,
          golesVisitanteManual: seleccion.golesVisitanteManual ?? null,
        })),
      })
      .select()
      .single();

    // Bug real: un error de Supabase aquí (RLS, columna inválida...) se
    // tragaba en silencio — el resto de la app no comprueba el resultado
    // de esta función, así que "no pasaba nada" sin ninguna pista de por
    // qué. Se registra y se relanza para que quien SÍ pueda reaccionar
    // (NuevaApuestaV3.jsx, con try/catch) muestre el motivo real.
    if (error) {
      console.error("Error al guardar la apuesta:", error);
      throw error;
    }

    // Se añade también en local al momento (no hay que esperar al eco de
    // Realtime), que igualmente llegará después y no duplicará nada.
    setApuestas((actuales) => [desdeFila(data), ...actuales]);
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
          id: idSeleccion(),
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
          // Bug real (2026-09-03, migración a GOAL API): mismo motivo que
          // el de arriba con los ids de equipo — esta lista blanca
          // tampoco llevaba los escudos, así que se perdían al editar la
          // apuesta y el ticket caía siempre al icono de repuesto.
          escudoLocal: seleccion.escudoLocal ?? null,
          escudoVisitante: seleccion.escudoVisitante ?? null,
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

  // Ajuste de ganancia (petición directa): algunas casas (Bet365, sobre
  // todo) pagan un poco más de lo que sale con "stake × cuota" porque
  // internamente calculan con más decimales de los que muestran. No es
  // una promoción con un % conocido (eso ya es "aumentoPct"), así que no
  // se puede recalcular sola — se guarda el TOTAL que de verdad pagó la
  // casa (stake + beneficio), igual que ya se hace con Cash Out, y
  // calcularBeneficio (utils/apuestas.js) resta el stake real para sacar
  // el beneficio de ahí. "importeTotal = null" quita el ajuste (vuelve a
  // calcularse solo). No toca "resultado" (sigue "ganada") ni el saldo de
  // freebet — ese solo depende del resultado, no de cuánto se ganó.
  async function ajustarGananciaManual(id, importeTotal) {
    const { data, error } = await supabase
      .from("apuestas")
      .update({
        ganancia_total_manual: importeTotal === null ? null : Number(importeTotal),
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

  // Resultado de uno o varios picks dentro de una apuesta (Ganada/Perdida/
  // Nula) — "indices" son las posiciones dentro del array de selecciones a
  // marcar con el mismo resultado; ApuestaItem.jsx llama a esto con un
  // único índice por cada mercado suelto que se cicla. Al no haber una
  // columna propia por selección (jsonb), se reescribe el array completo.
  //
  // "nuevoResultadoApuesta" (opcional): si el resultado de TODA la apuesta
  // cambia como consecuencia de este partido, se actualiza en la MISMA
  // escritura — App.jsx (manejarMarcarResultadoPartido) lo calcula y lo
  // pasa aquí. Bug real: antes eran dos llamadas independientes (esta
  // función + marcarResultado, cada una con su propio await), una carrera
  // de verdad entre sus dos respuestas — cuál llegaba después pisaba a la
  // otra en el estado local, y se veía como un parpadeo entre "Ganada" y
  // "Pendiente" antes de asentarse (detectado con capturas de un usuario).
  async function marcarResultadoGrupo(id, indices, resultado, nuevoResultadoApuesta = null) {
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

    const cambiaResultadoApuesta =
      nuevoResultadoApuesta != null && nuevoResultadoApuesta !== apuestaActual.resultado;

    const { data, error } = await supabase
      .from("apuestas")
      .update({
        selecciones: nuevasSelecciones,
        ...(limpiarCuotaManual ? { cuota_total_manual: null } : {}),
        ...(cambiaResultadoApuesta
          ? { resultado: nuevoResultadoApuesta, cashout_importe: null }
          : {}),
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

  // Al renombrar una casa (ver useCasas.js/editarNombreCasa), las apuestas
  // ya guardadas la referencian por texto ("casa" no es una clave foránea,
  // ver supabase-setup.sql) — sin esto se quedarían apuntando al nombre
  // viejo, invisibles para esa casa en filtros/estadísticas aunque los
  // datos siguieran intactos en la tabla. App.jsx dispara esto a la vez que
  // editarNombreCasa y renombrarCasaEnMovimientos, no hace falta llamarlo
  // por separado.
  async function renombrarCasaEnApuestas(nombreAnterior, nombreNuevo) {
    const { error } = await supabase
      .from("apuestas")
      .update({ casa: nombreNuevo })
      .eq("user_id", userId)
      .eq("casa", nombreAnterior);

    if (!error) {
      setApuestas((actuales) =>
        actuales.map((a) => (a.casa === nombreAnterior ? { ...a, casa: nombreNuevo } : a))
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
    ajustarGananciaManual,
    actualizarCuotaSeleccion,
    renombrarCasaEnApuestas,
    borrarApuesta,
    borrarTodoBankroll,
    archivarPorRango,
  };
}
