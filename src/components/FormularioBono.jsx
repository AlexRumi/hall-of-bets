import { useState } from "react";
import { PlusCircle } from "lucide-react";
import CampoCasa from "./CampoCasa";
import BotonInfoConcepto from "./BotonInfoConcepto";

const hoy = () => new Date().toISOString().slice(0, 10);

// Fase B: desde que el bono de depósito (FormularioMovimiento.jsx) y el
// seguro de una apuesta perdida (App.jsx) suman solos al saldo de freebet
// de la casa (ver useCasas.js), este formulario queda solo para el caso
// residual — bonos que no vienen de ninguno de esos dos sitios. Por eso es
// más pequeño/discreto que el resto de formularios de la app: se usará
// raramente. "Motivo" es texto libre y opcional, solo para recordar de
// dónde viene, no afecta a ningún cálculo. El ℹ️ enlaza al concepto "Bono /
// Freebet" de Academia (mismo patrón que el resto de la app), que ya
// incluye la aclaración de que este formulario es solo para el caso
// residual — antes era un texto propio aquí, duplicado con Academia.
export default function FormularioBono({ onAgregar, casas, casaFija = null }) {
  const [fecha, setFecha] = useState(hoy());
  const [casa, setCasa] = useState(casaFija ?? "");
  const [importe, setImporte] = useState("");
  const [motivo, setMotivo] = useState("");

  function manejarEnvio(e) {
    e.preventDefault();
    const casaFinal = (casaFija ?? casa).trim();
    if (!casaFinal || !importe) return;

    onAgregar({ fecha, casa: casaFinal, importe, motivo: motivo.trim() });

    setCasa(casaFija ?? "");
    setImporte("");
    setMotivo("");
    setFecha(hoy());
  }

  return (
    <form
      onSubmit={manejarEnvio}
      className="bg-surface border border-dashed border-line rounded-lg p-3 sm:p-4 space-y-3"
    >
      <div className="flex items-center gap-1.5">
        <h2 className="text-sm font-semibold text-ink">Otro bono</h2>
        <BotonInfoConcepto conceptoId="bono" etiqueta="Bono / Freebet" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          <label className="block text-xs text-slate mb-1">Importe (€)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={importe}
            onChange={(e) => setImporte(e.target.value)}
            required
            className="w-full border border-line rounded-lg px-3 py-2 text-sm font-mono"
          />
        </div>

        <div>
          <label className="block text-xs text-slate mb-1">Motivo (opcional)</label>
          <input
            type="text"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej. Seguro perdido, bono de bienvenida"
            className="w-full border border-line rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-felt text-paper px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-feltDark transition-colors"
      >
        <PlusCircle size={14} />
        Añadir
      </button>
    </form>
  );
}
