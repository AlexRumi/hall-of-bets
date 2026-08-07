import { useState } from "react";
import { CATEGORIAS_MERCADO, equiposDesdeEvento } from "../utils/mercados";

const OTRO = "otro";

function buscarOpcion(valor) {
  const [catId, opId] = valor.split("|");
  return CATEGORIAS_MERCADO.find((c) => c.id === catId)?.opciones.find((o) => o.id === opId) ?? null;
}

// Si el texto ya guardado en "Apuesta" coincide con una opción del
// catálogo para este evento, la deja preseleccionada (para poder editar
// una apuesta ya creada); si no coincide con nada (apuestas de antes de
// este desplegable, o texto libre), abre directamente en "Otro mercado"
// para no esconder lo que ya había escrito.
function seleccionInicial(valorApuesta, equipos) {
  if (!valorApuesta) return "";
  for (const categoria of CATEGORIAS_MERCADO) {
    for (const opcion of categoria.opciones) {
      if (opcion.texto(equipos) === valorApuesta) return `${categoria.id}|${opcion.id}`;
    }
  }
  return OTRO;
}

// Campo "Apuesta" de una selección (ver FormularioApuesta.jsx): un único
// desplegable con el mercado, agrupado por categoría (mismo patrón que el
// de País en BuscadorEvento.jsx — ir bajando la lista en vez de escribir).
// Elegir un mercado concreto ya deja el texto final listo, sin nada más
// que rellenar; el campo de texto libre solo aparece si se elige "Otro
// mercado".
export default function SelectorMercado({ evento, valor, onCambiar }) {
  const equipos = equiposDesdeEvento(evento);
  const [seleccion, setSeleccion] = useState(() => seleccionInicial(valor, equipos));

  function manejarCambio(nuevaSeleccion) {
    setSeleccion(nuevaSeleccion);
    if (nuevaSeleccion === OTRO || nuevaSeleccion === "") return;
    const opcion = buscarOpcion(nuevaSeleccion);
    if (opcion) onCambiar(opcion.texto(equipos));
  }

  return (
    <div className="space-y-2">
      <select
        value={seleccion}
        onChange={(e) => manejarCambio(e.target.value)}
        required
        className="w-full border border-line rounded-lg px-3 py-2 text-sm bg-surface text-ink"
      >
        <option value="" disabled>
          Selecciona un mercado
        </option>
        {CATEGORIAS_MERCADO.map((categoria) => (
          <optgroup key={categoria.id} label={categoria.etiqueta}>
            {categoria.opciones.map((opcion) => (
              <option key={opcion.id} value={`${categoria.id}|${opcion.id}`}>
                {opcion.texto(equipos)}
              </option>
            ))}
          </optgroup>
        ))}
        <option value={OTRO} className="font-bold">
          Otro mercado
        </option>
      </select>

      {seleccion === OTRO && (
        <input
          type="text"
          value={valor}
          onChange={(e) => onCambiar(e.target.value)}
          placeholder="Ej. Gana Real Madrid"
          required
          className="w-full border border-line rounded-lg px-3 py-2 text-sm"
        />
      )}
    </div>
  );
}
