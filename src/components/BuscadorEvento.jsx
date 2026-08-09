import { useEffect, useRef, useState } from "react";
import { usePartidos } from "../hooks/usePartidos";
import { PAISES_CONECTADOS, PAISES_GRUPO_EUROPA } from "../utils/ligasConectadas";
import { usePosicionDesplegable } from "../hooks/usePosicionDesplegable";
import { normalizarTexto } from "../utils/texto";
import SelectorDesplegable from "./SelectorDesplegable";

// Sentinela para "Otras ligas": no puede coincidir con ningún nombre real
// de país de PAISES_CONECTADOS.
const OTRAS_LIGAS = "otras";

const PAISES_INDIVIDUALES = PAISES_CONECTADOS.filter(
  (p) => !PAISES_GRUPO_EUROPA.includes(p.pais) && p.pais !== "Competición Europea"
);
const PAISES_EUROPA = PAISES_CONECTADOS.filter((p) => PAISES_GRUPO_EUROPA.includes(p.pais));
const COMPETICION_EUROPEA = PAISES_CONECTADOS.find((p) => p.pais === "Competición Europea");

// Grupos para el desplegable de País (ver SelectorDesplegable.jsx): mismas
// tres secciones que tenía el <select> con <optgroup> de antes (Grandes
// ligas / Europa / sueltas), con "Competición Europea" y "Otras ligas"
// destacadas en negrita al final.
const GRUPOS_PAIS = [
  { etiqueta: "Grandes ligas", opciones: PAISES_INDIVIDUALES.map(({ pais }) => ({ valor: pais, texto: pais })) },
  { etiqueta: "Europa", opciones: PAISES_EUROPA.map(({ pais }) => ({ valor: pais, texto: pais })) },
  {
    opciones: [
      ...(COMPETICION_EUROPEA
        ? [{ valor: COMPETICION_EUROPEA.pais, texto: COMPETICION_EUROPEA.pais, destacado: true }]
        : []),
      { valor: OTRAS_LIGAS, texto: "Otras ligas", destacado: true },
    ],
  },
];

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
  const inputWrapRef = useRef(null);
  const posicion = usePosicionDesplegable(abierto, inputWrapRef);
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
  // País + competición son siempre obligatorios antes de ver partidos,
  // incluso si ese país solo tiene una competición conectada (antes se
  // saltaba este paso en ese caso, y confundía: parecía que hacía falta
  // elegir competición para que la apuesta se guardara bien).
  const necesitaCompeticion = !modoManual && !competicionFiltro;

  const coincidencias =
    modoManual || necesitaCompeticion
      ? []
      : partidos
          .filter((p) => p.pais === paisFiltro)
          .filter((p) => !competicionFiltro || p.competicion === competicionFiltro)
          .filter((p) => !valor.trim() || normalizarTexto(p.evento).includes(normalizarTexto(valor)));
  // Sin límite de resultados: la lista ya viene acotada a una sola
  // competición (país + competición son obligatorios antes de ver nada), y
  // el cuadro tiene scroll para listas largas (p.ej. una jornada completa
  // de Conference League, ~27 partidos).

  return (
    <div ref={contenedorRef} className="space-y-1.5">
      <div className="grid grid-cols-2 gap-2">
        <SelectorDesplegable
          valor={paisFiltro}
          placeholder="País"
          grupos={GRUPOS_PAIS}
          onElegir={(nuevoPais) => {
            setPaisFiltro(nuevoPais);
            setCompeticionFiltro("");
            setAbierto(true);
          }}
        />
        <SelectorDesplegable
          valor={competicionFiltro}
          placeholder="Competición"
          grupos={[{ opciones: competicionesDisponibles.map((c) => ({ valor: c, texto: c })) }]}
          onElegir={(nuevaCompeticion) => {
            setCompeticionFiltro(nuevaCompeticion);
            setAbierto(true);
          }}
          disabled={modoManual}
        />
      </div>

      {(paisFiltro || valor) && !necesitaCompeticion && (
        <div ref={inputWrapRef} className="relative">
          <input
            type="text"
            value={valor}
            onChange={(e) => {
              onCambiar(e.target.value);
              setAbierto(true);
            }}
            onFocus={() => setAbierto(true)}
            placeholder={
              paisFiltro === OTRAS_LIGAS ? "Ej. Real Madrid - FC Barcelona" : "Escribe para filtrar"
            }
            required
            className="w-full border border-line rounded-lg px-3 py-2 text-sm"
          />

          {abierto && !modoManual && fueraDeRango && (
            <div
              className={`absolute z-50 w-full bg-surface border border-line rounded-lg shadow-lg text-left ${
                posicion.arriba ? "bottom-full mb-1" : "top-full mt-1"
              }`}
            >
              <p className="px-3 py-2 text-xs text-slate">
                El plan gratuito de API-Football solo permite buscar partidos
                de ayer, hoy o mañana. Para esta fecha, escribe el evento a
                mano.
              </p>
            </div>
          )}

          {abierto && coincidencias.length > 0 && (
            <div
              className={`absolute z-50 w-full bg-surface border border-line rounded-lg shadow-lg overflow-y-auto text-left ${
                posicion.arriba ? "bottom-full mb-1" : "top-full mt-1"
              }`}
              style={{ maxHeight: posicion.maxAltura }}
            >
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
      )}
    </div>
  );
}
