import { useState } from "react";
import { Search, ChevronDown, Star, AlertTriangle, Pencil, X } from "lucide-react";
import { usePartidos } from "../hooks/usePartidos";
import { normalizarTexto } from "../utils/texto";
import { equiposDesdeEvento, escudoUrl } from "../utils/mercados";
import { ESTADOS_TERMINADOS_PARTIDO } from "../utils/apuestas";

// Fase 2 del rediseño de "Nueva apuesta" (ver PROMPT_NUEVA_APUESTA_V3.md):
// lista de partidos del día, agrupados por País · Liga, con cabecera de
// grupo sticky, buscador libre y contador de selecciones ya confirmadas
// por partido (Fase 4-5 lo rellenan de verdad — de momento, si no llega
// "contarSelecciones", no se pinta ningún contador). Reutiliza el hook
// usePartidos.js tal cual (misma caché por fecha) — solo cambia la
// presentación respecto a BuscadorEvento.jsx (aquí no hay cascada
// país→liga por pestañas, se ve todo de golpe agrupado).
const PARTIDOS_DEMO = [
  // Solo este trae "estado"/goles (petición directa, para ver en local
  // el aviso rojo de "partidos terminados" sin depender de la API real)
  // — el resto de ejemplo se queda "por jugar" como siempre.
  { id: -1, evento: "Real Madrid - FC Barcelona", pais: "España", competicion: "LaLiga EA Sports", hora: "21:00", equipoLocalId: 541, equipoVisitanteId: 529, estado: "FT", golesLocal: 2, golesVisitante: 1 },
  { id: -2, evento: "Sevilla FC - Athletic Club", pais: "España", competicion: "LaLiga EA Sports", hora: "18:30", equipoLocalId: 536, equipoVisitanteId: 531 },
  { id: -3, evento: "Manchester United - Chelsea", pais: "Inglaterra", competicion: "Premier League", hora: "13:00", equipoLocalId: 33, equipoVisitanteId: 49 },
  { id: -4, evento: "Arsenal - Newcastle United", pais: "Inglaterra", competicion: "Premier League", hora: "16:00", equipoLocalId: 42, equipoVisitanteId: 34 },
  { id: -5, evento: "Inter - Napoli", pais: "Italia", competicion: "Serie A", hora: "20:45", equipoLocalId: 505, equipoVisitanteId: 492 },
  { id: -6, evento: "PSG - Manchester City", pais: "Competición Europea", competicion: "Champions League", hora: "21:00", equipoLocalId: 85, equipoVisitanteId: 50 },
  // Único de ejemplo que NO es de una liga favorita — sin este, en local
  // (sin "vercel dev") "Otras competiciones (A-Z)" nunca tenía nada que
  // enseñar, porque el resto de ejemplo son todo ligas favoritas.
  { id: -7, evento: "River Plate - Boca Juniors", pais: "Argentina", competicion: "Liga Profesional", hora: "22:00", equipoLocalId: 451, equipoVisitanteId: 458 },
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
  "Arabia Saudí": "sa",
  Argentina: "ar",
  Australia: "au",
  Austria: "at",
  Bélgica: "be",
  Brasil: "br",
  Chile: "cl",
  Colombia: "co",
  "Competición Europea": "eu",
  "Corea del Sur": "kr",
  Croacia: "hr",
  Dinamarca: "dk",
  Escocia: "gb-sct",
  España: "es",
  "Estados Unidos": "us",
  Francia: "fr",
  Grecia: "gr",
  Holanda: "nl",
  Inglaterra: "gb-eng",
  Italia: "it",
  Japón: "jp",
  México: "mx",
  Noruega: "no",
  Polonia: "pl",
  Portugal: "pt",
  "República Checa": "cz",
  Suecia: "se",
  Suiza: "ch",
  Turquía: "tr",
  Uruguay: "uy",
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

// Orden de los grupos País · Liga (petición directa — antes salían en el
// orden que dejaba agruparPorPaisLiga, que a su vez depende de qué
// partido de cada grupo cae primero por hora, sin ningún criterio fijo).
// Dos bloques, de arriba a abajo:
// 1) "Competiciones favoritas": las que el usuario ha marcado con la
//    estrellita — nada fijo por código, "favorita" es solo lo que él
//    elige (antes "Grandes ligas" iba aparte siempre arriba; ya no: si
//    no la fijas, va con el resto de "Otras").
// 2) "Otras competiciones (A-Z)": todo lo demás, alfabético por país —
//    sea una liga grande o pequeña, da igual.
// Dentro de cada país, en qué orden van sus competiciones (liga
// principal, luego segunda división/copa) — solo hace falta para los
// países con más de una competición conectada. El resto (una sola liga)
// no necesita entrada aquí: sin ella, esa única competición ya sale bien.
const ORDEN_COMPETICIONES_POR_PAIS = {
  España: ["La Liga", "Segunda División", "Copa del Rey"],
  Inglaterra: ["Premier League", "Championship", "FA Cup", "EFL Cup"],
  Alemania: ["Bundesliga", "2. Bundesliga", "DFB Pokal"],
  Italia: ["Serie A", "Serie B", "Coppa Italia"],
  Francia: ["Ligue 1", "Ligue 2", "Coupe de France"],
  "Competición Europea": ["Champions League", "Europa League", "Conference League"],
};

// (nivel, país, posición de la competición dentro del país) por grupo —
// nivel 0 = favorita (fijada), 1 = el resto. Cualquier competición sin
// entrada en ORDEN_COMPETICIONES_POR_PAIS (una recién conectada y aún no
// clasificada ahí, p.ej. la Supercopa de Europa, "temporal" en
// api/partidos.js) cae al final de su país en vez de desaparecer u
// ordenarse al azar.
function posicionOrden(g, ligasFijadas) {
  const nivel = ligasFijadas.has(`${g.pais}|${g.competicion}`) ? 0 : 1;
  const ordenCompeticiones = ORDEN_COMPETICIONES_POR_PAIS[g.pais];
  const indiceCompeticion = ordenCompeticiones ? ordenCompeticiones.indexOf(g.competicion) : -1;
  return [nivel, g.pais, indiceCompeticion === -1 ? 99 : indiceCompeticion];
}

function ordenarGrupos(grupos, ligasFijadas) {
  return [...grupos].sort((a, b) => {
    const [na, paisA, ordenA] = posicionOrden(a, ligasFijadas);
    const [nb, paisB, ordenB] = posicionOrden(b, ligasFijadas);
    if (na !== nb) return na - nb;
    if (paisA !== paisB) return paisA.localeCompare(paisB);
    return ordenA - ordenB;
  });
}

// Ligas fijadas con la estrellita: petición directa, sincronizado entre
// dispositivos (tabla "ajustes" de Supabase, ver useAjustes.js) — antes
// vivía en localStorage de cada navegador, así que fijar una liga en el
// móvil no se veía en el PC y viceversa. "ligasFijadas"/
// "onAlternarLigaFijada" llegan como props desde App.jsx (mismo patrón
// que "casas"/"apuestas": el estado de verdad vive arriba, este
// componente no gestiona su propia copia).
export default function PanelPartidos({
  fecha,
  matchIdActivo,
  onElegirPartido,
  contarSelecciones,
  ligasFijadas,
  onAlternarLigaFijada,
}) {
  const {
    partidos: partidosApi,
    cargando,
    cuotaAgotada,
    cuentaSuspendida,
    errorApi,
  } = usePartidos(fecha);
  // Mientras "cargando" es true todavía no se sabe si habrá agenda real
  // o no — enseñar ya los partidos de ejemplo aquí sería el "flash" de
  // partidos que no son del día (bug real, visto en la app desplegada:
  // se veían un instante los de ejemplo antes de que llegara la
  // respuesta de verdad). Solo se cae a los de ejemplo cuando la
  // petición YA terminó y de verdad no trajo nada.
  const usandoDemo = !cargando && partidosApi.length === 0;
  const partidos = usandoDemo ? PARTIDOS_DEMO : partidosApi;
  const [busqueda, setBusqueda] = useState("");
  // Escribir un partido a mano (petición directa): mientras la agenda
  // real no cargue (cuenta suspendida, cuota agotada, cualquier error de
  // la API...), esta es la única forma de seguir registrando apuestas de
  // verdad sin esperar a que se arregle. El "partido" que se construye
  // aquí tiene un id NEGATIVO (como los de PARTIDOS_DEMO) para que el
  // resto de la app lo trate igual que uno de ejemplo: sin partidoId real
  // (no hay marcador automático ni jugadores reales, se cae a los mismos
  // sitios que ya usan esa gente/marcador de repuesto), pero con nombre,
  // hora y competición de verdad, elegidos por el usuario.
  const [mostrandoManual, setMostrandoManual] = useState(false);
  const [manualLocal, setManualLocal] = useState("");
  const [manualVisitante, setManualVisitante] = useState("");
  const [manualPais, setManualPais] = useState("");
  const [manualCompeticion, setManualCompeticion] = useState("");
  const [manualHora, setManualHora] = useState("");

  function confirmarPartidoManual() {
    if (!manualLocal.trim() || !manualVisitante.trim()) return;
    onElegirPartido({
      id: -Date.now(),
      evento: `${manualLocal.trim()} - ${manualVisitante.trim()}`,
      pais: manualPais.trim() || "Otras ligas",
      competicion: manualCompeticion.trim() || "Escrito a mano",
      hora: manualHora.trim() || null,
      fecha,
      equipoLocalId: null,
      equipoVisitanteId: null,
      temporal: false,
    });
    setMostrandoManual(false);
    setManualLocal("");
    setManualVisitante("");
    setManualPais("");
    setManualCompeticion("");
    setManualHora("");
  }
  // Acordeón (petición directa, para no tener una lista larguísima de
  // partidos de golpe): un único grupo País · Liga abierto a la vez.
  // Empiezan todas cerradas (petición directa: antes se abría sola la
  // primera de la lista) — el usuario elige cuál abrir.
  const [grupoAbierto, setGrupoAbierto] = useState("");

  const objetivo = normalizarTexto(busqueda.trim());
  const filtrados = objetivo
    ? partidos.filter(
        (p) => normalizarTexto(p.evento).includes(objetivo) || normalizarTexto(p.competicion).includes(objetivo)
      )
    : partidos;
  const grupos = ordenarGrupos(agruparPorPaisLiga(filtrados), ligasFijadas);
  const claveAbierta = grupoAbierto;
  const terminados = partidos.filter((p) => ESTADOS_TERMINADOS_PARTIDO.has(p.estado)).length;
  // Dos secciones (petición directa): "Competiciones favoritas" (las
  // fijadas con la estrellita) y "Otras competiciones" (todo lo demás,
  // sea una liga grande o pequeña) — "grupos" ya viene ordenado así de
  // ordenarGrupos, así que filtrar conserva ese orden dentro de cada una.
  const gruposFavoritos = grupos.filter((g) => ligasFijadas.has(`${g.pais}|${g.competicion}`));
  const gruposOtros = grupos.filter((g) => !ligasFijadas.has(`${g.pais}|${g.competicion}`));

  // Una liga y sus partidos (si está desplegada) — función aparte en vez
  // de vivir dentro del JSX, para poder llamarla una vez por cada una de
  // las tres secciones de abajo sin triplicar este bloque.
  function renderGrupo(g) {
    const clave = `${g.pais}|${g.competicion}`;
    const abierta = clave === claveAbierta;
    const fijada = ligasFijadas.has(clave);
    return (
      <div key={clave} className="border-t border-gold/30 first:border-t-0">
        {/* Dos botones en vez de uno (la estrellita no puede vivir DENTRO
            del botón que abre/cierra el acordeón — un <button> anidado
            en otro no es HTML válido) — juntos ocupan el mismo ancho y
            alto de siempre. */}
        <div className="w-full sticky top-0 z-10 bg-felt text-paper px-3 py-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onAlternarLigaFijada(clave)}
            aria-label={fijada ? "Quitar de favoritas" : "Añadir a favoritas"}
            className="shrink-0 p-0.5 -m-0.5"
          >
            <Star size={16} className={fijada ? "fill-gold text-gold" : "text-paper/40"} />
          </button>
          <button
            type="button"
            onClick={() => setGrupoAbierto(abierta ? "" : clave)}
            className="flex-1 min-w-0 flex items-center gap-2 text-left"
          >
            {CODIGOS_BANDERA[g.pais] && (
              <img
                src={`https://flagcdn.com/${CODIGOS_BANDERA[g.pais]}.svg`}
                alt=""
                className="w-6 h-4 shrink-0 rounded-sm object-cover bg-paper/10"
              />
            )}
            {/* Petición directa: país y competición en dos líneas (antes
                iban en una sola, "País · Competición", y en pantallas
                estrechas con nombres largos se cortaban) — misma bandera
                para las dos, centrada verticalmente junto al bloque. */}
            <span className="flex-1 min-w-0">
              <span className="block text-[10px] lg:text-xs font-semibold text-paper/60 uppercase tracking-wide truncate">
                {g.pais}
              </span>
              <span className="block text-sm lg:text-base font-semibold truncate">{g.competicion}</span>
            </span>
            <ChevronDown
              size={16}
              className={`shrink-0 transition-transform ${abierta ? "rotate-180" : ""}`}
            />
          </button>
        </div>
        {abierta &&
          g.partidos.map((p) => {
            const { local, visitante } = equiposDesdeEvento(p.evento);
            const activo = matchIdActivo === p.id;
            const n = contarSelecciones?.(p.id) ?? 0;
            // Partidos de ejemplo (PARTIDOS_DEMO) no traen "estado", así
            // que nunca se marcan como terminados — no hay marcador de
            // verdad que enseñar ahí.
            const terminado = ESTADOS_TERMINADOS_PARTIDO.has(p.estado);
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
                <span className="flex-1 min-w-0 space-y-0.5">
                  <span className="flex items-center justify-between gap-1.5">
                    <span className="flex items-center gap-1.5 min-w-0">
                      {escudoUrl(p.equipoLocalId, p.escudoLocal) && (
                        <img src={escudoUrl(p.equipoLocalId, p.escudoLocal)} alt="" className="w-4 h-4 shrink-0 object-contain" />
                      )}
                      <span className="text-sm lg:text-base font-medium text-ink truncate">{local}</span>
                    </span>
                    {terminado && (
                      <span className="font-mono text-sm font-semibold text-ink shrink-0">{p.golesLocal}</span>
                    )}
                  </span>
                  <span className="flex items-center justify-between gap-1.5">
                    <span className="flex items-center gap-1.5 min-w-0">
                      {escudoUrl(p.equipoVisitanteId, p.escudoVisitante) && (
                        <img
                          src={escudoUrl(p.equipoVisitanteId, p.escudoVisitante)}
                          alt=""
                          className="w-4 h-4 shrink-0 object-contain"
                        />
                      )}
                      <span className="text-sm lg:text-base font-medium text-ink truncate">{visitante}</span>
                    </span>
                    {terminado && (
                      <span className="font-mono text-sm font-semibold text-ink shrink-0">{p.golesVisitante}</span>
                    )}
                  </span>
                </span>
                {n > 0 && (
                  <span className="font-mono text-xs text-gold bg-gold/10 border border-gold/40 rounded-full px-2 py-0.5 shrink-0">
                    {n}
                  </span>
                )}
                {!terminado && <span className="font-mono text-xs lg:text-sm text-slate shrink-0">{p.hora}</span>}
              </button>
            );
          })}
      </div>
    );
  }

  return (
    <div className="bg-surface border border-line rounded-xl overflow-hidden flex flex-col">
      <div className="p-3 border-b border-line space-y-2">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm lg:text-base font-semibold text-ink">
            Partidos de hoy
            {/* Petición directa: con la API caída, TODA la lista de abajo
                son partidos de ejemplo (PARTIDOS_DEMO) — un aviso solo en
                el texto pequeño de más abajo pasaba desapercibido y se
                podían confundir con partidos reales de hoy. Esta pastilla
                se ve siempre que la lista es de mentira, sin depender del
                motivo exacto (cuenta suspendida, cuota agotada...). */}
            {usandoDemo && (
              <span className="font-mono text-[10px] font-bold text-lose bg-lose/10 border border-lose/40 rounded-full px-2 py-0.5 uppercase tracking-wide">
                Prueba
              </span>
            )}
          </p>
          <div className="flex items-center gap-1.5">
            {/* Petición directa: cuántos de esos ya han terminado, aparte
                del total — en rojo para que se note de un vistazo, mismo
                criterio de color que el resto de la app para "ya resuelto/
                cerrado" (bg-lose). */}
            {terminados > 0 && (
              <span className="font-mono text-sm lg:text-base font-bold text-lose bg-lose/10 border border-lose/40 rounded-full px-2.5 py-0.5">
                {terminados}
              </span>
            )}
            <span className="font-mono text-sm lg:text-base font-bold text-ink bg-paperDim border border-line rounded-full px-2.5 py-0.5">
              {partidos.length}
            </span>
          </div>
        </div>
        {/* Varios motivos MUY distintos para caer a los partidos de
            ejemplo, y el mensaje tiene que decir cuál es de verdad —
            antes siempre enseñaba el de "hace falta vercel dev", que no
            tiene ningún sentido en la app ya desplegada. Bug real
            (2026-09-02): la cuenta de API-Football se suspendió
            (dashboard.api-football.com) y esto se enseñaba como "cuota
            agotada, vuelve mañana" — mensaje que no arregla nada, porque
            no se soluciona sola con el tiempo. */}
        {usandoDemo && (cuentaSuspendida || errorApi) && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg border border-gold/40 bg-gold/10">
            <AlertTriangle size={16} className="text-gold shrink-0 mt-0.5" />
            <p className="text-xs text-ink leading-relaxed">
              <span className="font-semibold text-gold">Los partidos reales no se pueden cargar por ahora</span>
              {cuentaSuspendida ? (
                <>
                  {" "}
                  — problema con el proveedor de datos (
                  <a
                    href="https://dashboard.api-football.com"
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    cuenta suspendida
                  </a>
                  ).
                </>
              ) : (
                " — la API de fútbol ha respondido con un error inesperado."
              )}{" "}
              Mientras se soluciona, puedes{" "}
              <button
                type="button"
                onClick={() => setMostrandoManual(true)}
                className="font-semibold underline"
              >
                escribir el partido a mano
              </button>
              . Los mercados de Jugador quedarán bloqueados en ese partido (sin plantilla real) — usa
              "Otro mercado" en la pantalla siguiente para escribir esos a mano también.
            </p>
          </div>
        )}
        {usandoDemo && cuotaAgotada && !cuentaSuspendida && (
          <p className="text-xs text-slate">
            Se ha agotado la cuota diaria gratuita de la API de fútbol (100 peticiones/día) — vuelve a
            intentarlo mañana. Mientras tanto, partidos de ejemplo.
          </p>
        )}
        {usandoDemo && !cuotaAgotada && !cuentaSuspendida && !errorApi && (
          <p className="text-xs text-slate">
            No se ha podido cargar la agenda real (hace falta <code>vercel dev</code>, no{" "}
            <code>vite</code> a secas) — partidos de ejemplo mientras tanto.
          </p>
        )}
        {usandoDemo && !mostrandoManual && !(cuentaSuspendida || errorApi) && (
          <button
            type="button"
            onClick={() => setMostrandoManual(true)}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-gold hover:underline py-1"
          >
            <Pencil size={12} /> No encuentro el partido, escribirlo a mano
          </button>
        )}
        {mostrandoManual && (
          <div className="p-2.5 rounded-lg border border-gold/40 bg-paperDim space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-ink">Escribir partido a mano</p>
              <button
                type="button"
                onClick={() => setMostrandoManual(false)}
                aria-label="Cancelar"
                className="text-slate hover:text-ink"
              >
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={manualLocal}
                onChange={(e) => setManualLocal(e.target.value)}
                placeholder="Equipo local"
                className="w-full border border-line rounded-lg px-2.5 py-1.5 text-sm bg-surface"
              />
              <input
                type="text"
                value={manualVisitante}
                onChange={(e) => setManualVisitante(e.target.value)}
                placeholder="Equipo visitante"
                className="w-full border border-line rounded-lg px-2.5 py-1.5 text-sm bg-surface"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={manualPais}
                onChange={(e) => setManualPais(e.target.value)}
                placeholder="País (opcional)"
                className="w-full border border-line rounded-lg px-2.5 py-1.5 text-sm bg-surface"
              />
              <input
                type="text"
                value={manualCompeticion}
                onChange={(e) => setManualCompeticion(e.target.value)}
                placeholder="Competición (opcional)"
                className="w-full border border-line rounded-lg px-2.5 py-1.5 text-sm bg-surface"
              />
            </div>
            <input
              type="text"
              value={manualHora}
              onChange={(e) => setManualHora(e.target.value)}
              placeholder="Hora, HH:MM (opcional)"
              className="w-full border border-line rounded-lg px-2.5 py-1.5 text-sm bg-surface"
            />
            <p className="text-[11px] text-slate">
              Sin escudos ni jugadores reales (no hay partido conectado a la API) — el resto de la
              apuesta funciona igual.
            </p>
            <button
              type="button"
              onClick={confirmarPartidoManual}
              disabled={!manualLocal.trim() || !manualVisitante.trim()}
              className="w-full py-2 rounded-lg text-sm font-semibold bg-gold text-feltDark hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Usar este partido
            </button>
          </div>
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

      <div>
        {gruposFavoritos.length > 0 && (
          <p className="px-3 py-1.5 text-[11px] font-bold text-gold uppercase tracking-wide bg-gold/15 border-y border-gold/30">
            Competiciones favoritas
          </p>
        )}
        {gruposFavoritos.map(renderGrupo)}
        {gruposOtros.length > 0 && (
          <p className="px-3 py-1.5 text-[11px] font-bold text-gold uppercase tracking-wide bg-gold/15 border-y border-gold/30">
            Otras competiciones (A-Z)
          </p>
        )}
        {gruposOtros.map(renderGrupo)}
        {cargando && grupos.length === 0 && (
          <p className="p-4 text-sm text-slate text-center">Cargando partidos…</p>
        )}
        {!cargando && grupos.length === 0 && (
          <p className="p-4 text-sm text-slate text-center">Sin partidos para ese filtro.</p>
        )}
      </div>
    </div>
  );
}
