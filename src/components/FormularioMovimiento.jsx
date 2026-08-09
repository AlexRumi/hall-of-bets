import { useState } from "react";
import { PlusCircle } from "lucide-react";
import CampoCasa from "./CampoCasa";

const hoy = () => new Date().toISOString().slice(0, 10);

// "casaFija" se usa cuando el formulario se abre desde dentro de la ficha
// de una casa concreta: no hace falta volver a escribirla ni se puede tocar.
export default function FormularioMovimiento({
  onAgregar,
  casas,
  casaFija = null,
  onAjustarSaldoFreebet,
}) {
  const [fecha, setFecha] = useState(hoy());
  const [casa, setCasa] = useState(casaFija ?? "");
  const [tipo, setTipo] = useState("ingreso");
  const [categoria, setCategoria] = useState("apuestas");
  const [cantidad, setCantidad] = useState("");
  const [bono, setBono] = useState("");

  function manejarEnvio(e) {
    e.preventDefault();
    const casaFinal = (casaFija ?? casa).trim();
    if (!casaFinal || !cantidad) return;

    onAgregar({ fecha, casa: casaFinal, tipo, cantidad, categoria });
    if (tipo === "ingreso" && bono && onAjustarSaldoFreebet) {
      onAjustarSaldoFreebet(casaFinal, Number(bono), categoria);
    }

    setCasa(casaFija ?? "");
    setTipo("ingreso");
    setCategoria("apuestas");
    setCantidad("");
    setBono("");
    setFecha(hoy());
  }

  return (
    <form
      onSubmit={manejarEnvio}
      className="bg-surface border border-line rounded-xl p-5 sm:p-6 space-y-4"
    >
      <h2 className="font-display text-lg font-semibold text-ink">
        Nuevo movimiento
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate mb-1">Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            required
            className="w-full border border-line rounded-lg px-3 py-2 text-sm font-mono"
          />
        </div>

        {casaFija === null && (
          <CampoCasa casas={casas} valor={casa} onCambiar={setCasa} />
        )}

        <div>
          <label className="block text-xs text-slate mb-1">Tipo</label>
          <div className="flex gap-2">
            {[
              { valor: "ingreso", etiqueta: "Ingreso" },
              { valor: "retirada", etiqueta: "Retirada" },
            ].map(({ valor, etiqueta }) => (
              <button
                key={valor}
                type="button"
                onClick={() => setTipo(valor)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  tipo === valor
                    ? "bg-felt text-paper border-felt"
                    : "border-line text-slate hover:text-ink"
                }`}
              >
                {etiqueta}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate mb-1">
            Bankroll (a qué categoría pertenece este dinero)
          </label>
          <div className="flex gap-2">
            {[
              { valor: "apuestas", etiqueta: "Apuestas" },
              { valor: "entretenimiento", etiqueta: "Entretenimiento" },
            ].map(({ valor, etiqueta }) => (
              <button
                key={valor}
                type="button"
                onClick={() => setCategoria(valor)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  categoria === valor
                    ? "bg-felt text-paper border-felt"
                    : "border-line text-slate hover:text-ink"
                }`}
              >
                {etiqueta}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate mb-1">Cantidad (€)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            required
            className="w-full border border-line rounded-lg px-3 py-2 text-sm font-mono"
          />
        </div>

        {tipo === "ingreso" && (
          <div>
            <label className="block text-xs text-slate mb-1">
              Bono recibido con este depósito (€, opcional)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={bono}
              onChange={(e) => setBono(e.target.value)}
              placeholder="Ej. 15"
              className="w-full border border-line rounded-lg px-3 py-2 text-sm font-mono"
            />
          </div>
        )}
      </div>

      <button
        type="submit"
        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-felt text-paper px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-feltDark transition-colors"
      >
        <PlusCircle size={16} />
        Añadir movimiento
      </button>
    </form>
  );
}
