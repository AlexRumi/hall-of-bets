import { useState } from "react";
import { PlusCircle } from "lucide-react";
import CampoCasa from "./CampoCasa";

const hoy = () => new Date().toISOString().slice(0, 10);

export default function FormularioPromocion({ onAgregar, casas, onAgregarCasa }) {
  const [fecha, setFecha] = useState(hoy());
  const [casa, setCasa] = useState("");
  const [resetCasa, setResetCasa] = useState(0);
  const [tipo, setTipo] = useState("");
  const [valor, setValor] = useState("");

  function manejarEnvio(e) {
    e.preventDefault();
    const casaFinal = casa.trim();
    if (!casaFinal || !tipo.trim() || !valor) return;

    onAgregar({ fecha, casa: casaFinal, tipo: tipo.trim(), valor });

    setCasa("");
    setResetCasa((k) => k + 1);
    setTipo("");
    setValor("");
    setFecha(hoy());
  }

  return (
    <form
      onSubmit={manejarEnvio}
      className="bg-white border border-line rounded-xl p-5 sm:p-6 space-y-4"
    >
      <h2 className="font-display text-lg font-semibold text-ink">
        Nueva promoción
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

        <CampoCasa
          key={resetCasa}
          casas={casas}
          valor={casa}
          onCambiar={setCasa}
          onAgregarCasa={onAgregarCasa}
        />

        <div>
          <label className="block text-xs text-slate mb-1">Tipo</label>
          <input
            type="text"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            placeholder="Ej. Freebet de bienvenida"
            required
            className="w-full border border-line rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-slate mb-1">Valor (€)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            required
            className="w-full border border-line rounded-lg px-3 py-2 text-sm font-mono"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-felt text-paper px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-feltDark transition-colors"
      >
        <PlusCircle size={16} />
        Añadir promoción
      </button>
    </form>
  );
}
