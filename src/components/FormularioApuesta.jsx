import { useState } from "react";
import { PlusCircle, Save, X, AlertTriangle, Globe } from "lucide-react";
import { calcularBankrollPorCasa } from "../utils/movimientos";
import CampoCasa from "./CampoCasa";
import ConstructorPartido from "./ConstructorPartido";
// "Ver cuotas" (CuotasDialog) se queda comentado, no borrado: al registrar
// una apuesta la casa ya está decidida (la apuesta ya está hecha), así que
// comparar cuotas de otras casas aquí tiene poco sentido ahora mismo. Podría
// tener más sentido en un futuro "modo planificación" antes de apostar.
// import CuotasDialog from "./CuotasDialog";

const hoy = () => new Date().toISOString().slice(0, 10);
const DEPORTES = ["Fútbol", "Baloncesto", "Tenis", "eSports", "Otro"];

// Reconstruye los "bloques" (un partido, con uno o varios mercados y una
// única cuota) a partir de las selecciones ya guardadas de una apuesta, para
// poder editarla con ConstructorPartido.jsx. Selecciones consecutivas del
// mismo partido con cuota exactamente 1 se consideran mercados extra del
// mismo bloque (así se guardan las que vienen de un "multi" — la cuota real
// vive en la primera); el resto son bloques de un único mercado.
function bloquesDesdeApuesta(apuestaInicial) {
  if (!apuestaInicial) return [];
  const bloques = [];
  for (const s of apuestaInicial.selecciones) {
    const anterior = bloques[bloques.length - 1];
    const siguePartido = anterior && s.evento === anterior.evento && Number(s.cuota) === 1;
    if (siguePartido) {
      anterior.mercados.push(s.apuesta);
    } else {
      bloques.push({
        evento: s.evento,
        // Las apuestas de antes de conectar el buscador de partidos no
        // tienen país/competición/id de partido guardados.
        pais: s.pais ?? "",
        competicion: s.competicion ?? "",
        partidoId: s.partidoId ?? null,
        cuota: Number(s.cuota),
        mercados: [s.apuesta],
      });
    }
  }
  return bloques;
}

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
  // Cada bloque = un partido ya guardado, con uno o varios mercados y una
  // única cuota (ver ConstructorPartido.jsx). Al enviar, se aplanan a la
  // lista de "selecciones" que espera onGuardar.
  const [bloques, setBloques] = useState(() => bloquesDesdeApuesta(apuestaInicial));
  const [asegurada, setAsegurada] = useState(!!apuestaInicial?.seguroFreebetImporte);
  const [seguroImporte, setSeguroImporte] = useState(
    apuestaInicial?.seguroFreebetImporte ? String(apuestaInicial.seguroFreebetImporte) : ""
  );
  const [conAumento, setConAumento] = useState(!!apuestaInicial?.aumentoPct);
  const [aumentoPct, setAumentoPct] = useState(
    apuestaInicial?.aumentoPct ? String(apuestaInicial.aumentoPct) : ""
  );
  // const [indiceCuotas, setIndiceCuotas] = useState(null); // "Ver cuotas", ver import de arriba

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

  const cuotaTotalBloques = bloques.reduce((total, b) => total * b.cuota, 1);

  function quitarBloque(index) {
    setBloques((actuales) => actuales.filter((_, i) => i !== index));
  }

  function manejarEnvio(e) {
    e.preventDefault();

    const casaFinal = casa.trim();
    if (!casaFinal || !cantidadApostada || bloques.length === 0) return;

    // Cada bloque se aplana a una selección por mercado: la primera lleva
    // la cuota real del bloque (la que da la casa por el conjunto si tiene
    // varios mercados), el resto cuenta como 1 en el producto — así el
    // cálculo de cuota total de la apuesta (utils/apuestas.js) no cambia.
    const selecciones = bloques.flatMap((bloque) =>
      bloque.mercados.map((mercado, i) => ({
        evento: bloque.evento,
        apuesta: mercado,
        cuota: i === 0 ? bloque.cuota : 1,
        pais: bloque.pais || null,
        competicion: bloque.competicion || null,
        partidoId: bloque.partidoId || null,
      }))
    );

    onGuardar({
      fecha,
      casa: casaFinal,
      stake: cantidadApostada,
      tipoFondos,
      deporte,
      seguroFreebetImporte: asegurada ? Number(seguroImporte) : null,
      aumentoPct: conAumento ? Number(aumentoPct) : null,
      selecciones,
    });

    if (esEdicion) {
      onCancelar();
      return;
    }

    setCasa("");
    setCantidadApostada("");
    setTipoFondos("real");
    setDeporte("Fútbol");
    setBloques([]);
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
        <label className="block text-xs text-slate">Selecciones</label>

        <ConstructorPartido
          fecha={fecha}
          onFechaPartido={setFecha}
          onGuardarBloque={(bloque) => setBloques((actuales) => [...actuales, bloque])}
        />

        <div className="bg-paperDim border border-line rounded-lg p-4 space-y-3">
          <p className="text-sm font-semibold text-ink">Apuesta en construcción</p>

          {bloques.length === 0 ? (
            <p className="text-sm text-slate">Todavía no has añadido ningún partido.</p>
          ) : (
            <>
              <div className="space-y-2">
                {bloques.map((bloque, index) => (
                  <div key={index} className="bg-surface border border-line rounded-lg p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-ink min-w-0">
                        <Globe size={14} className="text-gold shrink-0" />
                        <span className="truncate">{bloque.evento}</span>
                      </span>
                      <span className="font-mono text-sm font-bold text-gold shrink-0">
                        {bloque.cuota.toFixed(2)}
                      </span>
                    </div>
                    <ul className="mt-1.5 space-y-0.5">
                      {bloque.mercados.map((mercado, i) => (
                        <li key={i} className="text-xs text-slate">
                          • {mercado}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => quitarBloque(index)}
                      className="mt-2 text-xs font-medium text-lose hover:underline"
                    >
                      Quitar partido
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs font-mono text-slate">
                Cuota total combinada: {cuotaTotalBloques.toFixed(2)} · {bloques.length}{" "}
                {bloques.length === 1 ? "partido" : "partidos"}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={bloques.length === 0}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-felt text-paper px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-feltDark transition-colors disabled:opacity-50"
        >
          {esEdicion ? <Save size={16} /> : <PlusCircle size={16} />}
          {esEdicion ? "Guardar cambios" : "Crear apuesta"}
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
