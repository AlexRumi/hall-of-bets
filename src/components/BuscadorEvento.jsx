import { useState } from "react";
import { Globe, Pencil, Search, X } from "lucide-react";
import { usePartidos } from "../hooks/usePartidos";
import { PAISES_CONECTADOS, BANDERAS_PAIS } from "../utils/ligasConectadas";
import { normalizarTexto } from "../utils/texto";
import TabsDesplazables from "./TabsDesplazables";

// Sentinela para "Otras ligas": no puede coincidir con ningún nombre real
// de país de PAISES_CONECTADOS.
const OTRAS_LIGAS = "otras";

const TABS_PAIS = [
  ...PAISES_CONECTADOS.map((p) => ({ valor: p.pais, texto: p.pais, icono: BANDERAS_PAIS[p.pais] })),
  { valor: OTRAS_LIGAS, texto: "Otras ligas" },
];

// Campo "Evento" con autocompletado (ver match-picker-demo.html, referencia
// aportada por el usuario): un único buscador de texto libre arriba (a la
// vez el campo "Evento" real) que, en cuanto se escribe algo, busca en
// TODOS los partidos conectados de la fecha elegida y agrupa los
// resultados por competición — sin depender de haber elegido país antes.
// Sin texto escrito, aparece en su lugar una cascada estricta en 3 pasos,
// cada uno visible solo cuando el anterior ya está completo (nada de
// secciones vacías con texto de relleno): país (pestañas) → competición
// (chips, si ese país tiene datos conectados) → partidos de esa
// competición. Elegir un país reinicia la búsqueda y la competición, para
// no dejar una combinación a medias.
// "Otras ligas" no tiene competición ni partidos conectados: se queda solo
// con el buscador de arriba, en modo texto libre de toda la vida.
export default function BuscadorEvento({ valor, fecha, onCambiar, onElegirPartido }) {
  const [paisFiltro, setPaisFiltro] = useState("");
  const [competicionFiltro, setCompeticionFiltro] = useState("");
  // Bug real (2026-08-10): al elegir un partido, el panel se quedaba
  // abierto sin ninguna señal de que ya se había elegido algo — mismo
  // arreglo que SelectorMercado.jsx: colapsa a la píldora con el evento
  // elegido + "Cambiar partido". Arranca colapsado si ya había un evento
  // guardado (al editar una selección ya creada), abierto si no.
  const [expandido, setExpandido] = useState(() => !valor);
  const { partidos, fueraDeRango } = usePartidos(fecha);

  function elegirPais(nuevoPais) {
    setPaisFiltro(nuevoPais);
    setCompeticionFiltro("");
    onCambiar("");
  }

  const modoManual = paisFiltro === OTRAS_LIGAS;
  const competicionesDisponibles = paisFiltro && !modoManual
    ? PAISES_CONECTADOS.find((p) => p.pais === paisFiltro)?.competiciones ?? []
    : [];

  // Buscador global: agrupa por competición, sin importar el país/
  // competición elegidos en las pestañas de abajo — igual que la demo,
  // escribir algo siempre busca en todo lo conectado para esa fecha.
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
    !valor.trim() && paisFiltro && competicionFiltro
      ? partidos.filter((p) => p.pais === paisFiltro && p.competicion === competicionFiltro)
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
        {modoManual && (
          <button
            type="button"
            onClick={() => setExpandido(false)}
            disabled={!valor.trim()}
            className="mt-1.5 text-xs font-semibold text-gold border border-gold/40 rounded-full px-3 py-1 hover:bg-gold/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Listo
          </button>
        )}
      </div>

      {valor.trim() ? (
        <div className="max-h-72 overflow-y-auto">
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
                    className="w-full flex flex-col items-start gap-0.5 px-4 py-2 text-left hover:bg-paperDim transition-colors border-b border-line/60 last:border-b-0"
                  >
                    <span className="text-sm font-medium text-ink">{partido.evento}</span>
                    <span className="text-xs text-slate">{partido.pais}</span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      ) : (
        <>
          <TabsDesplazables opciones={TABS_PAIS} valor={paisFiltro} onElegir={elegirPais} colorActivo="felt" />

          {paisFiltro && !modoManual && (
            <div className="flex flex-wrap gap-1.5 p-3 border-b border-line">
              {competicionesDisponibles.map((competicion) => (
                <button
                  key={competicion}
                  type="button"
                  onClick={() => setCompeticionFiltro(competicion)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    competicionFiltro === competicion
                      ? "bg-gold text-feltDark border-gold"
                      : "border-line text-ink hover:border-gold/40"
                  }`}
                >
                  {competicion}
                </button>
              ))}
            </div>
          )}

          {competicionFiltro && (
            <div className="max-h-72 overflow-y-auto">
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
                    className="w-full flex flex-col items-start gap-0.5 px-4 py-2 text-left hover:bg-paperDim transition-colors border-b border-line/60 last:border-b-0"
                  >
                    <span className="text-sm font-medium text-ink">{partido.evento}</span>
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
