import { useEffect, useRef, useState } from "react";
import { usePartidos } from "../hooks/usePartidos";
import { PAISES_CONECTADOS } from "../utils/ligasConectadas";

// Quita acentos para que "atletico" encuentre "Atletico" al escribir.
function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

// Campo "Evento" con autocompletado: si el partido está en una de las
// ligas conectadas (ver api/partidos.js) para la fecha de la apuesta, se
// puede elegir de una lista y se rellenan solos evento/país/competición.
// Los desplegables de País/Competición son solo para filtrar la lista antes
// de escribir (p.ej. elegir "Europa" para ver solo Champions/Europa
// League/Conference) — no se guardan hasta que se elige un partido de
// verdad, para no acabar con un país guardado sin un evento real detrás.
// Si no aparece nada (liga no conectada, sin conexión, o en local sin
// "vercel dev"), se sigue pudiendo escribir a mano como siempre — esto
// nunca bloquea el formulario.
export default function BuscadorEvento({ valor, fecha, onCambiar, onElegirPartido }) {
  const [abierto, setAbierto] = useState(false);
  const [paisFiltro, setPaisFiltro] = useState("");
  const [competicionFiltro, setCompeticionFiltro] = useState("");
  const contenedorRef = useRef(null);
  const partidos = usePartidos(fecha);

  useEffect(() => {
    function manejarClickFuera(e) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", manejarClickFuera);
    return () => document.removeEventListener("mousedown", manejarClickFuera);
  }, []);

  const competicionesDisponibles = paisFiltro
    ? PAISES_CONECTADOS.find((p) => p.pais === paisFiltro)?.competiciones ?? []
    : [];

  const coincidencias = partidos
    .filter((p) => !paisFiltro || p.pais === paisFiltro)
    .filter((p) => !competicionFiltro || p.competicion === competicionFiltro)
    .filter((p) => !valor.trim() || normalizar(p.evento).includes(normalizar(valor)))
    .slice(0, 8);

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
          <option value="">País</option>
          {PAISES_CONECTADOS.map(({ pais }) => (
            <option key={pais} value={pais}>
              {pais}
            </option>
          ))}
        </select>
        <select
          value={competicionFiltro}
          onChange={(e) => {
            setCompeticionFiltro(e.target.value);
            setAbierto(true);
          }}
          disabled={!paisFiltro}
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
          placeholder="Ej. Real Madrid - FC Barcelona"
          required
          className="w-full border border-line rounded-lg px-3 py-2 text-sm"
        />

        {abierto && coincidencias.length > 0 && (
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
