import { useState } from "react";
import { Search, ChevronDown } from "lucide-react";
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

// Bandera por país — mismas claves exactas que ya usa api/partidos.js
// (objeto LIGAS) para no depender de traducciones ni comparar mal. Sin
// entrada para un país nuevo, se ve el nombre solo (sin bandera rota).
// Petición directa: antes era el emoji de bandera del sistema operativo,
// oculto en escritorio porque algunas versiones de Windows no renderizan
// bien los compuestos (país como par de letras regionales) y se veían en
// blanco o rotos. Ahora es una imagen SVG de flagcdn.com (gratis, sin
// api key, sin librería nueva que instalar) — se ve igual en cualquier
// sistema, así que ya no hace falta ocultarla en escritorio. Los valores
// son códigos ISO 3166-1 alfa-2 (flagcdn.com/{codigo}.svg), salvo "eu"
// (Unión Europea, para "Competición Europea") y "gb-eng" (bandera de
// Inglaterra en concreto — subdivisión de Reino Unido soportada por
// flagcdn.com; con el emoji no se podía usar la real de Inglaterra
// porque esos compuestos son aún más propensos a fallar en Windows, pero
// una imagen no tiene ese problema).
const CODIGOS_BANDERA = {
  Alemania: "de",
  Argentina: "ar",
  Austria: "at",
  Bélgica: "be",
  Brasil: "br",
  "Competición Europea": "eu",
  Dinamarca: "dk",
  España: "es",
  "Estados Unidos": "us",
  Francia: "fr",
  Holanda: "nl",
  Inglaterra: "gb-eng",
  Italia: "it",
  México: "mx",
  Noruega: "no",
  Portugal: "pt",
  Suecia: "se",
  Suiza: "ch",
  Turquía: "tr",
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

// Orden de los grupos País · Liga pedido explícitamente (antes salían en
// el orden que dejaba agruparPorPaisLiga, que a su vez depende de qué
// partido de cada grupo cae primero por hora — no de ningún criterio
// fijo, así que un día España podía salir después de Turquía sin más
// motivo que su hora de inicio). Tres bloques, en este orden:
// 1) Grandes ligas: España/Inglaterra/Alemania/Italia/Francia, cada una
//    con su liga principal, segunda división y copa en ese orden.
// 2) Competición Europea: Champions/Europa/Conference League.
// 3) El resto de países conectados, alfabético.
const ORDEN_GRANDES_LIGAS = [
  { pais: "España", competiciones: ["La Liga", "Segunda División", "Copa del Rey"] },
  { pais: "Inglaterra", competiciones: ["Premier League", "Championship", "FA Cup", "EFL Cup"] },
  { pais: "Alemania", competiciones: ["Bundesliga", "2. Bundesliga", "DFB Pokal"] },
  { pais: "Italia", competiciones: ["Serie A", "Serie B", "Coppa Italia"] },
  { pais: "Francia", competiciones: ["Ligue 1", "Ligue 2", "Coupe de France"] },
];
const ORDEN_COMPETICION_EUROPEA = ["Champions League", "Europa League", "Conference League"];

// (nivel, posición dentro del nivel, país para desempatar) por grupo —
// nivel 0 = grandes ligas (en su orden fijo), 1 = Competición Europea (en
// su orden fijo), 2 = el resto (alfabético por país). Cualquier liga que
// no esté en las listas de arriba (una recién conectada y aún no
// clasificada aquí, p.ej. la Supercopa de Europa, "temporal" en
// api/partidos.js) cae al final de su bloque en vez de desaparecer u
// ordenarse al azar.
function posicionOrden(g) {
  const indicePais = ORDEN_GRANDES_LIGAS.findIndex((l) => l.pais === g.pais);
  if (indicePais !== -1) {
    const indiceCompeticion = ORDEN_GRANDES_LIGAS[indicePais].competiciones.indexOf(g.competicion);
    return [0, indicePais, indiceCompeticion === -1 ? 99 : indiceCompeticion, g.pais];
  }
  if (g.pais === "Competición Europea") {
    const indiceCompeticion = ORDEN_COMPETICION_EUROPEA.indexOf(g.competicion);
    return [1, indiceCompeticion === -1 ? 99 : indiceCompeticion, 0, g.pais];
  }
  return [2, 0, 0, g.pais];
}

function ordenarGrupos(grupos) {
  return [...grupos].sort((a, b) => {
    const [na, ...restoA] = posicionOrden(a);
    const [nb, ...restoB] = posicionOrden(b);
    if (na !== nb) return na - nb;
    for (let i = 0; i < restoA.length; i++) {
      if (typeof restoA[i] === "string") return restoA[i].localeCompare(restoB[i]);
      if (restoA[i] !== restoB[i]) return restoA[i] - restoB[i];
    }
    return 0;
  });
}

export default function PanelPartidos({ fecha, matchIdActivo, onElegirPartido, contarSelecciones }) {
  const { partidos: partidosApi } = usePartidos(fecha);
  const usandoDemo = partidosApi.length === 0;
  const partidos = usandoDemo ? PARTIDOS_DEMO : partidosApi;
  const [busqueda, setBusqueda] = useState("");
  // Acordeón (petición directa, para no tener una lista larguísima de
  // partidos de golpe): un único grupo País · Liga abierto a la vez. Sin
  // tocar nada, empieza abierto el PRIMERO de la lista ya ordenada (con
  // el orden de arriba, normalmente España · La Liga) — "null" es ese
  // estado inicial "sin elegir todavía", no "todo cerrado"; en cuanto el
  // usuario toca cualquier cabecera, esa pasa a mandar (aunque sea la
  // misma que ya estaba abierta, la vuelve a cerrar).
  const [grupoAbierto, setGrupoAbierto] = useState(null);

  const objetivo = normalizarTexto(busqueda.trim());
  const filtrados = objetivo
    ? partidos.filter(
        (p) => normalizarTexto(p.evento).includes(objetivo) || normalizarTexto(p.competicion).includes(objetivo)
      )
    : partidos;
  const grupos = ordenarGrupos(agruparPorPaisLiga(filtrados));
  const claveAbierta = grupoAbierto ?? (grupos[0] ? `${grupos[0].pais}|${grupos[0].competicion}` : null);

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
        {grupos.map((g) => {
          const clave = `${g.pais}|${g.competicion}`;
          const abierta = clave === claveAbierta;
          return (
          <div key={clave} className="border-t border-gold/30 first:border-t-0">
            <button
              type="button"
              onClick={() => setGrupoAbierto(abierta ? "" : clave)}
              className="w-full sticky top-0 z-10 bg-felt text-paper px-3 py-2 flex items-center gap-2 text-left"
            >
              {CODIGOS_BANDERA[g.pais] && (
                <img
                  src={`https://flagcdn.com/${CODIGOS_BANDERA[g.pais]}.svg`}
                  alt=""
                  className="w-6 h-4 shrink-0 rounded-sm object-cover bg-paper/10"
                />
              )}
              <span className="text-sm font-semibold truncate">{g.pais}</span>
              <span className="text-sm text-paper/70 truncate">· {g.competicion}</span>
              <ChevronDown
                size={16}
                className={`shrink-0 transition-transform ${abierta ? "rotate-180" : ""}`}
              />
            </button>
            {abierta && g.partidos.map((p) => {
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
          );
        })}
        {grupos.length === 0 && (
          <p className="p-4 text-sm text-slate text-center">Sin partidos para ese filtro.</p>
        )}
      </div>
    </div>
  );
}
