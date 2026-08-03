import { useState } from "react";
import { X } from "lucide-react";

const CASA_NUEVA = "__nueva__";

// Selector de casa de apuestas reutilizable: desplegable con las casas ya
// guardadas, más la opción de escribir una nueva (que se añade a la lista
// gestionable en cuanto el usuario sale del campo).
export default function CampoCasa({ casas, valor, onCambiar, onAgregarCasa }) {
  const [nuevaForzada, setNuevaForzada] = useState(false);
  // Se muestra el campo de texto si el usuario eligió "añadir casa nueva",
  // o si todavía no hay ninguna casa guardada para elegir.
  const modoNuevaCasa = nuevaForzada || casas.length === 0;

  function manejarCambioSelect(seleccionado) {
    if (seleccionado === CASA_NUEVA) {
      setNuevaForzada(true);
      onCambiar("");
    } else {
      setNuevaForzada(false);
      onCambiar(seleccionado);
    }
  }

  function confirmarCasaNueva() {
    const limpio = valor.trim();
    if (limpio) onAgregarCasa(limpio);
  }

  return (
    <div>
      <label className="block text-xs text-slate mb-1">Casa de apuestas</label>
      {modoNuevaCasa ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={valor}
            onChange={(e) => onCambiar(e.target.value)}
            onBlur={confirmarCasaNueva}
            placeholder="Ej. Bet365"
            required
            autoFocus
            className="flex-1 min-w-0 border border-line rounded-lg px-3 py-2 text-sm"
          />
          {casas.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setNuevaForzada(false);
                onCambiar("");
              }}
              aria-label="Cancelar casa nueva"
              className="shrink-0 text-slate hover:text-lose transition-colors p-2"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ) : (
        <select
          value={valor}
          onChange={(e) => manejarCambioSelect(e.target.value)}
          required
          className="w-full border border-line rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="" disabled>
            Selecciona una casa
          </option>
          {casas.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
          <option value={CASA_NUEVA}>+ Añadir casa nueva…</option>
        </select>
      )}
    </div>
  );
}
