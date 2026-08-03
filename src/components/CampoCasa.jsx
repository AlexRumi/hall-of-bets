// Desplegable de solo selección: las casas se añaden desde la pestaña
// "Casas", así que aquí solo se elige entre las que ya existen (y la lista
// se actualiza sola en cuanto se añade una nueva).
export default function CampoCasa({ casas, valor, onCambiar }) {
  if (casas.length === 0) {
    return (
      <div>
        <label className="block text-xs text-slate mb-1">
          Casa de apuestas
        </label>
        <p className="text-xs text-slate border border-line rounded-lg px-3 py-2">
          Añade una casa primero en la pestaña "Casas".
        </p>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-xs text-slate mb-1">
        Casa de apuestas
      </label>
      <select
        value={valor}
        onChange={(e) => onCambiar(e.target.value)}
        required
        className="w-full border border-line rounded-lg px-3 py-2 text-sm bg-surface"
      >
        <option value="" disabled>
          Selecciona una casa
        </option>
        {casas.map((casa) => (
          <option key={casa.nombre} value={casa.nombre}>
            {casa.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}
