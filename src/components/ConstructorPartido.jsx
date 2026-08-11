import { useState } from "react";
import { Globe, RefreshCw, X } from "lucide-react";
import BuscadorEvento from "./BuscadorEvento";
import SelectorMercado from "./SelectorMercado";

const partidoVacio = () => ({
  evento: "",
  pais: "",
  competicion: "",
  partidoId: null,
  equipoLocalId: null,
  equipoVisitanteId: null,
  hora: null,
  fecha: null,
});

// Evita que pulsar Enter en cualquier campo de aquí dentro (el buscador de
// partido, el selector de mercado, la cuota...) envíe todo el formulario de
// la apuesta antes de tiempo — el único botón type="submit" de la página es
// el de guardar la apuesta completa, más abajo, fuera de este componente.
function evitarEnvioConEnter(e) {
  if (e.key === "Enter") e.preventDefault();
}

// Construye un "bloque" (un partido, con uno o varios mercados y una única
// cuota) para FormularioApuesta.jsx. Primero se elige el partido
// (reutilizando BuscadorEvento) y luego se elige cómo añadirlo:
// - "Añadir cuota": un solo mercado con su propia cuota (como una selección
//   normal de toda la vida).
// - "Crear multi de este partido": varios mercados del mismo partido sin
//   cuota individual por mercado (no tiene sentido pedirla: la cuota
//   combinada de varios mercados del mismo partido no es el producto de
//   las cuotas sueltas, es la que da la propia casa) — una única "Cuota de
//   este partido" al final.
// Al guardar (onGuardarBloque) el componente se reinicia solo, listo para
// el siguiente partido. "key={resetId}" en BuscadorEvento/SelectorMercado
// los remonta con estado limpio: su valor inicial solo se calcula una vez
// al montar, así que cambiar el prop "valor" a "" desde aquí no bastaría
// para vaciarlos visualmente.
export default function ConstructorPartido({ fecha, onFechaPartido, onGuardarBloque }) {
  const [resetId, setResetId] = useState(0);
  const [paso, setPaso] = useState("partido");
  const [partido, setPartido] = useState(partidoVacio());
  const [mercadoSimple, setMercadoSimple] = useState("");
  const [cuotaSimple, setCuotaSimple] = useState("");
  const [mercadosMulti, setMercadosMulti] = useState([]);
  const [mercadoMultiActual, setMercadoMultiActual] = useState("");
  const [cuotaMulti, setCuotaMulti] = useState("");

  function reiniciar() {
    setResetId((n) => n + 1);
    setPaso("partido");
    setPartido(partidoVacio());
    setMercadoSimple("");
    setCuotaSimple("");
    setMercadosMulti([]);
    setMercadoMultiActual("");
    setCuotaMulti("");
  }

  function elegirPartido(partidoElegido) {
    setPartido({
      evento: partidoElegido.evento,
      pais: partidoElegido.pais,
      competicion: partidoElegido.competicion,
      partidoId: partidoElegido.id,
      equipoLocalId: partidoElegido.equipoLocalId ?? null,
      equipoVisitanteId: partidoElegido.equipoVisitanteId ?? null,
      hora: partidoElegido.hora ?? null,
      // Fecha propia del partido, aparte de "fecha" (la de toda la
      // apuesta, ver onFechaPartido más abajo): en una combinada con
      // partidos de días distintos, ese campo compartido se sobrescribe
      // con el último partido elegido, así que no sirve para saber la
      // hora de inicio real de CADA partido — ver horaInicioPartido en
      // ApuestaItem.jsx.
      fecha: partidoElegido.fecha ?? null,
    });
    onFechaPartido(partidoElegido.fecha);
  }

  function confirmarPartido() {
    if (!partido.evento.trim()) return;
    setPaso("modo");
  }

  function guardarSimple() {
    if (!mercadoSimple.trim() || !(Number(cuotaSimple) > 0)) return;
    onGuardarBloque({ ...partido, cuota: Number(cuotaSimple), mercados: [mercadoSimple.trim()] });
    reiniciar();
  }

  // Petición directa: elegir una opción del selector ya es la acción
  // completa — antes hacía falta un botón "+ Añadir mercado" aparte. Se
  // llama con el texto ya definitivo (onFinalizar de SelectorMercado.jsx,
  // no onCambiar) desde el mercado elegido, se añade a la lista acumulada
  // y se fuerza un remount del selector (mismo truco key={resetId} que ya
  // usaba el resto del componente) para que vuelva a su estado inicial —
  // sin categoría ni subcategoría elegidas — listo para el siguiente
  // mercado, que puede ser de una categoría distinta.
  function finalizarMercadoMulti(texto) {
    if (!texto.trim()) return;
    setMercadosMulti((actuales) => [...actuales, texto.trim()]);
    setMercadoMultiActual("");
    setResetId((n) => n + 1);
  }

  function quitarMercadoMulti(index) {
    setMercadosMulti((actuales) => actuales.filter((_, i) => i !== index));
  }

  function guardarMulti() {
    if (mercadosMulti.length === 0 || !(Number(cuotaMulti) > 0)) return;
    onGuardarBloque({ ...partido, cuota: Number(cuotaMulti), mercados: mercadosMulti });
    reiniciar();
  }

  return (
    <div
      onKeyDown={evitarEnvioConEnter}
      className="border border-line rounded-lg p-4 space-y-3"
    >
      {paso !== "partido" && (
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold border border-gold/40 rounded-full px-3 py-1 max-w-full">
          <Globe size={14} className="shrink-0" />
          <span className="truncate">{partido.evento}</span>
        </span>
      )}

      {paso === "partido" && (
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-slate mb-1">Partido</label>
            <BuscadorEvento
              key={resetId}
              valor={partido.evento}
              fecha={fecha}
              onCambiar={(valor) => setPartido((actual) => ({ ...actual, evento: valor }))}
              onElegirPartido={elegirPartido}
            />
          </div>
          <button
            type="button"
            onClick={confirmarPartido}
            disabled={!partido.evento.trim()}
            className="w-full bg-gold text-feltDark px-4 py-2 rounded-lg text-sm font-medium hover:bg-goldDark transition-colors disabled:opacity-50"
          >
            Elegir este partido →
          </button>
        </div>
      )}

      {paso === "modo" && (
        <div className="space-y-2">
          <p className="text-sm text-ink">¿Qué quieres hacer con este partido?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaso("simple")}
              className="text-left border border-line rounded-lg p-3 hover:border-gold/40 transition-colors"
            >
              <p className="text-sm font-semibold text-ink">+ Añadir cuota</p>
              <p className="text-xs text-slate mt-0.5">Un mercado, su propia cuota</p>
            </button>
            <button
              type="button"
              onClick={() => setPaso("multi")}
              className="text-left border border-line rounded-lg p-3 hover:border-gold/40 transition-colors"
            >
              <p className="text-sm font-semibold text-ink">Crear multi de este partido</p>
              <p className="text-xs text-slate mt-0.5">Varios mercados, 1 cuota final</p>
            </button>
          </div>
          <button
            type="button"
            onClick={reiniciar}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-slate hover:text-ink transition-colors py-1.5"
          >
            <RefreshCw size={12} />
            Cambiar de partido
          </button>
        </div>
      )}

      {paso === "simple" && (
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-slate mb-1">Mercado</label>
            <SelectorMercado
              key={resetId}
              evento={partido.evento}
              valor={mercadoSimple}
              onCambiar={setMercadoSimple}
              equipoLocalId={partido.equipoLocalId}
              equipoVisitanteId={partido.equipoVisitanteId}
            />
          </div>
          <div>
            <label className="block text-xs text-slate mb-1">Cuota</label>
            <input
              type="number"
              step="0.01"
              min="1.01"
              value={cuotaSimple}
              onChange={(e) => setCuotaSimple(e.target.value)}
              placeholder="2,10"
              className="w-full border border-line rounded-lg px-3 py-2 text-sm font-mono"
            />
          </div>
          <button
            type="button"
            onClick={guardarSimple}
            disabled={!mercadoSimple.trim() || !(Number(cuotaSimple) > 0)}
            className="w-full bg-win text-paper px-4 py-2 rounded-lg text-sm font-medium hover:brightness-90 transition disabled:opacity-50"
          >
            Guardar selección
          </button>
          <button
            type="button"
            onClick={() => setPaso("modo")}
            className="w-full text-xs font-medium text-slate hover:text-ink transition-colors"
          >
            ← Volver
          </button>
        </div>
      )}

      {paso === "multi" && (
        <div className="space-y-2">
          {mercadosMulti.length > 0 && (
            <ul className="space-y-1.5">
              {mercadosMulti.map((mercado, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-2 bg-paperDim rounded-lg px-3 py-2 text-sm text-ink"
                >
                  {mercado}
                  <button
                    type="button"
                    onClick={() => quitarMercadoMulti(i)}
                    aria-label="Quitar mercado"
                    className="text-slate hover:text-lose transition-colors shrink-0"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div>
            <label className="block text-xs text-slate mb-1">
              {mercadosMulti.length === 0 ? "Mercado" : "Añadir otro mercado"}
            </label>
            <SelectorMercado
              key={resetId}
              evento={partido.evento}
              valor={mercadoMultiActual}
              onCambiar={setMercadoMultiActual}
              onFinalizar={finalizarMercadoMulti}
              equipoLocalId={partido.equipoLocalId}
              equipoVisitanteId={partido.equipoVisitanteId}
            />
          </div>

          <div>
            <label className="block text-xs text-slate mb-1">Cuota de este partido (la pones tú)</label>
            <input
              type="number"
              step="0.01"
              min="1.01"
              value={cuotaMulti}
              onChange={(e) => setCuotaMulti(e.target.value)}
              placeholder="Ej. 7,50"
              disabled={mercadosMulti.length === 0}
              className="w-full border border-line rounded-lg px-3 py-2 text-sm font-mono disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <button
            type="button"
            onClick={guardarMulti}
            disabled={mercadosMulti.length === 0 || !(Number(cuotaMulti) > 0)}
            className="w-full bg-win text-paper px-4 py-2 rounded-lg text-sm font-medium hover:brightness-90 transition disabled:opacity-50"
          >
            Guardar grupo del partido
          </button>
          <button
            type="button"
            onClick={() => setPaso("modo")}
            className="w-full text-xs font-medium text-slate hover:text-ink transition-colors"
          >
            ← Volver
          </button>
        </div>
      )}
    </div>
  );
}
