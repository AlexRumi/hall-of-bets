// Serverless Function de Vercel (no del propio Vite): se ejecuta en el
// servidor de Vercel, nunca en el navegador, así que aquí sí se puede usar
// la API key secreta de API-Football sin exponerla. El frontend solo llama
// a esta ruta (/api/partidos?fecha=YYYY-MM-DD), nunca a API-Football
// directamente.
//
// Se filtran estas competiciones (las que se pidió conectar); el resto de
// partidos del mundo que devuelve API-Football para ese día se descartan.
// IDs de las 22 primeras verificados a mano en el panel de API-Football
// del usuario el 2026-08-06; los 10 añadidos el 2026-08-10 (Austria,
// Dinamarca, Suiza, Turquía, Noruega, Suecia, Argentina, Brasil, México,
// Estados Unidos) se verificaron por curl directo contra la API con la
// key real — se comprobó que el id correspondía al nombre de liga
// correcto y que el plan gratuito devolvía datos reales (no
// "errors.plan") tanto en el rango de fechas cercano a hoy como en un
// rango histórico de control. Si algún día cambian de nombre de
// patrocinador (ya pasó con "LaLiga Hypermotion" y "Carabao Cup"), el id
// numérico no cambia. "pais" tiene que coincidir exactamente con el
// desplegable de src/components/BuscadorEvento.jsx (mismos nombres:
// "Inglaterra" en vez de "Reino Unido" — las 4 ligas conectadas son
// inglesas, no del resto del Reino Unido —, "Holanda" en vez de "Países
// Bajos", "Competición Europea" en vez de "Europa" — para no confundirlo
// con el país), y con src/utils/ligasConectadas.js.
//
// "temporal: true" (petición directa): competiciones de un solo partido o
// edición corta (Supercopa de Europa, y en el futuro Supercopa de España,
// Nations League...) — además del filtro normal de "sin partidos ese día"
// (BuscadorEvento.jsx, con los datos de esta misma respuesta), estas se
// ocultan también el mismo día en cuanto TODOS sus partidos de esa
// edición ya han terminado, para no dejar la competición "fantasma" en el
// desplegable el resto de la temporada hasta la próxima edición.
import { permiteLlamadaApiFootball } from "./_lib/limitadorApiFootball.js";

const LIGAS = {
  140: { pais: "España", competicion: "La Liga" },
  141: { pais: "España", competicion: "Segunda División" },
  143: { pais: "España", competicion: "Copa del Rey" },
  39: { pais: "Inglaterra", competicion: "Premier League" },
  40: { pais: "Inglaterra", competicion: "Championship" },
  45: { pais: "Inglaterra", competicion: "FA Cup" },
  48: { pais: "Inglaterra", competicion: "EFL Cup" },
  78: { pais: "Alemania", competicion: "Bundesliga" },
  79: { pais: "Alemania", competicion: "2. Bundesliga" },
  81: { pais: "Alemania", competicion: "DFB Pokal" },
  135: { pais: "Italia", competicion: "Serie A" },
  136: { pais: "Italia", competicion: "Serie B" },
  137: { pais: "Italia", competicion: "Coppa Italia" },
  61: { pais: "Francia", competicion: "Ligue 1" },
  62: { pais: "Francia", competicion: "Ligue 2" },
  66: { pais: "Francia", competicion: "Coupe de France" },
  94: { pais: "Portugal", competicion: "Primeira Liga" },
  88: { pais: "Holanda", competicion: "Eredivisie" },
  144: { pais: "Bélgica", competicion: "Jupiler Pro League" },
  2: { pais: "Competición Europea", competicion: "Champions League" },
  3: { pais: "Competición Europea", competicion: "Europa League" },
  848: { pais: "Competición Europea", competicion: "Conference League" },
  // Verificado por curl directo el 2026-08-12 (mismo patrón que las 10
  // ligas anteriores): id 531 = "UEFA Super Cup" (país "World" en
  // API-Football), temporada 2026 activa. GET /fixtures?date=2026-08-12
  // (el mismo método que usa esta función) devolvió el partido real de
  // hoy sin "errors.plan" — PSG - Aston Villa, 19:00 UTC, estado "NS".
  531: { pais: "Competición Europea", competicion: "Supercopa de Europa", temporal: true },
  218: { pais: "Austria", competicion: "Bundesliga austríaca" },
  119: { pais: "Dinamarca", competicion: "Superliga" },
  207: { pais: "Suiza", competicion: "Super League" },
  203: { pais: "Turquía", competicion: "Süper Lig" },
  103: { pais: "Noruega", competicion: "Eliteserien" },
  113: { pais: "Suecia", competicion: "Allsvenskan" },
  128: { pais: "Argentina", competicion: "Liga Profesional" },
  71: { pais: "Brasil", competicion: "Brasileirão Série A" },
  262: { pais: "México", competicion: "Liga MX" },
  253: { pais: "Estados Unidos", competicion: "MLS" },
  // Ampliación del 2026-09-01 ("Otras competiciones" del buscador de
  // partidos, ver PanelPartidos.jsx): 12 ligas más, elegidas a mano y
  // verificadas una a una con GET /leagues?id=X (no hace falta una fecha
  // concreta para este endpoint, solo confirmar que el id de verdad
  // corresponde a esa liga/país) — cada country/name de la respuesta
  // coincidió con lo esperado antes de añadirla aquí.
  179: { pais: "Escocia", competicion: "Premiership" },
  197: { pais: "Grecia", competicion: "Super League" },
  106: { pais: "Polonia", competicion: "Ekstraklasa" },
  210: { pais: "Croacia", competicion: "HNL" },
  345: { pais: "República Checa", competicion: "Czech Liga" },
  98: { pais: "Japón", competicion: "J1 League" },
  292: { pais: "Corea del Sur", competicion: "K League 1" },
  307: { pais: "Arabia Saudí", competicion: "Pro League" },
  188: { pais: "Australia", competicion: "A-League" },
  239: { pais: "Colombia", competicion: "Primera A" },
  265: { pais: "Chile", competicion: "Primera División" },
  268: { pais: "Uruguay", competicion: "Primera División" },
};

export default async function handler(req, res) {
  const { fecha } = req.query;

  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    res.status(400).json({ error: "Falta el parámetro fecha (YYYY-MM-DD)" });
    return;
  }

  // Límite propio antes de gastar cuota real (ver _lib/limitadorApiFootball.js)
  // — nunca deja salir más de 8 peticiones/minuto a la API de verdad, pase
  // lo que pase en el resto del código.
  if (!(await permiteLlamadaApiFootball())) {
    res.status(200).json({ partidos: [] });
    return;
  }

  try {
    // timezone=Europe/Madrid: sin esto, "fixture.date" viene en UTC — la
    // app es para un usuario en España, así que se pide directamente en su
    // hora local (evita tener que convertir a mano en el frontend, con el
    // lío del cambio de horario CET/CEST). Comprobado a mano el
    // 2026-08-10: el mismo partido pasa de "...+00:00" a "...+02:00" con
    // este parámetro, sin coste extra de cuota (mismo endpoint).
    const respuesta = await fetch(
      `https://v3.football.api-sports.io/fixtures?date=${fecha}&timezone=Europe/Madrid`,
      { headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY } }
    );

    if (!respuesta.ok) {
      res.status(502).json({ error: "No se pudo consultar API-Football" });
      return;
    }

    const datos = await respuesta.json();

    // El plan gratuito de API-Football solo deja consultar un rango corto
    // alrededor de hoy (~ayer/hoy/mañana, comprobado a mano el 2026-08-07:
    // pedir una fecha fuera de rango responde 200 con datos.errors.plan en
    // vez de un código de error HTTP — mismo patrón que ya pasó con la key
    // que falta). Se lo decimos al frontend en vez de devolver una lista
    // vacía indistinguible de "no hay partidos ese día".
    if (datos.errors?.plan) {
      res.status(200).json({ partidos: [], fueraDeRango: true });
      return;
    }

    // Cuota diaria agotada (plan gratuito: 100 peticiones/día) — comprobado
    // a mano el 2026-08-10 llamando a la API directamente: responde 200 con
    // datos.errors.requests = "You have reached the request limit for the
    // day...", igual de silencioso que el caso de arriba si no se detecta
    // aparte. Se distingue de "fueraDeRango" porque el aviso al usuario es
    // distinto (aquí no depende de la fecha elegida, mañana vuelve a
    // funcionar solo cuando la API resetee la cuota).
    if (datos.errors?.requests) {
      res.status(200).json({ partidos: [], cuotaAgotada: true });
      return;
    }

    // Cuenta suspendida (bug real, 2026-09-02): esto ANTES caía en el
    // "cualquier otro error" de abajo y se enseñaba como "cuota agotada" —
    // mensaje equivocado, porque no depende del día ni se arregla solo
    // mañana. Responde 200 con datos.errors.access = "Your account is
    // suspended, check on https://dashboard.api-football.com." — hace
    // falta entrar en el panel de API-Football a mano, no basta con
    // esperar.
    if (datos.errors?.access) {
      res.status(200).json({ partidos: [], cuentaSuspendida: true });
      return;
    }

    // Cualquier otro error no identificado todavía: se avisa como genérico
    // en vez de mentir diciendo "cuota agotada" (que llevaba a esperar un
    // día entero para nada si el motivo real era otro, como ya pasó).
    if (datos.errors && Object.keys(datos.errors).length > 0) {
      console.error("api/partidos: error no identificado de API-Football", datos.errors);
      res.status(200).json({ partidos: [], errorApi: true });
      return;
    }

    const partidos = (datos.response ?? [])
      // Orden cronológico (hora de verdad, no solo fecha): la API no
      // garantiza ningún orden concreto en su respuesta.
      .sort((a, b) => a.fixture.date.localeCompare(b.fixture.date))
      .filter((p) => LIGAS[p.league.id])
      .map((p) => ({
        id: p.fixture.id,
        evento: `${p.teams.home.name} - ${p.teams.away.name}`,
        pais: LIGAS[p.league.id].pais,
        competicion: LIGAS[p.league.id].competicion,
        // Competición de un solo partido/edición corta (ver LIGAS más
        // arriba) — BuscadorEvento.jsx la oculta sola en cuanto todos sus
        // partidos de esa edición han terminado, sin esperar a la
        // temporada siguiente.
        temporal: !!LIGAS[p.league.id].temporal,
        fecha: p.fixture.date.slice(0, 10),
        hora: p.fixture.date.slice(11, 16),
        // Estado y resultado: ya venían en la misma respuesta, sin
        // llamada aparte. "estado" es el código corto de API-Football
        // (NS = por jugar, FT/AET/PEN = terminado, 1H/HT/2H/... = en
        // juego) — BuscadorEvento.jsx decide qué mostrar según eso.
        estado: p.fixture.status.short,
        golesLocal: p.goals.home,
        golesVisitante: p.goals.away,
        // Ids de equipo (no del partido): alimentan el desplegable de
        // jugador de la categoría "Jugador" en SelectorMercado.jsx, vía
        // /api/jugadores (players/squads). No se usaban para nada más
        // hasta ahora.
        equipoLocalId: p.teams.home.id,
        equipoVisitanteId: p.teams.away.id,
      }));

    // Deja que Vercel cachee esta respuesta un rato (misma fecha = mismo
    // resultado): así, aunque dos pestañas o dos visitas distintas pidan el
    // mismo día, no hace falta llamar otra vez a API-Football. Bug real: con
    // 1h de caché fija, un partido de HOY que empieza/termina a media
    // mañana podía quedarse "por jugar" en el buscador de partidos durante
    // toda esa hora (el usuario lo vio con Argentina, partidos ya acabados
    // por la madrugada seguían enseñando la hora en vez del resultado). Los
    // días que NO son hoy (ayer/mañana, lo único que deja consultar el plan
    // gratuito) nunca cambian de estado, así que esos sí pueden cachearse
    // largo sin perder nada.
    const hoyMadrid = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date());
    res.setHeader(
      "Cache-Control",
      fecha === hoyMadrid
        ? "s-maxage=120, stale-while-revalidate=300"
        : "s-maxage=3600, stale-while-revalidate=86400"
    );
    res.status(200).json({ partidos });
  } catch {
    res.status(502).json({ error: "No se pudo consultar API-Football" });
  }
}
