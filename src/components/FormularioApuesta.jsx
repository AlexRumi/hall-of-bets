import { useState } from "react";
import { PlusCircle, Save, X, AlertTriangle } from "lucide-react";
import { calcularCuotaTotal } from "../utils/apuestas";
import { calcularBankrollPorCasa } from "../utils/movimientos";
import CampoCasa from "./CampoCasa";
import BuscadorEvento from "./BuscadorEvento";
import SelectorMercado from "./SelectorMercado";
// "Ver cuotas" (CuotasDialog) se queda comentado, no borrado: al registrar
// una apuesta la casa ya está decidida (la apuesta ya está hecha), así que
// comparar cuotas de otras casas aquí tiene poco sentido ahora mismo. Podría
// tener más sentido en un futuro "modo planificación" antes de apostar.
// import CuotasDialog from "./CuotasDialog";

const hoy = () => new Date().toISOString().slice(0, 10);
const seleccionVacia = () => ({
  evento: "",
  apuesta: "",
  cuota: "",
  pais: "",
  competicion: "",
  partidoId: null,
});
const DEPORTES = ["Fútbol", "Baloncesto", "Tenis", "eSports", "Otro"];
const seleccionesDesdeApuesta = (apuesta) =>
  apuesta.selecciones.map((s) => ({
    evento: s.evento,
    apuesta: s.apuesta,
    cuota: String(s.cuota),
    // Las apuestas de antes de conectar el buscador de partidos no tienen
    // país/competición/id de partido guardados.
    pais: s.pais ?? "",
    competicion: s.competicion ?? "",
    partidoId: s.partidoId ?? null,
  }));

// Mismo formulario para crear una apuesta nueva y para editar una ya
// existente: si se recibe apuestaInicial, se precargan sus datos y el envío
// llama a onGuardar en vez de resetear el formulario.
export default function FormularioApuesta({
  casas,
  movimientos = [],
  apuestas = [],
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
  const [asegurada, setAsegurada] = useState(!!apuestaInicial?.seguroFreebetImporte);
  const [seguroImporte, setSeguroImporte] = useState(
    apuestaInicial?.seguroFreebetImporte ? String(apuestaInicial.seguroFreebetImporte) : ""
  );
  const [conAumento, setConAumento] = useState(!!apuestaInicial?.aumentoPct);
  const [aumentoPct, setAumentoPct] = useState(
    apuestaInicial?.aumentoPct ? String(apuestaInicial.aumentoPct) : ""
  );
  // const [indiceCuotas, setIndiceCuotas] = useState(null); // "Ver cuotas", ver import de arriba

  const esCombinada = selecciones.length > 1;

  // Bankroll actual de la casa elegida (mismo cálculo que en Casas de
  // apuestas: ingresos - retiradas + beneficio de apuestas ya resueltas).
  // Ojo: no descuenta el stake de apuestas todavía pendientes en esa casa,
  // igual que el resto de la app.
  const bankrollCasa = casa
    ? calcularBankrollPorCasa(movimientos, apuestas).find((b) => b.casa === casa)
        ?.bankroll ?? 0
    : null;
  const stakeNumero = Number(cantidadApostada) || 0;
  const sinBankroll = bankrollCasa !== null && bankrollCasa <= 0;
  const superaBankroll =
    !sinBankroll && bankrollCasa !== null && stakeNumero > bankrollCasa;

  // Saldo de freebet de esa casa (Fase A: se ajusta solo, ver App.jsx —
  // sube con bonos de depósito/seguro, baja al crear una apuesta Freebet).
  // No es dinero del bankroll, así que se avisa aparte, no como "bankroll".
  const freebetsCasa = casa ? casas.find((c) => c.nombre === casa)?.freebetSaldo ?? 0 : 0;
  const sinFreebets = freebetsCasa <= 0;
  const superaFreebets = !sinFreebets && stakeNumero > freebetsCasa;

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

  // Al elegir un partido del buscador: rellena evento/país/competición de
  // esa selección, y pone la fecha de la apuesta a la del partido (la
  // última selección elegida manda, para el caso normal de una sola fecha).
  function aplicarPartido(index, partido) {
    setSelecciones((actuales) =>
      actuales.map((s, i) =>
        i === index
          ? {
              ...s,
              evento: partido.evento,
              pais: partido.pais,
              competicion: partido.competicion,
              partidoId: partido.id,
            }
          : s
      )
    );
    setFecha(partido.fecha);
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
      seguroFreebetImporte: asegurada ? Number(seguroImporte) : null,
      aumentoPct: conAumento ? Number(aumentoPct) : null,
      selecciones: selecciones.map((s) => ({
        evento: s.evento.trim(),
        apuesta: s.apuesta.trim(),
        cuota: s.cuota,
        pais: s.pais || null,
        competicion: s.competicion || null,
        partidoId: s.partidoId || null,
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
    setAsegurada(false);
    setSeguroImporte("");
    setConAumento(false);
    setAumentoPct("");
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

        <div>
          <CampoCasa casas={casas} valor={casa} onCambiar={setCasa} />
          {bankrollCasa !== null && (
            <div className="mt-1 space-y-0.5">
              <p
                className={`text-xs flex items-center gap-1 ${
                  tipoFondos === "real" && (sinBankroll || superaBankroll)
                    ? "text-lose"
                    : "text-slate"
                }`}
              >
                {tipoFondos === "real" && (sinBankroll || superaBankroll) && (
                  <AlertTriangle size={12} />
                )}
                {tipoFondos === "real" && superaBankroll
                  ? `Dinero real: el importe supera lo disponible (${bankrollCasa.toFixed(2)}€).`
                  : `Dinero real: ${sinBankroll ? "no disponible" : `${bankrollCasa.toFixed(2)}€ disponibles`}.`}
              </p>
              <p
                className={`text-xs flex items-center gap-1 ${
                  tipoFondos === "freebet" && (sinFreebets || superaFreebets)
                    ? "text-lose"
                    : "text-gold"
                }`}
              >
                {tipoFondos === "freebet" && (sinFreebets || superaFreebets) && (
                  <AlertTriangle size={12} />
                )}
                {tipoFondos === "freebet" && superaFreebets
                  ? `Freebets: el importe supera el saldo disponible (${freebetsCasa.toFixed(2)}€).`
                  : `Freebets: ${sinFreebets ? "no disponibles" : `${freebetsCasa.toFixed(2)}€ disponibles`}.`}
              </p>
            </div>
          )}
        </div>

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

        <div
          className={`sm:col-span-2 rounded-lg border p-3 transition-colors ${
            asegurada ? "border-gold bg-gold/10" : "border-line"
          }`}
        >
          <label className="flex items-center gap-2 text-sm font-semibold text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={asegurada}
              onChange={(e) => setAsegurada(e.target.checked)}
              className="w-4 h-4 accent-gold"
            />
            Apuesta asegurada
          </label>
          {asegurada && (
            <div className="mt-2 space-y-1">
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={seguroImporte}
                onChange={(e) => setSeguroImporte(e.target.value)}
                placeholder="Importe del freebet (€)"
                required
                className="w-full sm:max-w-xs border border-line rounded-lg px-3 py-2 text-sm font-mono bg-surface"
              />
              <p className="text-xs text-slate">
                Se sumará al saldo de freebet de la casa si la marcas como Perdida.
              </p>
            </div>
          )}
        </div>

        <div
          className={`sm:col-span-2 rounded-lg border p-3 transition-colors ${
            conAumento ? "border-gold bg-gold/10" : "border-line"
          }`}
        >
          <label className="flex items-center gap-2 text-sm font-semibold text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={conAumento}
              onChange={(e) => setConAumento(e.target.checked)}
              className="w-4 h-4 accent-gold"
            />
            Aumento de cuota
          </label>
          {conAumento && (
            <div className="mt-2">
              <input
                type="number"
                step="1"
                min="1"
                max="200"
                value={aumentoPct}
                onChange={(e) => setAumentoPct(e.target.value)}
                placeholder="% de aumento"
                required
                className="w-full sm:max-w-xs border border-line rounded-lg px-3 py-2 text-sm font-mono bg-surface"
              />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-line">
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
            className="border border-line rounded-lg p-4 space-y-3"
          >
            <div>
              <label className="block text-xs text-slate mb-1">Evento</label>
              <BuscadorEvento
                valor={seleccion.evento}
                fecha={fecha}
                onCambiar={(valor) => actualizarSeleccion(index, "evento", valor)}
                onElegirPartido={(partido) => aplicarPartido(index, partido)}
              />
              {seleccion.pais && (
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-xs text-slate">
                    {seleccion.competicion} · {seleccion.pais}
                  </p>
                  {/* "Ver cuotas" oculto por ahora, ver comentario junto al import de CuotasDialog */}
                  {/* {seleccion.partidoId && (
                    <button
                      type="button"
                      onClick={() => setIndiceCuotas(index)}
                      className="text-xs font-medium text-gold hover:underline"
                    >
                      Ver cuotas
                    </button>
                  )} */}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs text-slate mb-1">Apuesta</label>
              <SelectorMercado
                evento={seleccion.evento}
                valor={seleccion.apuesta}
                onCambiar={(texto) => actualizarSeleccion(index, "apuesta", texto)}
              />
            </div>

            <div className="flex gap-2 items-end">
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

      {/* <CuotasDialog
        abierto={indiceCuotas !== null}
        evento={indiceCuotas !== null ? selecciones[indiceCuotas]?.evento : ""}
        partidoId={indiceCuotas !== null ? selecciones[indiceCuotas]?.partidoId : null}
        onCerrar={() => setIndiceCuotas(null)}
      /> */}
    </form>
  );
}
