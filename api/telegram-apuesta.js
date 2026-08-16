import { desdeFila } from "../src/utils/apuestas.js";
import { crearSupabaseAdmin, USER_ID } from "./_lib/supabaseAdmin.js";
import { verificarInitData } from "./_lib/telegramInitData.js";
import { marcarResultadoApuesta } from "./_lib/apuestasResueltas.js";

// Serverless Function que sirve a la Mini App de Telegram
// (src/components/TelegramMiniApp.jsx, ruta /telegram/apuesta/:id): trae
// una apuesta concreta y aplica cambios sobre ella — poner su resultado
// (accion "resultado", mismo "Modificar" que ApuestaItem.jsx en la web) o
// Cash Out (accion "cashout") — con marcarResultadoApuesta de
// api/_lib/apuestasResueltas.js, no se reescribe nada aquí. La única
// lógica propia de este archivo es verificar el initData que manda el SDK
// de Telegram Web App (api/_lib/telegramInitData.js) en vez del
// secret_token/ID de chat que usa el webhook, porque una Mini App no habla
// el protocolo de updates de Telegram, solo hace fetch() normal.
//
// El resultado final del partido (marcador, api/partido.js con su caché en
// resultados_partidos) NO pasa por aquí — la propia página de la Mini App
// llama al hook usePartidoInfo.js sin cambiarlo, exactamente igual que
// ApuestaItem.jsx en la app normal.

async function obtenerUsuarioVerificado(initData) {
  const verificacion = verificarInitData(initData, process.env.TELEGRAM_BOT_TOKEN);
  if (!verificacion.ok) return null;
  if (verificacion.telegramUserId !== process.env.TELEGRAM_OWNER_ID) return null;
  return verificacion.telegramUserId;
}

async function manejarGet(req, res, supabaseAdmin) {
  const initData = req.headers["x-telegram-init-data"];
  if (!(await obtenerUsuarioVerificado(initData))) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }

  const { id } = req.query;
  if (!id) {
    res.status(400).json({ error: "Falta id" });
    return;
  }

  const { data: apuesta, error } = await supabaseAdmin
    .from("apuestas")
    .select("*")
    .eq("id", id)
    .eq("user_id", USER_ID)
    .single();

  if (error || !apuesta) {
    res.status(404).json({ error: "Apuesta no encontrada" });
    return;
  }

  res.status(200).json({ apuesta: desdeFila(apuesta) });
}

async function manejarPost(req, res, supabaseAdmin) {
  const { initData, id, accion } = req.body ?? {};
  if (!(await obtenerUsuarioVerificado(initData))) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }
  if (!id || !accion) {
    res.status(400).json({ error: "Falta id o accion" });
    return;
  }

  const { data: apuesta, error } = await supabaseAdmin
    .from("apuestas")
    .select("*")
    .eq("id", id)
    .eq("user_id", USER_ID)
    .single();

  if (error || !apuesta) {
    res.status(404).json({ error: "Apuesta no encontrada" });
    return;
  }

  if (accion === "resultado") {
    // Pone el resultado de TODA la apuesta de una vez (mismo "Modificar"
    // que ApuestaItem.jsx en la web) — ya no hay marcado por pick, ver
    // CHANGELOG.md "de marcado por pick a un resultado por apuesta".
    const { resultado } = req.body;
    if (!["pendiente", "ganada", "perdida", "nula"].includes(resultado)) {
      res.status(400).json({ error: "resultado inválido" });
      return;
    }
    await marcarResultadoApuesta(supabaseAdmin, apuesta, resultado);
  } else if (accion === "cashout") {
    if (apuesta.resultado !== "pendiente") {
      res.status(409).json({ error: "Esta apuesta ya está resuelta" });
      return;
    }
    const importe = Number(req.body.importe);
    if (!Number.isFinite(importe) || importe < 0) {
      res.status(400).json({ error: "Importe inválido" });
      return;
    }
    await marcarResultadoApuesta(supabaseAdmin, apuesta, "cashout", importe);
  } else {
    res.status(400).json({ error: "Acción desconocida" });
    return;
  }

  const { data: actualizada } = await supabaseAdmin
    .from("apuestas")
    .select("*")
    .eq("id", id)
    .single();

  res.status(200).json({ apuesta: desdeFila(actualizada) });
}

export default async function handler(req, res) {
  const supabaseAdmin = crearSupabaseAdmin();

  try {
    if (req.method === "GET") {
      await manejarGet(req, res, supabaseAdmin);
    } else if (req.method === "POST") {
      await manejarPost(req, res, supabaseAdmin);
    } else {
      res.status(405).end();
    }
  } catch (error) {
    console.error("telegram-apuesta", error);
    res.status(500).json({ error: "Error interno" });
  }
}
