import { useState } from "react";
import { Landmark, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import FormularioCasa from "./FormularioCasa";
import FormularioMovimiento from "./FormularioMovimiento";
import ListaMovimientos from "./ListaMovimientos";
import ConfirmDialog from "./ConfirmDialog";
import { calcularBankrollPorCasa } from "../utils/movimientos";

const SIN_MOVIMIENTOS = { ingresos: 0, retiradas: 0, beneficio: 0, bankroll: 0, roiPct: 0 };

export default function ListadoCasas({
  casas,
  onAgregarCasa,
  onBorrarCasa,
  movimientos,
  apuestas,
  onAgregarMovimiento,
  onBorrarMovimiento,
  onBorrarTodosMovimientos,
}) {
  const [casaABorrar, setCasaABorrar] = useState(null);
  const [casaExpandida, setCasaExpandida] = useState(null);
  const [confirmandoBorrarMovimientos, setConfirmandoBorrarMovimientos] = useState(false);
  const bankrolls = calcularBankrollPorCasa(movimientos, apuestas);
  // Dinero real que hay ahora mismo entre todas las casas (el mismo cálculo
  // que "Bankroll actual" de cada tarjeta, sumado).
  const bankrollTotal = bankrolls.reduce((suma, b) => suma + b.bankroll, 0);

  function manejarBorrarTodosMovimientos() {
    onBorrarTodosMovimientos();
    setConfirmandoBorrarMovimientos(false);
  }

  return (
    <div className="space-y-4">
      {bankrolls.length > 0 && (
        <div className="bg-surface border border-line rounded-xl p-5 sm:p-6 text-center">
          <p className="text-xs text-slate">Bankroll total</p>
          <p className="font-mono text-3xl font-bold text-goldDark">
            {bankrollTotal.toFixed(2)}€
          </p>
        </div>
      )}
      <FormularioCasa onAgregar={onAgregarCasa} />

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

          {/* Cada tarjeta va cerrada por defecto (logo, nombre y bankroll,
              lo único que importa de un vistazo); el resto de datos, el
              historial y el botón de añadir movimiento se ven al abrirla. */}
          <div className="space-y-3">
            {casas.map((casa) => {
              const bankroll =
                bankrolls.find((b) => b.casa === casa.nombre) ?? SIN_MOVIMIENTOS;
              const expandida = casaExpandida === casa.nombre;
              const movimientosCasa = movimientos.filter(
                (m) => m.casa === casa.nombre
              );

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
                    <p className="flex-1 min-w-0 text-base font-bold text-ink truncate">
                      {casa.nombre}
                    </p>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-slate">Bankroll</p>
                      <p className="font-mono text-base font-bold text-goldDark">
                        {bankroll.bankroll.toFixed(2)}€
                      </p>
                    </div>
                    {expandida ? (
                      <ChevronUp size={18} className="text-slate shrink-0" />
                    ) : (
                      <ChevronDown size={18} className="text-slate shrink-0" />
                    )}
                  </button>

                  {expandida && (
                    <div className="px-3 sm:px-4 pb-4 space-y-4 border-t border-line pt-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <p className="text-xs text-slate">Ingresos</p>
                          <p className="font-mono text-sm font-medium text-ink">
                            {bankroll.ingresos.toFixed(2)}€
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate">Retiradas</p>
                          <p className="font-mono text-sm font-medium text-ink">
                            {bankroll.retiradas.toFixed(2)}€
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate">Beneficio</p>
                          <p
                            className={`font-mono text-sm font-bold ${
                              bankroll.beneficio > 0
                                ? "text-win"
                                : bankroll.beneficio < 0
                                ? "text-lose"
                                : "text-ink"
                            }`}
                          >
                            {bankroll.beneficio > 0 ? "+" : ""}
                            {bankroll.beneficio.toFixed(2)}€
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate">ROI</p>
                          <p
                            className={`font-mono text-sm font-medium ${
                              bankroll.roiPct > 0
                                ? "text-win"
                                : bankroll.roiPct < 0
                                ? "text-lose"
                                : "text-ink"
                            }`}
                          >
                            {bankroll.roiPct > 0 ? "+" : ""}
                            {bankroll.roiPct.toFixed(2)}%
                          </p>
                        </div>
                      </div>

                      <FormularioMovimiento
                        onAgregar={onAgregarMovimiento}
                        casas={casas}
                        casaFija={casa.nombre}
                      />

                      <div>
                        <p className="text-xs font-medium text-slate mb-2">
                          Movimientos ({movimientosCasa.length})
                        </p>
                        <ListaMovimientos
                          movimientos={movimientosCasa}
                          casas={casas}
                          onBorrar={onBorrarMovimiento}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setCasaABorrar(casa.nombre)}
                        className="flex items-center gap-1.5 text-xs font-medium text-lose hover:underline"
                      >
                        <Trash2 size={14} />
                        Borrar esta casa
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

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
