// Cuotas de un partido concreto (fixture de API-Football), solo de las 5
// casas elegidas. A diferencia de api/partidos.js (que trae todos los
// partidos de un día de golpe), esto es una llamada por partido — se pide
// solo cuando el usuario pulsa "Ver cuotas" en el formulario, nunca en
// automático, para no gastar cuota de más.
const CASAS = {
  8: "Bet365",
  3: "Betfair",
  7: "William Hill",
  6: "Bwin",
  24: "Betway",
};

export default async function handler(req, res) {
  const { partido } = req.query;

  if (!partido || !/^\d+$/.test(partido)) {
    res.status(400).json({ error: "Falta el parámetro partido (id del fixture)" });
    return;
  }

  try {
    const respuesta = await fetch(
      `https://v3.football.api-sports.io/odds?fixture=${partido}`,
      { headers: { "x-apisports-key": process.env.API_FOOTBALL_KEY } }
    );

    if (!respuesta.ok) {
      res.status(502).json({ error: "No se pudo consultar API-Football" });
      return;
    }

    const datos = await respuesta.json();
    const bookmakers = datos.response?.[0]?.bookmakers ?? [];

    const cuotas = bookmakers
      .filter((b) => CASAS[b.id])
      .map((b) => {
        const ganador = b.bets.find((bet) => bet.name === "Match Winner");
        if (!ganador) return null;
        const valor = (nombre) => ganador.values.find((v) => v.value === nombre)?.odd ?? null;
        return {
          casa: CASAS[b.id],
          local: valor("Home"),
          empate: valor("Draw"),
          visitante: valor("Away"),
        };
      })
      .filter(Boolean);

    // Cuotas de media hora, por si se abre el mismo partido varias veces
    // seguidas — igualmente cambian a menudo, así que la caché es corta.
    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=3600");
    res.status(200).json({ cuotas });
  } catch {
    res.status(502).json({ error: "No se pudo consultar API-Football" });
  }
}
