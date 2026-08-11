import { useState } from "react";
import { PlusCircle, Save, X, AlertTriangle, Globe, Pencil } from "lucide-react";
import { agruparSeleccionesPorPartido } from "../utils/apuestas";
import { calcularBankrollPorCasa } from "../utils/movimientos";
import { equiposDesdeEvento, esFormatoEquipos, etiquetaCategoriaDeTexto } from "../utils/mercados";
import CampoCasa from "./CampoCasa";
import ConstructorPartido from "./ConstructorPartido";
import SelectorMercado from "./SelectorMercado";
// "Ver cuotas" (CuotasDialog) se queda comentado, no borrado: al registrar
// una apuesta la casa ya está decidida (la apuesta ya está hecha), así que
// comparar cuotas de otras casas aquí tiene poco sentido ahora mismo. Podría
// tener más sentido en un futuro "modo planificación" antes de apostar.
// import CuotasDialog from "./CuotasDialog";

const hoy = () => new Date().toISOString().slice(0, 10);
const DEPORTES = ["Fútbol", "Baloncesto", "Tenis", "eSports", "Otro"];

function fechaCorta(fechaIso) {
  const [anio, mes, dia] = fechaIso.split("-");
  return `${dia}/${mes}/${anio}`;
}

// Reconstruye los "bloques" (un partido, con uno o varios mercados y una
// única cuota) a partir de las selecciones ya guardadas de una apuesta, para
// poder editarla con ConstructorPartido.jsx — sobre el agrupado que ya hace
// agruparSeleccionesPorPartido (utils/apuestas.js), compartido con el
// detalle de ApuestaItem.jsx para no repetir la misma lógica dos veces.
function bloquesDesdeApuesta(apuestaInicial) {
  if (!apuestaInicial) return [];
  return agruparSeleccionesPorPartido(apuestaInicial.selecciones).map((grupo) => ({
    evento: grupo.evento,
    // Las apuestas de antes de conectar el buscador de partidos no tienen
    // país/competición/id de partido guardados.
    pais: grupo.pais ?? "",
    competicion: grupo.competicion ?? "",
    partidoId: grupo.partidoId ?? null,
    equipoLocalId: grupo.equipoLocalId ?? null,
    equipoVisitanteId: grupo.equipoVisitanteId ?? null,
    hora: grupo.hora ?? null,
    fecha: grupo.fecha ?? null,
    cuota: grupo.cuota,
    mercados: grupo.selecciones.map((s) => s.apuesta),
  }));
}

// Mismo formulario para crear una apuesta nueva y para editar una ya
// existente: si se recibe apuestaInicial, se precargan sus datos y el envío
// llama a onGuardar en vez de resetear el formulario.
export default function FormularioApuesta({
  casas,
  movimientos = [],
  apuestas = [],
  apuestaInicial = null,
  categoria = null,
  onGuardar,
  onCancelar,
}) {
  const esEdicion = apuestaInicial !== null;
  // Al editar, el bankroll a comprobar es el de la apuesta ya guardada
  // (nunca cambia de bankroll desde aquí); al crear, el de la sección
  // donde se está (prop "categoria", ver App.jsx).
  const categoriaEfectiva = apuestaInicial?.categoria ?? categoria;
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
  // Importe real que paga la casa por toda la combinada (opcional): se
  // guarda como cuota (importe / stake) en cuotaTotalManual — ver
  // calcularCuotaTotal en utils/apuestas.js. Al editar, se reconstruye el
  // importe a partir de esa cuota guardada y el stake de la apuesta.
  const [importeManual, setImporteManual] = useState(
    apuestaInicial?.cuotaTotalManual
      ? String((apuestaInicial.cuotaTotalManual * apuestaInicial.stake).toFixed(2))
      : ""
  );
  // const [indiceCuotas, setIndiceCuotas] = useState(null); // "Ver cuotas", ver import de arriba

  const stakeNumero = Number(cantidadApostada) || 0;

  // Bloque superior (Fecha...Aumento de cuota) colapsable tras confirmarlo
  // (ver collapse-summary-demo.html, referencia aportada por el usuario):
  // evita el scroll de un formulario largo mientras se añaden varios
  // partidos a una combinada. "confirmado" desbloquea la sección de
  // Selecciones (antes de confirmar, un aviso en su lugar) y NO vuelve a
  // false al reabrir el bloque con "✎ Editar" — así las selecciones ya
  // añadidas no desaparecen mientras se corrige un dato de arriba.
  // "bloqueSuperiorAbierto" es el que decide si se ve el formulario
  // completo o la tira resumen. Al editar una apuesta ya existente, los
  // datos de arriba ya están completos, así que arranca confirmado y
  // colapsado.
  const [confirmado, setConfirmado] = useState(esEdicion);
  const [bloqueSuperiorAbierto, setBloqueSuperiorAbierto] = useState(!esEdicion);
  const puedeConfirmar = casa.trim() !== "" && stakeNumero > 0;

  function confirmarBloqueSuperior() {
    if (!puedeConfirmar) return;
    setConfirmado(true);
    setBloqueSuperiorAbierto(false);
  }

  // Bankroll actual de la casa elegida, del bankroll que corresponda
  // (Apuestas/Entretenimiento — mismo cálculo que en Casas de apuestas:
  // ingresos - retiradas + beneficio de apuestas ya resueltas, filtrado por
  // categoría). Ojo: no descuenta el stake de apuestas todavía pendientes
  // en esa casa, igual que el resto de la app.
  const bankrollCasa = casa
    ? calcularBankrollPorCasa(movimientos, apuestas, categoriaEfectiva).find(
        (b) => b.casa === casa
      )?.bankroll ?? 0
    : null;
  const sinBankroll = bankrollCasa !== null && bankrollCasa <= 0;
  const superaBankroll =
    !sinBankroll && bankrollCasa !== null && stakeNumero > bankrollCasa;

  // Saldo de freebet de esa casa Y de ese bankroll (Fase A: se ajusta solo,
  // ver App.jsx — sube con bonos de depósito/seguro, baja al crear una
  // apuesta Freebet; separado por bankroll igual que el dinero real, para
  // que un freebet de Entretenimiento no se pueda gastar sin querer en
  // Apuestas). No es dinero del bankroll de dinero real, así que se avisa
  // aparte, no como "bankroll".
  const campoFreebet =
    categoriaEfectiva === "entretenimiento" ? "freebetSaldoEntretenimiento" : "freebetSaldoApuestas";
  const freebetsCasa = casa ? casas.find((c) => c.nombre === casa)?.[campoFreebet] ?? 0 : 0;
  const sinFreebets = freebetsCasa <= 0;
  const superaFreebets = !sinFreebets && stakeNumero > freebetsCasa;

  const cuotaTotalBloques = bloques.reduce((total, b) => total * b.cuota, 1);

  // Edición de un bloque ya guardado: cambiar la cuota y, si es un pick
  // simple (1 mercado), corregir el mercado elegido sin tener que quitar
  // el partido entero y rehacer país/competición/partido/mercado/cuota
  // desde cero — solo hacía falta buscar el partido otra vez, no todo el
  // resto. En un "multi" de varios mercados, en vez de un desplegable se
  // listan uno por uno con su propia ✕ (quitarMercadoDeBloque), porque no
  // tendría sentido "elegir un mercado" para sustituir a varios a la vez.
  // "cuotaEditando"/"mercadoEditando" son texto libre mientras se edita
  // (no el valor ya guardado del bloque) para no interferir con la
  // coma/punto decimal, ni perder lo escrito, mientras se edita.
  const [bloqueEditando, setBloqueEditando] = useState(null);
  const [cuotaEditando, setCuotaEditando] = useState("");
  const [mercadoEditando, setMercadoEditando] = useState("");

  function quitarBloque(index) {
    setBloques((actuales) => actuales.filter((_, i) => i !== index));
    if (bloqueEditando === index) {
      setBloqueEditando(null);
      setCuotaEditando("");
      setMercadoEditando("");
    }
  }

  function alternarEdicion(index) {
    if (bloqueEditando === index) {
      const cuotaNueva = Number(cuotaEditando);
      setBloques((actuales) =>
        actuales.map((b, i) => {
          if (i !== index) return b;
          const mercados =
            b.mercados.length === 1 && mercadoEditando.trim()
              ? [mercadoEditando.trim()]
              : b.mercados;
          return { ...b, cuota: cuotaNueva > 0 ? cuotaNueva : b.cuota, mercados };
        })
      );
      setBloqueEditando(null);
      setCuotaEditando("");
      setMercadoEditando("");
    } else {
      setBloqueEditando(index);
      setCuotaEditando(String(bloques[index].cuota));
      setMercadoEditando(
        bloques[index].mercados.length === 1 ? bloques[index].mercados[0] : ""
      );
    }
  }

  function quitarMercadoDeBloque(bloqueIndex, mercadoIndex) {
    const quedanMercados = bloques[bloqueIndex].mercados.length - 1;
    setBloques((actuales) => {
      const mercados = actuales[bloqueIndex].mercados.filter((_, mi) => mi !== mercadoIndex);
      if (mercados.length === 0) return actuales.filter((_, i) => i !== bloqueIndex);
      return actuales.map((b, i) => (i === bloqueIndex ? { ...b, mercados } : b));
    });
    if (quedanMercados === 0) {
      setBloqueEditando(null);
      setCuotaEditando("");
    }
  }

  function manejarEnvio(e) {
    e.preventDefault();

    const casaFinal = casa.trim();
    if (!casaFinal || !cantidadApostada || bloques.length === 0) return;

    // Cada bloque se aplana a una selección por mercado: la primera lleva
    // la cuota real del bloque (la que da la casa por el conjunto si tiene
    // varios mercados), el resto cuenta como 1 en el producto — así el
    // cálculo de cuota total de la apuesta (utils/apuestas.js) no cambia.
    // El resultado ya marcado de cada pick (Ganada/Perdida/Nula, ver
    // ApuestaItem.jsx) se recupera por evento+texto: si no se hace, editar
    // la apuesta por aquí borraría el resultado de todos sus picks, y como
    // ahora ese resultado deriva el de la apuesta entera (beneficio,
    // freebet, racha), sería un fallo real, no solo cosmético.
    const resultadosPrevios = new Map(
      (apuestaInicial?.selecciones ?? []).map((s) => [`${s.evento}|${s.apuesta}`, s.resultado])
    );
    const selecciones = bloques.flatMap((bloque) =>
      bloque.mercados.map((mercado, i) => ({
        evento: bloque.evento,
        apuesta: mercado,
        cuota: i === 0 ? bloque.cuota : 1,
        pais: bloque.pais || null,
        competicion: bloque.competicion || null,
        partidoId: bloque.partidoId || null,
        equipoLocalId: bloque.equipoLocalId || null,
        equipoVisitanteId: bloque.equipoVisitanteId || null,
        hora: bloque.hora || null,
        fecha: bloque.fecha || null,
        resultado: resultadosPrevios.get(`${bloque.evento}|${mercado}`),
      }))
    );

    const cuotaTotalManual =
      bloques.length > 1 && importeManual && stakeNumero > 0
        ? Number(importeManual) / stakeNumero
        : null;

    onGuardar({
      fecha,
      casa: casaFinal,
      stake: cantidadApostada,
      tipoFondos,
      deporte,
      seguroFreebetImporte: asegurada ? Number(seguroImporte) : null,
      aumentoPct: conAumento ? Number(aumentoPct) : null,
      cuotaTotalManual,
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
    setImporteManual("");
  }

  return (
    <form
      onSubmit={manejarEnvio}
      className="bg-surface border border-line rounded-xl p-5 sm:p-6 space-y-4"
    >
      <h2 className="font-display text-lg font-semibold text-ink">
        {esEdicion ? "Editar apuesta" : "Nueva apuesta"}
      </h2>

      {!bloqueSuperiorAbierto && (
        <button
          type="button"
          onClick={() => setBloqueSuperiorAbierto(true)}
          className="w-full flex items-center justify-between gap-2 bg-paperDim border border-line rounded-lg px-4 py-3 text-left hover:border-gold/40 transition-colors"
        >
          <span className="text-sm text-ink truncate">
            {fechaCorta(fecha)} · {casa} · {stakeNumero.toFixed(2)}€ ·{" "}
            {tipoFondos === "real" ? "Real" : "Freebet"} · {deporte}
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold text-gold shrink-0">
            <Pencil size={12} />
            Editar
          </span>
        </button>
      )}

      {bloqueSuperiorAbierto && (
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
      )}

      {bloqueSuperiorAbierto && (
        <button
          type="button"
          onClick={confirmarBloqueSuperior}
          disabled={!puedeConfirmar}
          className="w-full sm:w-auto bg-gold text-feltDark px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-goldDark transition-colors disabled:opacity-50"
        >
          Confirmar →
        </button>
      )}

      {confirmado ? (
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
                {bloques.map((bloque, index) => {
                  const editando = bloqueEditando === index;
                  const esMulti = bloque.mercados.length > 1;
                  const equiposBloque = equiposDesdeEvento(bloque.evento);
                  return (
                    <div key={index} className="bg-surface border border-line rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        {/* Equipos apilados, uno encima del otro (petición
                            directa, a partir de una captura de referencia de
                            un ticket real) — mismo criterio que
                            esFormatoEquipos ya usa en ApuestaItem.jsx: solo
                            si "evento" sigue el formato "Local - Visitante",
                            si no se enseña tal cual. La cuota se queda junto
                            al título, arriba del todo. */}
                        {esFormatoEquipos(bloque.evento) ? (
                          <div className="min-w-0 flex-1 space-y-0.5">
                            {(() => {
                              const { local, visitante } = equiposDesdeEvento(bloque.evento);
                              return (
                                <>
                                  <p className="text-sm font-semibold text-ink truncate">{local}</p>
                                  <p className="text-sm font-semibold text-ink truncate">{visitante}</p>
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <span className="flex items-center gap-1.5 text-sm font-semibold text-ink min-w-0">
                            <Globe size={14} className="text-gold shrink-0" />
                            <span className="truncate">{bloque.evento}</span>
                          </span>
                        )}
                        {editando ? (
                          <input
                            type="number"
                            step="0.01"
                            min="1.01"
                            value={cuotaEditando}
                            onChange={(e) => setCuotaEditando(e.target.value)}
                            className="w-20 shrink-0 border border-line rounded px-2 py-0.5 text-sm font-mono font-bold text-gold text-right"
                          />
                        ) : (
                          <span className="font-mono text-sm font-bold text-gold shrink-0">
                            {bloque.cuota.toFixed(2)}
                          </span>
                        )}
                      </div>
                      {editando && !esMulti ? (
                        <div className="mt-1.5">
                          <SelectorMercado
                            evento={bloque.evento}
                            valor={mercadoEditando}
                            onCambiar={setMercadoEditando}
                            equipoLocalId={bloque.equipoLocalId}
                            equipoVisitanteId={bloque.equipoVisitanteId}
                          />
                        </div>
                      ) : (
                        <ul className="mt-2 pt-2 border-t border-line/60 space-y-1.5">
                          {bloque.mercados.map((mercado, i) => {
                            // Mismo patrón mercado en negrita + categoría en
                            // gris debajo que ya usa ApuestaItem.jsx (petición
                            // directa) — null si no coincide con nada del
                            // catálogo (escrito a mano en "Otro mercado"), sin
                            // pintar ningún subtítulo en ese caso.
                            const categoria = etiquetaCategoriaDeTexto(mercado, equiposBloque);
                            return (
                              <li key={i} className="flex items-start justify-between gap-2">
                                <span className="min-w-0">
                                  <span className="block text-xs font-semibold text-ink break-words">
                                    {mercado}
                                  </span>
                                  {categoria && (
                                    <span className="block text-[11px] text-slate">{categoria}</span>
                                  )}
                                </span>
                                {editando && (
                                  <button
                                    type="button"
                                    onClick={() => quitarMercadoDeBloque(index, i)}
                                    aria-label="Quitar mercado"
                                    className="text-slate hover:text-lose transition-colors shrink-0"
                                  >
                                    <X size={12} />
                                  </button>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => quitarBloque(index)}
                          className="text-xs font-semibold text-lose border border-lose/40 rounded-full px-2.5 py-1 hover:bg-lose/10 transition-colors"
                        >
                          Quitar partido
                        </button>
                        <button
                          type="button"
                          onClick={() => alternarEdicion(index)}
                          className="text-xs font-semibold text-gold border border-gold/40 rounded-full px-2.5 py-1 hover:bg-gold/10 transition-colors"
                        >
                          {editando ? "Listo" : "Editar apuesta"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs font-mono text-slate">
                Cuota total combinada: {cuotaTotalBloques.toFixed(2)} · {bloques.length}{" "}
                {bloques.length === 1 ? "partido" : "partidos"}
              </p>

              {bloques.length > 1 && (
                <div className="pt-2 border-t border-line">
                  <label className="block text-xs text-slate mb-1">
                    Importe que paga la casa si aciertas todo (opcional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={importeManual}
                    onChange={(e) => setImporteManual(e.target.value)}
                    placeholder={`Ej. ${(cuotaTotalBloques * stakeNumero).toFixed(2)}`}
                    className="w-full sm:max-w-xs border border-line rounded-lg px-3 py-2 text-sm font-mono bg-surface"
                  />
                  <p className="text-xs text-slate mt-1">
                    {importeManual && stakeNumero > 0
                      ? `Cuota total ajustada: ${(Number(importeManual) / stakeNumero).toFixed(
                          2
                        )} (en vez de ${cuotaTotalBloques.toFixed(2)}).`
                      : "Multiplicar las cuotas de arriba (redondeadas a 2 decimales) puede quedar unos céntimos por debajo de lo que calcula la casa. Si pones aquí el importe real, la app ajusta la cuota total sola."}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      ) : (
        <div className="pt-4 border-t border-line">
          <label className="block text-xs text-slate mb-2">Selecciones</label>
          <div className="border border-dashed border-line rounded-lg p-5 text-center text-sm text-slate">
            Confirma los datos de arriba para empezar a añadir partidos
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={bloques.length === 0}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gold text-feltDark px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-goldDark transition-colors disabled:opacity-50"
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
