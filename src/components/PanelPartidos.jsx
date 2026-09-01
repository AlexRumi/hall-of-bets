import { useState } from "react";
import { Search } from "lucide-react";
import { usePartidos } from "../hooks/usePartidos";
import { normalizarTexto } from "../utils/texto";
import { equiposDesdeEvento } from "../utils/mercados";

// Fase 2 del rediseño de "Nueva apuesta" (ver PROMPT_NUEVA_APUESTA_V3.md):
// lista de partidos del día, agrupados por País · Liga, con cabecera de
// grupo sticky, buscador libre y contador de selecciones ya confirmadas
// por partido (Fase 4-5 lo rellenan de verdad — de momento, si no llega
// "contarSelecciones", no se pinta ningún contador). Reutiliza el hook
// usePartidos.js tal cual (misma caché por fecha) — solo cambia la
// presentación respecto a BuscadorEvento.jsx (aquí no hay cascada
// país→liga por pestañas, se ve todo de golpe agrupado).
const PARTIDOS_DEMO = [
  { id: -1, evento: "Real Madrid - FC Barcelona", pais: "España", competicion: "LaLiga EA Sports", hora: "21:00", equipoLocalId: 541, equipoVisitanteId: 529 },
  { id: -2, evento: "Sevilla FC - Athletic Club", pais: "España", competicion: "LaLiga EA Sports", hora: "18:30", equipoLocalId: 536, equipoVisitanteId: 531 },
  { id: -3, evento: "Manchester United - Chelsea", pais: "Inglaterra", competicion: "Premier League", hora: "13:00", equipoLocalId: 33, equipoVisitanteId: 49 },
  { id: -4, evento: "Arsenal - Newcastle United", pais: "Inglaterra", competicion: "Premier League", hora: "16:00", equipoLocalId: 42, equipoVisitanteId: 34 },
  { id: -5, evento: "Inter - Napoli", pais: "Italia", competicion: "Serie A", hora: "20:45", equipoLocalId: 505, equipoVisitanteId: 492 },
  { id: -6, evento: "PSG - Manchester City", pais: "Competición Europea", competicion: "Champions League", hora: "21:00", equipoLocalId: 85, equipoVisitanteId: 50 },
];

// Bandera por país — mismas cadenas exactas que ya usa api/partidos.js
// (objeto LIGAS) para no depender de traducciones ni comparar mal. Sin
// entrada para un país nuevo, se ve el nombre solo (sin bandera rota).
const BANDERAS = {
  Alemania: "🇩🇪",
  Argentina: "🇦🇷",
  Austria: "🇦🇹",
  Bélgica: "🇧🇪",
  Brasil: "🇧🇷",
  "Competición Europea": "🇪🇺",
  Dinamarca: "🇩🇰",
  España: "🇪🇸",
  "Estados Unidos": "🇺🇸",
  Francia: "🇫🇷",
  Holanda: "🇳🇱",
  Inglaterra: "🇬🇧",
  Italia: "🇮🇹",
  México: "🇲🇽",
  Noruega: "🇳🇴",
  Portugal: "🇵🇹",
  Suecia: "🇸🇪",
  Suiza: "🇨🇭",
  Turquía: "🇹🇷",
};

function agruparPorPaisLiga(partidos) {
  const mapa = new Map();
  for (const p of partidos) {
    const clave = `${p.pais}|${p.competicion}`;
    if (!mapa.has(clave)) mapa.set(clave, { pais: p.pais, competicion: p.competicion, partidos: [] });
    mapa.get(clave).partidos.push(p);
  }
  return [...mapa.values()];
}

export default function PanelPartidos({ fecha, matchIdActivo, onElegirPartido, contarSelecciones }) {
  const { partidos: partidosApi } = usePartidos(fecha);
  const usandoDemo = partidosApi.length === 0;
  const partidos = usandoDemo ? PARTIDOS_DEMO : partidosApi;
  const [busqueda, setBusqueda] = useState("");

  const objetivo = normalizarTexto(busqueda.trim());
  const filtrados = objetivo
    ? partidos.filter(
        (p) => normalizarTexto(p.evento).includes(objetivo) || normalizarTexto(p.competicion).includes(objetivo)
      )
    : partidos;
  const grupos = agruparPorPaisLiga(filtrados);

  return (
    <div className="bg-surface border border-line rounded-xl overflow-hidden flex flex-col lg:max-h-[70vh]">
      <div className="p-3 border-b border-line space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-ink">Partidos de hoy</p>
          <span className="font-mono text-sm font-bold text-ink bg-paperDim border border-line rounded-full px-2.5 py-0.5">
            {partidos.length}
          </span>
        </div>
        {usandoDemo && (
          <p className="text-xs text-slate">
            No se ha podido cargar la agenda real (hace falta <code>vercel dev</code>, no{" "}
            <code>vite</code> a secas) — partidos de ejemplo mientras tanto.
          </p>
        )}
        <div className="flex items-center gap-2 bg-paperDim border border-line rounded-lg px-2.5 py-1.5">
          <Search size={14} className="text-slate shrink-0" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar equipo o liga"
            className="w-full bg-transparent text-sm outline-none text-ink placeholder:text-slate"
          />
        </div>
      </div>

      <div className="lg:overflow-y-auto lg:flex-1 scrollbar-oculto">
        {grupos.map((g) => (
          <div key={`${g.pais}|${g.competicion}`}>
            <div className="sticky top-0 z-10 bg-felt text-paper px-3 py-2 flex items-center gap-2">
              {BANDERAS[g.pais] && (
                <span className="w-6 h-5 shrink-0 flex items-center justify-center rounded bg-paper/10 text-xs">
                  {BANDERAS[g.pais]}
                </span>
              )}
              <span className="text-sm font-semibold truncate">{g.pais}</span>
              <span className="text-sm text-paper/70 truncate">· {g.competicion}</span>
            </div>
            {g.partidos.map((p) => {
              const { local, visitante } = equiposDesdeEvento(p.evento);
              const activo = matchIdActivo === p.id;
              const n = contarSelecciones?.(p.id) ?? 0;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onElegirPartido(p)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 border-b border-line/60 text-left transition-colors ${
                    activo
                      ? "bg-gold/15 border-l-[3px] border-l-gold"
                      : "border-l-[3px] border-l-transparent hover:bg-paperDim/60"
                  }`}
                >
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-ink truncate">{local}</span>
                    <span className="block text-sm font-medium text-ink truncate">{visitante}</span>
                  </span>
                  {n > 0 && (
                    <span className="font-mono text-xs text-gold bg-gold/10 border border-gold/40 rounded-full px-2 py-0.5 shrink-0">
                      {n}
                    </span>
                  )}
                  <span className="font-mono text-xs text-slate shrink-0">{p.hora}</span>
                </button>
              );
            })}
          </div>
        ))}
        {grupos.length === 0 && (
          <p className="p-4 text-sm text-slate text-center">Sin partidos para ese filtro.</p>
        )}
      </div>
    </div>
  );
}
