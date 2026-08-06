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
      {casas.length > 0 && (
        <FormularioMovimiento onAgregar={onAgregarMovimiento} casas={casas} />
      )}

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
                  className="bg-surface border border-line rounded-xl p-3 sm:p-4 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    {casa.logo ? (
                      <img
                        src={casa.logo}
                        alt=""
                        className="w-16 h-16 rounded-lg object-contain shrink-0"
                      />
                    ) : (
                      <Landmark size={32} className="text-gold shrink-0" />
                    )}
                    <p className="flex-1 min-w-0 text-base font-bold text-ink">
                      {casa.nombre}
                    </p>
                    <button
                      onClick={() => setCasaABorrar(casa.nombre)}
                      aria-label={`Borrar ${casa.nombre}`}
                      className="text-slate hover:text-lose transition-colors p-1.5 shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-line">
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
                      <p className="text-xs text-slate">Bankroll actual</p>
                      <p className="font-mono text-sm font-bold text-goldDark">
                        {bankroll.bankroll.toFixed(2)}€
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

                  <button
                    type="button"
                    onClick={() => setCasaExpandida(expandida ? null : casa.nombre)}
                    className="flex items-center gap-1 text-xs font-medium text-gold hover:underline"
                  >
                    {expandida ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {expandida
                      ? "Ocultar movimientos"
                      : `Ver movimientos (${movimientosCasa.length})`}
                  </button>

                  {expandida && (
                    <div className="pt-3 border-t border-line">
                      <ListaMovimientos
                        movimientos={movimientosCasa}
                        casas={casas}
                        onBorrar={onBorrarMovimiento}
                      />
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
        mensaje={`Vas a borrar "${casaABorrar}" del registro de casas. Las apuestas y promociones que ya tengas con esta casa no se ven afectadas, pero si quieres volver a añadirla (por ejemplo, para ponerle un logo) tendrás que escribir el nombre de nuevo.`}
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
