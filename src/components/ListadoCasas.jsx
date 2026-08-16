import { useEffect, useState } from "react";
import { Landmark, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import FormularioCasa from "./FormularioCasa";
import DetalleCasa from "./DetalleCasa";
import ConfirmDialog from "./ConfirmDialog";
import TarjetaBankroll from "./TarjetaBankroll";
import PanelLateral from "./PanelLateral";
import { calcularBankrollPorCasa } from "../utils/movimientos";
import { calcularDesglosePorCasa } from "../utils/apuestas";

const SIN_MOVIMIENTOS = { ingresos: 0, retiradas: 0, beneficio: 0, bankroll: 0, roiPct: 0 };
// Casas sin ninguna apuesta todavía no aparecen en calcularDesglosePorCasa
// (agrupa solo sobre apuestas existentes) — sin yield que mostrar, y las
// últimas en el orden "Mejor rendimiento" (0 no es ni bueno ni malo, pero
// no hay datos reales detrás).
const SIN_ESTADISTICAS = { numApuestas: 0, yieldPct: 0 };

export default function ListadoCasas({
  casas,
  onAgregarCasa,
  onBorrarCasa,
  movimientos,
  apuestas,
  onAgregarMovimiento,
  onBorrarMovimiento,
  onBorrarTodosMovimientos,
  onAjustarSaldoFreebet,
}) {
  const [casaABorrar, setCasaABorrar] = useState(null);
  const [casaExpandida, setCasaExpandida] = useState(null);
  const [confirmandoBorrarMovimientos, setConfirmandoBorrarMovimientos] = useState(false);
  // "yield" (por defecto) ordena de mejor a peor rendimiento; "alfabetico"
  // vuelve al orden de toda la vida, tal como llegan desde Supabase.
  const [orden, setOrden] = useState("yield");
  // Combinado (como siempre) para el gran total y el orden por rendimiento
  // — y, por bankroll, para que cada casa enseñe cuánto tiene de cada uno
  // por separado (misma casa física, dinero que el usuario lleva aparte).
  const bankrolls = calcularBankrollPorCasa(movimientos, apuestas);
  const bankrollsApuestas = calcularBankrollPorCasa(movimientos, apuestas, "apuestas");
  const bankrollsEntretenimiento = calcularBankrollPorCasa(movimientos, apuestas, "entretenimiento");
  const desglosePorCasa = calcularDesglosePorCasa(apuestas);
  const desglosePorCasaApuestas = calcularDesglosePorCasa(
    apuestas.filter((a) => a.categoria === "apuestas")
  );
  const desglosePorCasaEntretenimiento = calcularDesglosePorCasa(
    apuestas.filter((a) => a.categoria === "entretenimiento")
  );
  const casasOrdenadas = [...casas].sort((a, b) => {
    if (orden === "alfabetico") return a.nombre.localeCompare(b.nombre);
    const yieldA = (desglosePorCasa.find((d) => d.casa === a.nombre) ?? SIN_ESTADISTICAS).yieldPct;
    const yieldB = (desglosePorCasa.find((d) => d.casa === b.nombre) ?? SIN_ESTADISTICAS).yieldPct;
    return yieldB - yieldA;
  });
  // Dinero real que hay ahora mismo entre todas las casas (el mismo cálculo
  // que "Bankroll actual" de cada tarjeta, sumado).
  const bankrollTotal = bankrolls.reduce((suma, b) => suma + b.bankroll, 0);
  // Saldo de freebet de todas las casas (Fase A: ver useCasas.js), sumando
  // los dos bankrolls — "Bankroll total" pasa a ser dinero real + freebets:
  // cuánto tienes en total para jugar ahora mismo, contando también lo
  // prometido.
  const freebetsTotal = casas.reduce(
    (suma, c) => suma + c.freebetSaldoApuestas + c.freebetSaldoEntretenimiento,
    0
  );

  // Reunidos aquí (en vez de calculados solo dentro del .map()) porque hace
  // falta lo mismo dos veces: para la fila de cada casa Y para el panel
  // lateral de escritorio de la casa abierta (que vive fuera del .map()).
  function datosCasa(casa) {
    return {
      bankrollApuestas: bankrollsApuestas.find((b) => b.casa === casa.nombre) ?? SIN_MOVIMIENTOS,
      bankrollEntretenimiento:
        bankrollsEntretenimiento.find((b) => b.casa === casa.nombre) ?? SIN_MOVIMIENTOS,
      desglose: desglosePorCasa.find((d) => d.casa === casa.nombre) ?? SIN_ESTADISTICAS,
      desgloseApuestas: desglosePorCasaApuestas.find((d) => d.casa === casa.nombre) ?? SIN_ESTADISTICAS,
      desgloseEntretenimiento:
        desglosePorCasaEntretenimiento.find((d) => d.casa === casa.nombre) ?? SIN_ESTADISTICAS,
      movimientosCasa: movimientos.filter((m) => m.casa === casa.nombre),
    };
  }

  const casaAbierta = casas.find((c) => c.nombre === casaExpandida) ?? null;

  // Si se borra la casa que está abierta en el panel de escritorio (vive
  // fuera del .map() de filas, así que no desaparece solo como en móvil,
  // donde toda la fila se quita del array), se cierra el panel en vez de
  // dejarlo mostrando una casa que ya no existe.
  useEffect(() => {
    if (casaExpandida && !casaAbierta) setCasaExpandida(null);
  }, [casaExpandida, casaAbierta]);

  function manejarBorrarTodosMovimientos() {
    onBorrarTodosMovimientos();
    setConfirmandoBorrarMovimientos(false);
  }

  return (
    <div className="space-y-4">
      {/* El desglose por bankroll (Apuestas/Entretenimiento) del total ya
          no vive aquí — se movió arriba de cada sección (App.jsx), que es
          donde de verdad importa mientras se está apostando; aquí se
          quedaba redundante. "Bankroll total" (combinado) sí se queda, es
          el único sitio que lo enseña. Lado a lado con "Nueva casa" desde
          "lg:" (rediseño de escritorio ancho): sueltos a todo el ancho,
          el formulario (solo 2 campos) se vería estirado sin sentido y el
          total quedaría descompensado, solo — mismo patrón que Bankroll +
          KPIs en Estadísticas. En móvil, apilados como siempre. */}
      {casas.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <TarjetaBankroll
            etiqueta="Bankroll total"
            dineroReal={bankrollTotal}
            freebets={freebetsTotal}
            grande
          />
          <div className="lg:col-span-2">
            <FormularioCasa onAgregar={onAgregarCasa} />
          </div>
        </div>
      )}

      {casas.length === 0 && <FormularioCasa onAgregar={onAgregarCasa} />}

      {casas.length === 0 ? (
        <p className="text-center text-sm text-slate py-10">
          Todavía no has añadido ninguna casa de apuestas.
        </p>
      ) : (
        <>
          <p className="text-sm text-slate text-center">
            {casas.length}{" "}
            {casas.length === 1 ? "casa registrada" : "casas registradas"}
          </p>

          <div className="flex items-center justify-center gap-2">
            {[
              { valor: "yield", etiqueta: "Mejor rendimiento" },
              { valor: "alfabetico", etiqueta: "Alfabético" },
            ].map(({ valor, etiqueta }) => (
              <button
                key={valor}
                type="button"
                onClick={() => setOrden(valor)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border-2 transition-colors ${
                  orden === valor
                    ? "bg-felt text-paper border-felt"
                    : "border-gold/40 text-ink hover:border-gold"
                }`}
              >
                {etiqueta}
              </button>
            ))}
          </div>

          {/* Cada tarjeta va cerrada por defecto (logo, nombre, yield y
              bankroll, lo único que importa de un vistazo); el resto de
              datos, el historial y el botón de añadir movimiento se ven al
              abrirla. */}
          <div className="space-y-3">
            {casasOrdenadas.map((casa) => {
              const {
                bankrollApuestas,
                bankrollEntretenimiento,
                desglose,
                desgloseApuestas,
                desgloseEntretenimiento,
                movimientosCasa,
              } = datosCasa(casa);
              const expandida = casaExpandida === casa.nombre;

              return (
                <div
                  key={casa.nombre}
                  className="bg-surface border border-line rounded-xl overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setCasaExpandida(expandida ? null : casa.nombre)}
                    className="w-full flex items-center gap-3 p-3 sm:p-4 text-left hover:bg-paperDim transition-colors"
                  >
                    {casa.logo ? (
                      <img
                        src={casa.logo}
                        alt=""
                        className="w-12 h-12 rounded-lg object-contain shrink-0"
                      />
                    ) : (
                      <Landmark size={28} className="text-gold shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-ink truncate">{casa.nombre}</p>
                      {desglose.numApuestas > 0 && (
                        <span
                          className={`inline-block mt-0.5 text-xs font-semibold px-1.5 py-0.5 rounded ${
                            desglose.yieldPct > 0
                              ? "bg-win/10 text-win"
                              : desglose.yieldPct < 0
                              ? "bg-lose/10 text-lose"
                              : "bg-paperDim text-slate"
                          }`}
                        >
                          Yield {desglose.yieldPct > 0 ? "+" : ""}
                          {desglose.yieldPct.toFixed(2)}%
                        </span>
                      )}
                    </div>
                    <div className="shrink-0 grid grid-cols-2 gap-x-2 text-right">
                      <div>
                        <p className="text-[10px] text-slate whitespace-nowrap">Apuestas</p>
                        <p className="font-mono text-sm font-bold text-goldDark">
                          {bankrollApuestas.bankroll.toFixed(2)}€
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate whitespace-nowrap">Entret.</p>
                        <p className="font-mono text-sm font-bold text-goldDark">
                          {bankrollEntretenimiento.bankroll.toFixed(2)}€
                        </p>
                      </div>
                    </div>
                    {expandida ? (
                      <ChevronUp size={18} className="text-slate shrink-0" />
                    ) : (
                      <ChevronDown size={18} className="text-slate shrink-0" />
                    )}
                  </button>

                  {/* Solo móvil (md:hidden): en escritorio el detalle se abre
                      en el panel lateral de más abajo, en vez de empujar el
                      resto de filas hacia abajo. */}
                  {expandida && (
                    <div className="md:hidden">
                      <DetalleCasa
                        casa={casa}
                        bankrollApuestas={bankrollApuestas}
                        bankrollEntretenimiento={bankrollEntretenimiento}
                        desgloseApuestas={desgloseApuestas}
                        desgloseEntretenimiento={desgloseEntretenimiento}
                        movimientosCasa={movimientosCasa}
                        casas={casas}
                        onAgregarMovimiento={onAgregarMovimiento}
                        onAjustarSaldoFreebet={onAjustarSaldoFreebet}
                        onBorrarMovimiento={onBorrarMovimiento}
                        onPedirBorrar={() => setCasaABorrar(casa.nombre)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Panel lateral de escritorio (PanelLateral ya es "hidden md:flex" de
          fábrica, así que en móvil no aparece nada aquí): mismo DetalleCasa
          que el bloque inline de arriba, recalculado para la casa abierta
          con el mismo datosCasa() que usa cada fila. */}
      <PanelLateral abierto={!!casaExpandida} onCerrar={() => setCasaExpandida(null)}>
        {casaAbierta && (
          <DetalleCasa
            casa={casaAbierta}
            {...datosCasa(casaAbierta)}
            casas={casas}
            onAgregarMovimiento={onAgregarMovimiento}
            onAjustarSaldoFreebet={onAjustarSaldoFreebet}
            onBorrarMovimiento={onBorrarMovimiento}
            onPedirBorrar={() => setCasaABorrar(casaAbierta.nombre)}
            onCerrar={() => setCasaExpandida(null)}
          />
        )}
      </PanelLateral>

      {movimientos.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setConfirmandoBorrarMovimientos(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-lose hover:underline"
          >
            <Trash2 size={14} />
            Borrar todos los movimientos
          </button>
        </div>
      )}

      <ConfirmDialog
        abierto={casaABorrar !== null}
        titulo="Borrar casa"
        mensaje={`Vas a borrar "${casaABorrar}" del registro de casas. Las apuestas que ya tengas con esta casa no se ven afectadas, pero si quieres volver a añadirla (por ejemplo, para ponerle un logo) tendrás que escribir el nombre de nuevo.`}
        onConfirmar={() => {
          onBorrarCasa(casaABorrar);
          setCasaABorrar(null);
        }}
        onCancelar={() => setCasaABorrar(null)}
      />

      <ConfirmDialog
        abierto={confirmandoBorrarMovimientos}
        titulo="Borrar todos los movimientos"
        mensaje={`Vas a borrar los ${movimientos.length} movimientos registrados. Esta acción no se puede deshacer.`}
        onConfirmar={manejarBorrarTodosMovimientos}
        onCancelar={() => setConfirmandoBorrarMovimientos(false)}
      />
    </div>
  );
}
