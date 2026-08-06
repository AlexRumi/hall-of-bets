import { useState } from "react";
import { PlusCircle, Save, X } from "lucide-react";
import { calcularCuotaTotal } from "../utils/apuestas";
import CampoCasa from "./CampoCasa";

const hoy = () => new Date().toISOString().slice(0, 10);
const seleccionVacia = () => ({ evento: "", apuesta: "", cuota: "" });
const DEPORTES = ["Fútbol", "Baloncesto", "Tenis", "eSports", "Otro"];
const seleccionesDesdeApuesta = (apuesta) =>
  apuesta.selecciones.map((s) => ({
    evento: s.evento,
    apuesta: s.apuesta,
    cuota: String(s.cuota),
  }));

// Mismo formulario para crear una apuesta nueva y para editar una ya
// existente: si se recibe apuestaInicial, se precargan sus datos y el envío
// llama a onGuardar en vez de resetear el formulario.
export default function FormularioApuesta({
  casas,
  apuestaInicial = null,
  onGuardar,
  onCancelar,
}) {
  const esEdicion = apuestaInicial !== null;
  const [fecha, setFecha] = useState(apuestaInicial?.fecha ?? hoy());
  const [casa, setCasa] = useState(apuestaInicial?.casa ?? "");
  const [cantidadApostada, setCantidadApostada] = useState(
    apuestaInicial ? String(apuestaInicial.stake) : ""
  );
  const [tipoFondos, setTipoFondos] = useState(
    apuestaInicial?.tipoFondos ?? "real"
  );
  const [deporte, setDeporte] = useState(apuestaInicial?.deporte ?? "Fútbol");
  const [selecciones, setSelecciones] = useState(
    apuestaInicial ? seleccionesDesdeApuesta(apuestaInicial) : [seleccionVacia()]
  );

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
      (s) => s.evento.trim() && s.apuesta.trim() && Number(s.cuota) > 0
    );
    if (!casaFinal || !cantidadApostada || !seleccionesValidas) return;

    onGuardar({
      fecha,
      casa: casaFinal,
      stake: cantidadApostada,
      tipoFondos,
      deporte,
      selecciones: selecciones.map((s) => ({
        evento: s.evento.trim(),
        apuesta: s.apuesta.trim(),
        cuota: s.cuota,
      })),
    });

    if (esEdicion) {
      onCancelar();
      return;
    }

    setCasa("");
    setCantidadApostada("");
    setTipoFondos("real");
    setDeporte("Fútbol");
    setSelecciones([seleccionVacia()]);
    setFecha(hoy());
  }

  return (
    <form
      onSubmit={manejarEnvio}
      className="bg-surface border border-line rounded-xl p-5 sm:p-6 space-y-4"
    >
      <h2 className="font-display text-lg font-semibold text-ink">
        {esEdicion ? "Editar apuesta" : "Nueva apuesta"}
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

        <CampoCasa casas={casas} valor={casa} onCambiar={setCasa} />

        <div>
          <label className="block text-xs text-slate mb-1">
            Cantidad apostada (€)
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={cantidadApostada}
            onChange={(e) => setCantidadApostada(e.target.value)}
            required
            className="w-full border border-line rounded-lg px-3 py-2 text-sm font-mono"
          />
        </div>

        <div>
          <label className="block text-xs text-slate mb-1">Deporte</label>
          <select
            value={deporte}
            onChange={(e) => setDeporte(e.target.value)}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm bg-surface text-ink"
          >
            {DEPORTES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
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
          <label className="block text-xs text-slate">Selecciones</label>
          {cuotaTotal !== null && (
            <span className="text-xs font-mono text-gold font-medium">
              Cuota total: {cuotaTotal.toFixed(2)}
            </span>
          )}
        </div>

        {selecciones.map((seleccion, index) => (
          <div
            key={index}
            className="border border-line rounded-lg p-3 space-y-2"
          >
            <div>
              <label className="block text-xs text-slate mb-1">Evento</label>
              <input
                type="text"
                value={seleccion.evento}
                onChange={(e) =>
                  actualizarSeleccion(index, "evento", e.target.value)
                }
                placeholder="Ej. Real Madrid - FC Barcelona"
                required
                className="w-full border border-line rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="flex gap-2 items-end">
              <div className="flex-1 min-w-0">
                <label className="block text-xs text-slate mb-1">
                  Apuesta
                </label>
                <input
                  type="text"
                  value={seleccion.apuesta}
                  onChange={(e) =>
                    actualizarSeleccion(index, "apuesta", e.target.value)
                  }
                  placeholder="Ej. Gana Real Madrid"
                  required
                  className="w-full border border-line rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="w-24 shrink-0">
                <label className="block text-xs text-slate mb-1">Cuota</label>
                <input
                  type="number"
                  step="0.01"
                  min="1.01"
                  value={seleccion.cuota}
                  onChange={(e) =>
                    actualizarSeleccion(index, "cuota", e.target.value)
                  }
                  placeholder="2,10"
                  required
                  className="w-full border border-line rounded-lg px-3 py-2 text-sm font-mono"
                />
              </div>
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

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-felt text-paper px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-feltDark transition-colors"
        >
          {esEdicion ? <Save size={16} /> : <PlusCircle size={16} />}
          {esEdicion ? "Guardar cambios" : "Añadir apuesta"}
        </button>
        {esEdicion && (
          <button
            type="button"
            onClick={onCancelar}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-medium border border-line text-slate hover:text-ink transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
