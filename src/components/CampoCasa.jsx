import SelectorDesplegable from "./SelectorDesplegable";

// Desplegable de solo selección: las casas se añaden desde la pestaña
// "Casas", así que aquí solo se elige entre las que ya existen (y la lista
// se actualiza sola en cuanto se añade una nueva). Desplegable propio (ver
// SelectorDesplegable.jsx) en vez de un <select> nativo, para que se vea
// igual de cuidado que el resto del formulario.
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
      <SelectorDesplegable
        valor={valor}
        placeholder="Selecciona una casa"
        grupos={[{ opciones: casas.map((casa) => ({ valor: casa.nombre, texto: casa.nombre })) }]}
        onElegir={onCambiar}
      />
    </div>
  );
}
