import { useEffect, useRef, useState } from "react";
import { usePartidos } from "../hooks/usePartidos";
import { PAISES_CONECTADOS, PAISES_GRUPO_EUROPA } from "../utils/ligasConectadas";

// Sentinela para "Otras ligas": no puede coincidir con ningún nombre real
// de país de PAISES_CONECTADOS.
const OTRAS_LIGAS = "otras";

// Quita acentos para que "atletico" encuentre "Atletico" al escribir.
function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

const PAISES_INDIVIDUALES = PAISES_CONECTADOS.filter(
  (p) => !PAISES_GRUPO_EUROPA.includes(p.pais) && p.pais !== "Competición Europea"
);
const PAISES_EUROPA = PAISES_CONECTADOS.filter((p) => PAISES_GRUPO_EUROPA.includes(p.pais));
const COMPETICION_EUROPEA = PAISES_CONECTADOS.find((p) => p.pais === "Competición Europea");

// Campo "Evento" con autocompletado, con dos modos según el desplegable de
// País:
// - Sin elegir país todavía, o "Otras ligas": modo manual de toda la vida,
//   sin sugerencias — para ligas no conectadas (la inmensa mayoría del
//   mundo).
// - Un país conectado: hay que elegir también la competición (si ese país
//   tiene más de una — p.ej. "Competición Europea" tiene Champions/Europa
//   League/Conference) antes de ver ningún partido, para no mezclarlas
//   todas en una lista larga. Con la competición elegida, el texto escrito
//   filtra esa lista en vez de ser un evento libre.
// País/competición no se guardan hasta elegir un partido de verdad, para
// no acabar con un país guardado sin un evento real detrás.
export default function BuscadorEvento({ valor, fecha, onCambiar, onElegirPartido }) {
  const [abierto, setAbierto] = useState(false);
  const [paisFiltro, setPaisFiltro] = useState("");
  const [competicionFiltro, setCompeticionFiltro] = useState("");
  const contenedorRef = useRef(null);
  const { partidos, fueraDeRango } = usePartidos(fecha);

  useEffect(() => {
    function manejarClickFuera(e) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", manejarClickFuera);
    return () => document.removeEventListener("mousedown", manejarClickFuera);
  }, []);

  const modoManual = !paisFiltro || paisFiltro === OTRAS_LIGAS;
  const competicionesDisponibles = modoManual
    ? []
    : PAISES_CONECTADOS.find((p) => p.pais === paisFiltro)?.competiciones ?? [];
  const necesitaCompeticion =
    !modoManual && competicionesDisponibles.length > 1 && !competicionFiltro;

  const coincidencias =
    modoManual || necesitaCompeticion
      ? []
      : partidos
          .filter((p) => p.pais === paisFiltro)
          .filter((p) => !competicionFiltro || p.competicion === competicionFiltro)
          .filter((p) => !valor.trim() || normalizar(p.evento).includes(normalizar(valor)));
  // Sin límite de resultados: la lista ya viene acotada a una sola
  // competición (país + competición son obligatorios antes de ver nada), y
  // el cuadro tiene scroll para listas largas (p.ej. una jornada completa
  // de Conference League, ~27 partidos).

  return (
    <div ref={contenedorRef} className="space-y-1.5">
      <div className="grid grid-cols-2 gap-2">
        <select
          value={paisFiltro}
          onChange={(e) => {
            setPaisFiltro(e.target.value);
            setCompeticionFiltro("");
            setAbierto(true);
          }}
          className="w-full border border-line rounded-lg px-2 py-1.5 text-xs bg-surface text-ink"
        >
          <option value="">Seleccionar un país</option>
          <optgroup label="Grandes ligas">
            {PAISES_INDIVIDUALES.map(({ pais }) => (
              <option key={pais} value={pais}>
                {pais}
              </option>
            ))}
          </optgroup>
          <optgroup label="Europa">
            {PAISES_EUROPA.map(({ pais }) => (
              <option key={pais} value={pais}>
                {pais}
              </option>
            ))}
          </optgroup>
          {COMPETICION_EUROPEA && (
            <option value={COMPETICION_EUROPEA.pais} className="font-bold">
              {COMPETICION_EUROPEA.pais}
            </option>
          )}
          <option value={OTRAS_LIGAS} className="font-bold">
            Otras ligas
          </option>
        </select>
        <select
          value={competicionFiltro}
          onChange={(e) => {
            setCompeticionFiltro(e.target.value);
            setAbierto(true);
          }}
          disabled={modoManual}
          className="w-full border border-line rounded-lg px-2 py-1.5 text-xs bg-surface text-ink disabled:opacity-50"
        >
          <option value="">Competición</option>
          {competicionesDisponibles.map((competicion) => (
            <option key={competicion} value={competicion}>
              {competicion}
            </option>
          ))}
        </select>
      </div>

      <div className="relative">
        <input
          type="text"
          value={valor}
          onChange={(e) => {
            onCambiar(e.target.value);
            setAbierto(true);
          }}
          onFocus={() => setAbierto(true)}
          placeholder={modoManual ? "Ej. Real Madrid - FC Barcelona" : "Escribe para filtrar"}
          required
          className="w-full border border-line rounded-lg px-3 py-2 text-sm"
        />

        {abierto && necesitaCompeticion && (
          <div className="absolute z-20 mt-1 w-full bg-surface border border-line rounded-lg shadow-lg text-left">
            <p className="px-3 py-2 text-xs text-slate">
              Elige una competición para ver los partidos.
            </p>
          </div>
        )}

        {abierto && !necesitaCompeticion && !modoManual && fueraDeRango && (
          <div className="absolute z-20 mt-1 w-full bg-surface border border-line rounded-lg shadow-lg text-left">
            <p className="px-3 py-2 text-xs text-slate">
              El plan gratuito de API-Football solo permite buscar partidos
              de ayer, hoy o mañana. Para esta fecha, escribe el evento a
              mano.
            </p>
          </div>
        )}

        {abierto && !necesitaCompeticion && coincidencias.length > 0 && (
          <div className="absolute z-20 mt-1 w-full bg-surface border border-line rounded-lg shadow-lg max-h-56 overflow-y-auto text-left">
            {coincidencias.map((partido) => (
              <button
                key={partido.id}
                type="button"
                onClick={() => {
                  onElegirPartido(partido);
                  setAbierto(false);
                }}
                className="w-full flex flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-paperDim transition-colors border-b border-line last:border-b-0"
              >
                <span className="text-sm font-medium text-ink">{partido.evento}</span>
                <span className="text-xs text-slate">
                  {partido.competicion} · {partido.pais}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
