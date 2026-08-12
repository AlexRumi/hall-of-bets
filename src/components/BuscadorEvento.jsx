import { useState } from "react";
import { Globe, Pencil, Search, X } from "lucide-react";
import { usePartidos } from "../hooks/usePartidos";
import { GRUPOS_LIGAS, BANDERAS_PAIS } from "../utils/ligasConectadas";
import { esFormatoEquipos, equiposDesdeEvento } from "../utils/mercados";
import { normalizarTexto } from "../utils/texto";
import TabsDesplazables from "./TabsDesplazables";

// Sentinela para "Otras ligas": no puede coincidir con ningún nombre real
// de grupo/país de GRUPOS_LIGAS.
const OTRAS_LIGAS = "otras";

// Estados "terminado" de API-Football (tiempo reglamentario, prórroga o
// penaltis) — en cualquier otro estado (por jugar, en juego...) se enseña
// la hora en vez del resultado, que todavía no es definitivo. También se
// usa para saber si una competición "temporal" (ver más abajo) ya ha
// terminado del todo.
const ESTADOS_FINALIZADOS = new Set(["FT", "AET", "PEN"]);

// Petición directa: solo mostrar en los desplegables los grupos/países/
// competiciones de GRUPOS_LIGAS que de verdad tengan algún partido ESE
// día — con muchas ligas conectadas, la mayoría de días la mayoría no
// tiene nada, y era ruido ver un grupo o país entero para elegir cuando
// no tenía nada. Usa los partidos ya traídos por usePartidos(fecha) para
// esa fecha, sin ninguna llamada nueva. Se aplica en cascada a los tres
// niveles (grupo, país, competición).
// Además, una competición "temporal" (Supercopa de Europa, de momento —
// api/partidos.js, campo "temporal") se oculta también el MISMO día en
// cuanto todos sus partidos de esa edición ya están en
// ESTADOS_FINALIZADOS — así no se queda "fantasma" en el desplegable el
// resto de la temporada tras jugarse su único partido.
function competicionTienePartidosActivos(partidos, pais, competicion) {
  const partidosComp = partidos.filter((p) => p.pais === pais && p.competicion === competicion);
  if (partidosComp.length === 0) return false;
  const esTemporal = partidosComp.some((p) => p.temporal);
  if (esTemporal && partidosComp.every((p) => ESTADOS_FINALIZADOS.has(p.estado))) return false;
  return true;
}

// "Competición Europea" es un grupo especial sin países debajo (ver
// GRUPOS_LIGAS): sus competiciones cuelgan directamente del grupo. El
// resto de grupos sí tienen países, cada uno con sus propias
// competiciones.
function esGrupoDirecto(grupo) {
  return !!grupo.competiciones;
}

// Países visibles de un grupo con países (Grandes ligas/Europa/América):
// cada país se queda solo con las competiciones que tengan partidos hoy,
// y el país entero desaparece si se queda sin ninguna.
function paisesVisiblesDeGrupo(partidos, grupo) {
  return grupo.paises
    .map((p) => ({
      ...p,
      competiciones: p.competiciones.filter((c) => competicionTienePartidosActivos(partidos, p.pais, c)),
    }))
    .filter((p) => p.competiciones.length > 0);
}

// Competiciones visibles de un grupo directo (Competición Europea).
function competicionesVisiblesDeGrupoDirecto(partidos, grupo) {
  return grupo.competiciones.filter((c) => competicionTienePartidosActivos(partidos, grupo.grupo, c));
}

// Un grupo entero se oculta si ninguno de sus países (o, en un grupo
// directo, ninguna de sus competiciones) tiene partidos hoy.
function grupoTienePartidosHoy(partidos, grupo) {
  return esGrupoDirecto(grupo)
    ? competicionesVisiblesDeGrupoDirecto(partidos, grupo).length > 0
    : paisesVisiblesDeGrupo(partidos, grupo).length > 0;
}

// Píldora de hora/resultado a la derecha de cada partido (petición
// directa): mismos datos "hora"/"estado"/"golesLocal"/"golesVisitante"
// que ya devuelve api/partidos.js dentro de la misma llamada de siempre,
// sin gastar cuota aparte.
function EtiquetaPartido({ partido }) {
  const terminado = ESTADOS_FINALIZADOS.has(partido.estado);
  const texto = terminado ? `${partido.golesLocal}-${partido.golesVisitante}` : partido.hora;
  return (
    <span
      className={`shrink-0 font-mono text-xs font-semibold px-2 py-1 rounded ${
        terminado ? "bg-void/15 text-void" : "bg-gold/10 text-gold"
      }`}
    >
      {texto}
    </span>
  );
}

// Nombre de los dos equipos en fila, uno debajo del otro (petición
// directa, con captura de referencia en móvil): antes "evento" iba en una
// sola línea y se truncaba a media palabra con nombres largos ("Kauno
// Žalgiris - Dinamo ..."). Apilarlos, igual que ya hace CabeceraPartido en
// ApuestaItem.jsx, deja leer el nombre completo de cada equipo. Sin el
// formato "Local - Visitante" (no debería pasar con partidos que vienen
// del buscador, pero por si acaso) cae al texto tal cual, en una sola
// línea.
function NombresEquipos({ evento }) {
  if (!esFormatoEquipos(evento)) {
    return <span className="block text-sm font-medium text-ink truncate">{evento}</span>;
  }
  const equipos = equiposDesdeEvento(evento);
  return (
    <>
      <span className="block text-sm font-medium text-ink truncate">{equipos.local}</span>
      <span className="block text-sm font-medium text-ink truncate">{equipos.visitante}</span>
    </>
  );
}

// Campo "Evento" con autocompletado (ver match-picker-demo.html, referencia
// aportada por el usuario): un único buscador de texto libre arriba (a la
// vez el campo "Evento" real) que, en cuanto se escribe algo, busca en
// TODOS los partidos conectados de la fecha elegida y agrupa los
// resultados por competición — sin depender de haber elegido nada de la
// cascada de abajo.
// Sin texto escrito, aparece en su lugar una cascada estricta, cada paso
// visible solo cuando el anterior ya está completo: grupo (pestañas) →
// país (si el grupo los tiene — Competición Europea no, sus 4 entradas
// van directas) → competición (solo si el país tiene más de una; con una
// sola se salta este paso solo) → partidos. Elegir un grupo o un país
// reinicia lo que cuelgue de él, para no dejar una combinación a medias.
// "Otras ligas" no tiene país ni competición conectados: se queda solo
// con el buscador de arriba, en modo texto libre de toda la vida.
export default function BuscadorEvento({
  valor,
  fecha,
  onCambiar,
  onElegirPartido,
  // Campo opcional "Competición", solo en modo manual ("Otras ligas") —
  // ahí no hay país/competición conectados que elegir, pero sí interesa
  // poder anotar la liga a mano para que el detalle de la apuesta la
  // muestre igual que un partido del buscador (ver ApuestaItem.jsx).
  competicion = "",
  onCambiarCompeticion,
}) {
  const [grupoFiltro, setGrupoFiltro] = useState("");
  const [paisFiltro, setPaisFiltro] = useState("");
  const [competicionFiltro, setCompeticionFiltro] = useState("");
  // Bug real (2026-08-10): al elegir un partido, el panel se quedaba
  // abierto sin ninguna señal de que ya se había elegido algo — mismo
  // arreglo que SelectorMercado.jsx: colapsa a la píldora con el evento
  // elegido + "Cambiar partido". Arranca colapsado si ya había un evento
  // guardado (al editar una selección ya creada), abierto si no.
  const [expandido, setExpandido] = useState(() => !valor);
  const { partidos, fueraDeRango, cuotaAgotada } = usePartidos(fecha);

  // Todo esto depende de "partidos" (la fecha elegida), así que se
  // recalcula en cada render — no puede ser una constante de módulo.
  const gruposVisibles = GRUPOS_LIGAS.filter((g) => grupoTienePartidosHoy(partidos, g));
  const tabsGrupo = [
    ...gruposVisibles.map((g) => ({ valor: g.grupo, texto: g.grupo, icono: g.icono })),
    { valor: OTRAS_LIGAS, texto: "Otras ligas" },
  ];

  const modoManual = grupoFiltro === OTRAS_LIGAS;
  const grupoActivo = GRUPOS_LIGAS.find((g) => g.grupo === grupoFiltro) ?? null;
  const grupoActivoEsDirecto = grupoActivo ? esGrupoDirecto(grupoActivo) : false;

  const paisesDelGrupo = grupoActivo && !grupoActivoEsDirecto ? paisesVisiblesDeGrupo(partidos, grupoActivo) : [];
  const competicionesDelGrupoDirecto =
    grupoActivo && grupoActivoEsDirecto ? competicionesVisiblesDeGrupoDirecto(partidos, grupoActivo) : [];
  // Competiciones del país ya elegido (dentro de un grupo con países) —
  // solo hace falta mostrar sus pestañas si hay más de una: con una sola,
  // elegirPaisDeGrupo ya la ha dejado seleccionada sola.
  const competicionesDelPais = paisFiltro
    ? paisesDelGrupo.find((p) => p.pais === paisFiltro)?.competiciones ?? []
    : [];

  // "País" efectivo para filtrar partidos: en un grupo directo (Competición
  // Europea) es el propio nombre del grupo (así se guardó en cada partido
  // desde api/partidos.js); en un grupo con países, el país elegido.
  const paisEfectivo = grupoActivoEsDirecto ? grupoFiltro : paisFiltro;

  function elegirGrupo(nuevoGrupo) {
    setGrupoFiltro(nuevoGrupo);
    setPaisFiltro("");
    setCompeticionFiltro("");
    onCambiar("");
  }

  function elegirPaisDeGrupo(nuevoPais) {
    setPaisFiltro(nuevoPais);
    // Auto-selecciona la única competición si el país solo tiene una (tras
    // filtrar por partidos de hoy) — salta directo a los partidos, sin un
    // paso intermedio con una sola pestaña que no ofrece ninguna
    // alternativa real.
    const competicionesDeEsePais = paisesDelGrupo.find((p) => p.pais === nuevoPais)?.competiciones ?? [];
    setCompeticionFiltro(competicionesDeEsePais.length === 1 ? competicionesDeEsePais[0] : "");
    onCambiar("");
  }

  function elegirCompeticionDirecta(nuevaCompeticion) {
    setCompeticionFiltro(nuevaCompeticion);
    onCambiar("");
  }

  // Buscador global: agrupa por competición, sin importar la cascada de
  // abajo — igual que la demo, escribir algo siempre busca en todo lo
  // conectado para esa fecha.
  const competicionesConCoincidencias = valor.trim()
    ? [...new Set(partidos.map((p) => p.competicion))]
        .map((competicion) => ({
          competicion,
          partidos: partidos.filter(
            (p) => p.competicion === competicion && normalizarTexto(p.evento).includes(normalizarTexto(valor))
          ),
        }))
        .filter((g) => g.partidos.length > 0)
    : [];

  // Cascada sin buscador: partidos de la competición ya elegida.
  const partidosDeCompeticion =
    !valor.trim() && paisEfectivo && competicionFiltro
      ? partidos.filter((p) => p.pais === paisEfectivo && p.competicion === competicionFiltro)
      : [];

  function elegir(partido) {
    onElegirPartido(partido);
    setExpandido(false);
  }

  if (!expandido && valor) {
    return (
      <button
        type="button"
        onClick={() => setExpandido(true)}
        className="w-full flex items-center justify-between gap-2 border border-line rounded-lg bg-surface px-3 py-2.5 text-left hover:border-gold/40 transition-colors"
      >
        <span className="flex items-center gap-1 text-xs font-semibold text-gold bg-gold/10 border border-gold/30 rounded-full px-3 py-1.5 truncate">
          <Globe size={12} className="shrink-0" />
          <span className="truncate">{valor}</span>
        </span>
        <span className="flex items-center gap-1 text-xs font-semibold text-gold shrink-0">
          <Pencil size={12} />
          Cambiar partido
        </span>
      </button>
    );
  }

  return (
    <div className="border border-line rounded-lg bg-surface overflow-hidden">
      <div className="p-3 pb-2">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
          <input
            type="text"
            value={valor}
            onChange={(e) => onCambiar(e.target.value)}
            placeholder={
              modoManual ? "Ej. Real Madrid - FC Barcelona" : "Buscar equipo o partido (ej. Feyenoord)"
            }
            className="w-full border border-line rounded-lg pl-9 pr-9 py-2 text-sm"
          />
          {valor && (
            <button
              type="button"
              onClick={() => onCambiar("")}
              aria-label="Vaciar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate hover:text-lose"
            >
              <X size={14} />
            </button>
          )}
        </div>
        {fueraDeRango && (
          <p className="text-xs text-slate mt-1.5">
            El plan gratuito de API-Football solo permite buscar partidos de ayer, hoy o mañana. Para
            esta fecha, escribe el evento a mano.
          </p>
        )}
        {cuotaAgotada && (
          <p className="text-xs text-lose mt-1.5">
            Se ha agotado la cuota diaria de peticiones a API-Football. Vuelve a intentarlo mañana, o
            escribe el evento a mano mientras tanto.
          </p>
        )}
        {modoManual && (
          <>
            <input
              type="text"
              value={competicion}
              onChange={(e) => onCambiarCompeticion(e.target.value)}
              placeholder="Competición (opcional)"
              className="w-full border border-line rounded-lg px-3 py-2 text-sm mt-1.5"
            />
            <button
              type="button"
              onClick={() => setExpandido(false)}
              disabled={!valor.trim()}
              className="mt-1.5 text-xs font-semibold text-gold border border-gold/40 rounded-full px-3 py-1 hover:bg-gold/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Listo
            </button>
          </>
        )}
      </div>

      {valor.trim() ? (
        <div className="max-h-72 overflow-y-auto scrollbar-oculto">
          {competicionesConCoincidencias.length === 0 ? (
            <p className="px-3 py-4 text-sm text-slate text-center">
              Sin resultados — puedes escribir el partido a mano
            </p>
          ) : (
            competicionesConCoincidencias.map(({ competicion, partidos: partidosGrupo }) => (
              <div key={competicion}>
                <p className="bg-felt px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-gold">
                  {competicion}
                </p>
                {partidosGrupo.map((partido) => (
                  <button
                    key={partido.id}
                    type="button"
                    onClick={() => elegir(partido)}
                    className="w-full flex items-center justify-between gap-2 px-4 py-2 text-left hover:bg-paperDim transition-colors border-b border-line/60 last:border-b-0"
                  >
                    <span className="min-w-0">
                      <NombresEquipos evento={partido.evento} />
                      <span className="block text-xs text-slate truncate">{partido.pais}</span>
                    </span>
                    <EtiquetaPartido partido={partido} />
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      ) : (
        <>
          <TabsDesplazables opciones={tabsGrupo} valor={grupoFiltro} onElegir={elegirGrupo} colorActivo="felt" />

          {grupoActivo && grupoActivoEsDirecto && (
            <TabsDesplazables
              opciones={competicionesDelGrupoDirecto.map((competicion) => ({
                valor: competicion,
                texto: competicion,
              }))}
              valor={competicionFiltro}
              onElegir={elegirCompeticionDirecta}
              colorActivo="gold"
              compacto
            />
          )}

          {grupoActivo && !grupoActivoEsDirecto && (
            <TabsDesplazables
              opciones={paisesDelGrupo.map((p) => ({ valor: p.pais, texto: p.pais, icono: BANDERAS_PAIS[p.pais] }))}
              valor={paisFiltro}
              onElegir={elegirPaisDeGrupo}
              colorActivo="gold"
              compacto
            />
          )}

          {grupoActivo && !grupoActivoEsDirecto && paisFiltro && competicionesDelPais.length > 1 && (
            <TabsDesplazables
              opciones={competicionesDelPais.map((competicion) => ({ valor: competicion, texto: competicion }))}
              valor={competicionFiltro}
              onElegir={setCompeticionFiltro}
              colorActivo="gold"
              compacto
            />
          )}

          {competicionFiltro && (
            <div className="max-h-72 overflow-y-auto scrollbar-oculto">
              {partidosDeCompeticion.length === 0 ? (
                <p className="px-3 py-4 text-sm text-slate text-center">
                  Sin partidos cacheados hoy en esta competición
                </p>
              ) : (
                partidosDeCompeticion.map((partido) => (
                  <button
                    key={partido.id}
                    type="button"
                    onClick={() => elegir(partido)}
                    className="w-full flex items-center justify-between gap-2 px-4 py-2 text-left hover:bg-paperDim transition-colors border-b border-line/60 last:border-b-0"
                  >
                    <span className="min-w-0">
                      <NombresEquipos evento={partido.evento} />
                    </span>
                    <EtiquetaPartido partido={partido} />
                  </button>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
