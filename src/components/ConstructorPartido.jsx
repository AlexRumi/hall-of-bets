import { useState } from "react";
import { Globe, Plus, RefreshCw, X } from "lucide-react";
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
  // Bug real (petición directa): tras "+" el selector de mercado volvía a
  // abrirse solo, listo para el siguiente — pero si la combinada ya tenía
  // los mercados que hacían falta, se quedaba ahí ocupando sitio sin motivo
  // aparente. Ahora, tras añadir uno, el selector se colapsa del todo a un
  // botón pequeño "+ Añadir otro mercado"; solo se vuelve a mostrar el
  // buscador de verdad si se pulsa ese botón a propósito.
  const [mostrandoSelectorMercado, setMostrandoSelectorMercado] = useState(true);

  function reiniciar() {
    setResetId((n) => n + 1);
    setPaso("partido");
    setPartido(partidoVacio());
    setMercadoSimple("");
    setCuotaSimple("");
    setMercadosMulti([]);
    setMercadoMultiActual("");
    setCuotaMulti("");
    setMostrandoSelectorMercado(true);
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

  function añadirMercadoMulti() {
    if (!mercadoMultiActual.trim()) return;
    setMercadosMulti((actuales) => [...actuales, mercadoMultiActual.trim()]);
    setMercadoMultiActual("");
    setResetId((n) => n + 1);
    setMostrandoSelectorMercado(false);
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
            className="w-full bg-felt text-paper px-4 py-2 rounded-lg text-sm font-medium hover:bg-feltDark transition-colors disabled:opacity-50"
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
            className="w-full bg-felt text-paper px-4 py-2 rounded-lg text-sm font-medium hover:bg-feltDark transition-colors disabled:opacity-50"
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
          {mostrandoSelectorMercado ? (
            <div className="flex gap-2 items-end">
              {/* min-w-0: sin esto, un hijo flex no se encoge por debajo del
                  ancho de su contenido — con las pestañas de categoría de
                  SelectorMercado.jsx (bastantes, en una fila con scroll
                  propio) esto empujaba todo el bloque más ancho que la
                  página en vez de dejar que las pestañas hicieran su propio
                  scroll horizontal contenido. */}
              <div className="flex-1 min-w-0">
                <label className="block text-xs text-slate mb-1">Mercado</label>
                <SelectorMercado
                  key={resetId}
                  evento={partido.evento}
                  valor={mercadoMultiActual}
                  onCambiar={setMercadoMultiActual}
                  equipoLocalId={partido.equipoLocalId}
                  equipoVisitanteId={partido.equipoVisitanteId}
                />
              </div>
              <button
                type="button"
                onClick={añadirMercadoMulti}
                disabled={!mercadoMultiActual.trim()}
                aria-label="Añadir mercado"
                className="shrink-0 bg-gold/10 text-gold border border-gold/40 rounded-lg p-2 hover:bg-gold/20 transition-colors disabled:opacity-40"
              >
                <Plus size={18} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setMostrandoSelectorMercado(true)}
              className="w-full flex items-center justify-center gap-1.5 text-sm font-semibold text-gold border border-gold/40 rounded-lg py-2 hover:bg-gold/10 transition-colors"
            >
              <Plus size={16} />
              Añadir otro mercado
            </button>
          )}

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
            <label className="block text-xs text-slate mb-1">Cuota de este partido (la pones tú)</label>
            <input
              type="number"
              step="0.01"
              min="1.01"
              value={cuotaMulti}
              onChange={(e) => setCuotaMulti(e.target.value)}
              placeholder="Ej. 7,50"
              className="w-full border border-line rounded-lg px-3 py-2 text-sm font-mono"
            />
          </div>

          <button
            type="button"
            onClick={guardarMulti}
            disabled={mercadosMulti.length === 0 || !(Number(cuotaMulti) > 0)}
            className="w-full bg-felt text-paper px-4 py-2 rounded-lg text-sm font-medium hover:bg-feltDark transition-colors disabled:opacity-50"
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
