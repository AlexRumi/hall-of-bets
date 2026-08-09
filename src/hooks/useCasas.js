import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function desdeFila(fila) {
  return {
    nombre: fila.nombre,
    logo: fila.logo,
    freebetSaldoApuestas: Number(fila.freebet_saldo_apuestas ?? 0),
    freebetSaldoEntretenimiento: Number(fila.freebet_saldo_entretenimiento ?? 0),
  };
}

// Nombre del campo (estado local, camelCase) y de la columna (Supabase,
// snake_case) del saldo de freebet según el bankroll — para no repetir el
// mismo if/else en cada sitio de useCasas.js que toca este saldo.
function camposFreebet(categoria) {
  return categoria === "entretenimiento"
    ? { campo: "freebetSaldoEntretenimiento", columna: "freebet_saldo_entretenimiento" }
    : { campo: "freebetSaldoApuestas", columna: "freebet_saldo_apuestas" };
}

export function useCasas(userId) {
  const [casas, setCasas] = useState([]);

  useEffect(() => {
    if (!userId) return;

    let vivo = true;
    supabase
      .from("casas")
      .select("*")
      .then(({ data, error }) => {
        if (vivo && !error) setCasas(data.map(desdeFila));
      });

    const canal = supabase
      .channel("cambios-casas")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "casas", filter: `user_id=eq.${userId}` },
        (payload) => {
          setCasas((actuales) => {
            if (payload.eventType === "DELETE") {
              return actuales.filter((c) => c.nombre !== payload.old.nombre);
            }
            const fila = desdeFila(payload.new);
            const yaEstaba = actuales.some((c) => c.nombre === fila.nombre);
            return yaEstaba
              ? actuales.map((c) => (c.nombre === fila.nombre ? fila : c))
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

  // "logo" es opcional: una imagen en base64, o null si no se ha subido ninguna.
  async function agregarCasa({ nombre, logo = null }) {
    const limpio = nombre.trim();
    if (!limpio) return;
    if (casas.some((casa) => casa.nombre.toLowerCase() === limpio.toLowerCase())) {
      return;
    }

    const { data, error } = await supabase
      .from("casas")
      .insert({ user_id: userId, nombre: limpio, logo })
      .select()
      .single();

    if (!error) {
      setCasas((actuales) => [...actuales, desdeFila(data)]);
    }
  }

  // Borrar una casa del registro no toca las apuestas ya guardadas (su
  // campo "casa" es solo texto); si se vuelve a añadir con el
  // mismo nombre, esas apuestas antiguas recuperan el logo automáticamente.
  async function borrarCasa(nombre) {
    const { error } = await supabase
      .from("casas")
      .delete()
      .eq("user_id", userId)
      .eq("nombre", nombre);

    if (!error) {
      setCasas((actuales) => actuales.filter((casa) => casa.nombre !== nombre));
    }
  }

  // Ajusta el saldo de freebet de una casa (Fase A) para un bankroll
  // concreto ("apuestas" o "entretenimiento" — por defecto "apuestas" si no
  // se indica, por seguridad): delta positivo suma (bono de depósito,
  // seguro perdido, devolución por nula/borrado), negativo resta (al crear
  // una apuesta con fondos Freebet). Lee el saldo actual del propio estado
  // en vez de pedirlo a Supabase, así que dos ajustes seguidos (p.ej. crear
  // apuesta + marcarla nula después) no se pisan entre sí siempre que no se
  // disparen en el mismo instante.
  async function ajustarSaldoFreebet(nombre, delta, categoria = "apuestas") {
    const casaActual = casas.find((c) => c.nombre === nombre);
    if (!casaActual) return;
    const { campo, columna } = camposFreebet(categoria);
    const nuevoSaldo = casaActual[campo] + delta;

    const { error } = await supabase
      .from("casas")
      .update({ [columna]: nuevoSaldo })
      .eq("user_id", userId)
      .eq("nombre", nombre);

    if (!error) {
      setCasas((actuales) =>
        actuales.map((c) => (c.nombre === nombre ? { ...c, [campo]: nuevoSaldo } : c))
      );
    }
  }

  // Siempre en orden alfabético, así que cualquier casa nueva que se añada
  // en el futuro aparece sola en su sitio, sin tener que tocar nada más.
  const casasOrdenadas = [...casas].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es")
  );

  return { casas: casasOrdenadas, agregarCasa, borrarCasa, ajustarSaldoFreebet };
}
