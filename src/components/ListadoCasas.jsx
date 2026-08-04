import { useState } from "react";
import { Landmark, Trash2 } from "lucide-react";
import FormularioCasa from "./FormularioCasa";
import ConfirmDialog from "./ConfirmDialog";
import { calcularBankrollPorCasa } from "../utils/movimientos";

const SIN_MOVIMIENTOS = { ingresos: 0, retiradas: 0, beneficio: 0, bankroll: 0, roiPct: 0 };

export default function ListadoCasas({
  casas,
  onAgregarCasa,
  onBorrarCasa,
  movimientos,
  apuestas,
}) {
  const [casaABorrar, setCasaABorrar] = useState(null);
  const bankrolls = calcularBankrollPorCasa(movimientos, apuestas);

  return (
    <div className="space-y-4">
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

          <div className="space-y-3">
            {casas.map((casa) => {
              const bankroll =
                bankrolls.find((b) => b.casa === casa.nombre) ?? SIN_MOVIMIENTOS;

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
                </div>
              );
            })}
          </div>
        </>
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
    </div>
  );
}
