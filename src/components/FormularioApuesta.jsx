import { useState } from "react";
import { PlusCircle, X } from "lucide-react";
import { calcularCuotaTotal } from "../utils/apuestas";
import CampoCasa from "./CampoCasa";

const hoy = () => new Date().toISOString().slice(0, 10);
const seleccionVacia = () => ({ evento: "", cuota: "" });

export default function FormularioApuesta({ onAgregar, casas, onAgregarCasa }) {
  const [fecha, setFecha] = useState(hoy());
  const [casa, setCasa] = useState("");
  const [resetCasa, setResetCasa] = useState(0);
  const [stake, setStake] = useState("");
  const [tipoFondos, setTipoFondos] = useState("real");
  const [selecciones, setSelecciones] = useState([seleccionVacia()]);

  const esCombinada = selecciones.length > 1;

  // Cuota total en vivo, solo con las selecciones que ya tienen una cuota válida.
  const cuotasValidas = selecciones
    .map((s) => Number(s.cuota))
    .filter((cuota) => cuota > 0);
  const cuotaTotal =
    cuotasValidas.length === selecciones.length
      ? calcularCuotaTotal(cuotasValidas.map((cuota) => ({ cuota })))
      : null;

  function actualizarSeleccion(index, campo, valor) {
    setSelecciones((actuales) =>
      actuales.map((s, i) => (i === index ? { ...s, [campo]: valor } : s))
    );
  }

  function añadirSeleccion() {
    setSelecciones((actuales) => [...actuales, seleccionVacia()]);
  }

  function quitarSeleccion(index) {
    setSelecciones((actuales) => actuales.filter((_, i) => i !== index));
  }

  function manejarEnvio(e) {
    e.preventDefault();

    const casaFinal = casa.trim();
    const seleccionesValidas = selecciones.every(
      (s) => s.evento.trim() && Number(s.cuota) > 0
    );
    if (!casaFinal || !stake || !seleccionesValidas) return;

    onAgregar({
      fecha,
      casa: casaFinal,
      stake,
      tipoFondos,
      selecciones: selecciones.map((s) => ({
        evento: s.evento.trim(),
        cuota: s.cuota,
      })),
    });

    setCasa("");
    setResetCasa((k) => k + 1);
    setStake("");
    setTipoFondos("real");
    setSelecciones([seleccionVacia()]);
    setFecha(hoy());
  }

  return (
    <form
      onSubmit={manejarEnvio}
      className="bg-white border border-line rounded-xl p-5 sm:p-6 space-y-4"
    >
      <h2 className="font-display text-lg font-semibold text-ink">
        Nueva apuesta
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
          <label className="block text-xs text-slate mb-1">Stake (€)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            required
            className="w-full border border-line rounded-lg px-3 py-2 text-sm font-mono"
          />
        </div>

        <div>
          <label className="block text-xs text-slate mb-1">
            Tipo de fondos
          </label>
          <div className="flex gap-2">
            {[
              { valor: "real", etiqueta: "Real" },
              { valor: "freebet", etiqueta: "Freebet" },
            ].map(({ valor, etiqueta }) => (
              <button
                key={valor}
                type="button"
                onClick={() => setTipoFondos(valor)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  tipoFondos === valor
                    ? "bg-felt text-paper border-felt"
                    : "border-line text-slate hover:text-ink"
                }`}
              >
                {etiqueta}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs text-slate">
            {esCombinada ? "Selecciones" : "Evento y cuota"}
          </label>
          {cuotaTotal !== null && (
            <span className="text-xs font-mono text-gold font-medium">
              Cuota total: {cuotaTotal.toFixed(2)}
            </span>
          )}
        </div>

        {selecciones.map((seleccion, index) => (
          <div key={index} className="flex gap-2 items-start">
            <input
              type="text"
              value={seleccion.evento}
              onChange={(e) =>
                actualizarSeleccion(index, "evento", e.target.value)
              }
              placeholder="Ej. Real Madrid - Barcelona, gana Madrid"
              required
              className="flex-1 min-w-0 border border-line rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="number"
              step="0.01"
              min="1.01"
              value={seleccion.cuota}
              onChange={(e) =>
                actualizarSeleccion(index, "cuota", e.target.value)
              }
              placeholder="Cuota"
              required
              className="w-24 shrink-0 border border-line rounded-lg px-3 py-2 text-sm font-mono"
            />
            {selecciones.length > 1 && (
              <button
                type="button"
                onClick={() => quitarSeleccion(index)}
                aria-label="Quitar selección"
                className="shrink-0 text-slate hover:text-lose transition-colors p-2"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={añadirSeleccion}
          className="text-xs font-medium text-gold hover:underline"
        >
          + Añadir cuota
        </button>
      </div>

      <button
        type="submit"
        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-felt text-paper px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-feltDark transition-colors"
      >
        <PlusCircle size={16} />
        Añadir apuesta
      </button>
    </form>
  );
}
