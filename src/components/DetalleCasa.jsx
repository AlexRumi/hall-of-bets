import { useState } from "react";
import { Trash2, ChevronDown, ChevronUp, PlusCircle, X, Landmark } from "lucide-react";
import FormularioMovimiento from "./FormularioMovimiento";
import FormularioBono from "./FormularioBono";
import ListaMovimientos from "./ListaMovimientos";

// Ingresos/Retiradas/Beneficio/Yield/ROI/Freebet de un bankroll concreto en
// una casa — se repite una vez por cada bankroll (Apuestas/Entretenimiento)
// en vez de una sola fila combinada, así que se saca a su propio componente
// para no triplicar el mismo bloque de JSX.
function FilaBankroll({ etiqueta, bankroll, desglose, freebet }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gold uppercase tracking-wide mb-1.5">{etiqueta}</p>
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div>
          <p className="text-xs text-slate">Ingresos</p>
          <p className="font-mono text-sm font-medium text-ink">{bankroll.ingresos.toFixed(2)}€</p>
        </div>
        <div>
          <p className="text-xs text-slate">Retiradas</p>
          <p className="font-mono text-sm font-medium text-ink">{bankroll.retiradas.toFixed(2)}€</p>
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
          <p className="text-xs text-slate">Yield</p>
          <p
            className={`font-mono text-sm font-medium ${
              desglose.yieldPct > 0 ? "text-win" : desglose.yieldPct < 0 ? "text-lose" : "text-ink"
            }`}
          >
            {desglose.yieldPct > 0 ? "+" : ""}
            {desglose.yieldPct.toFixed(2)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-slate">ROI</p>
          <p
            className={`font-mono text-sm font-medium ${
              bankroll.roiPct > 0 ? "text-win" : bankroll.roiPct < 0 ? "text-lose" : "text-ink"
            }`}
          >
            {bankroll.roiPct > 0 ? "+" : ""}
            {bankroll.roiPct.toFixed(2)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-slate">Freebet</p>
          <p className="font-mono text-sm font-bold text-gold">{freebet.toFixed(2)}€</p>
        </div>
      </div>
    </div>
  );
}

// Detalle completo de una casa: extraído de ListadoCasas.jsx (donde antes
// vivía inline, empujando el resto del acordeón hacia abajo al expandirse)
// para poder reutilizarlo también dentro de un panel lateral en escritorio
// — mismo criterio que ApuestaItem.jsx, reutilizado tanto en el modal de
// móvil como en el panel de escritorio. "onCerrar" solo llega desde el
// panel de escritorio (ListadoCasas.jsx no lo pasa en el uso inline de
// móvil): con él se pinta una cabecera propia (logo/nombre + X) porque el
// panel tapa la fila que se tocó; sin él (móvil) no hace falta, la fila de
// arriba ya cumple ese papel, así que solo lleva el borde separador de
// siempre.
export default function DetalleCasa({
  casa,
  bankrollApuestas,
  bankrollEntretenimiento,
  desgloseApuestas,
  desgloseEntretenimiento,
  movimientosCasa,
  casas,
  onAgregarMovimiento,
  onAjustarSaldoFreebet,
  onBorrarMovimiento,
  onPedirBorrar,
  onCerrar,
}) {
  const [mostrandoBono, setMostrandoBono] = useState(false);

  return (
    <div>
      {onCerrar && (
        <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-line">
          <div className="flex items-center gap-2.5 min-w-0">
            {casa.logo ? (
              <img src={casa.logo} alt="" className="w-9 h-9 rounded-lg object-contain shrink-0" />
            ) : (
              <Landmark size={22} className="text-gold shrink-0" />
            )}
            <h2 className="font-display text-lg font-semibold text-ink truncate">{casa.nombre}</h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="shrink-0 text-slate hover:text-ink transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className={onCerrar ? "px-4 sm:px-5 pb-5 pt-4 space-y-4" : "px-3 sm:px-4 pb-4 pt-4 space-y-4 border-t border-line"}>
      {/* Ingresos/Retiradas/Beneficio/Yield/ROI/Freebet, una fila por
          bankroll — antes era una sola fila combinada; ahora que
          movimientos y el freebet también tienen categoría, se puede ver
          de verdad cuánto tiene cada bankroll en esta casa, por separado. */}
      <div className="space-y-3">
        <FilaBankroll
          etiqueta="Apuestas"
          bankroll={bankrollApuestas}
          desglose={desgloseApuestas}
          freebet={casa.freebetSaldoApuestas}
        />
        <FilaBankroll
          etiqueta="Entretenimiento"
          bankroll={bankrollEntretenimiento}
          desglose={desgloseEntretenimiento}
          freebet={casa.freebetSaldoEntretenimiento}
        />
      </div>

      <FormularioMovimiento
        onAgregar={onAgregarMovimiento}
        casas={casas}
        casaFija={casa.nombre}
        onAjustarSaldoFreebet={onAjustarSaldoFreebet}
      />

      {/* "Otro bono": suma directo al saldo de freebet de esta casa (mismo
          onAjustarSaldoFreebet que ya usa el campo "Bono recibido con este
          depósito" de arriba) — justo debajo del formulario de movimiento,
          para seguir el orden: primero el caso automático, después el
          residual. */}
      <div>
        <button
          type="button"
          onClick={() => setMostrandoBono((actual) => !actual)}
          className="flex items-center gap-1.5 text-xs font-medium text-gold hover:underline"
        >
          <PlusCircle size={14} />
          Otro bono
          {mostrandoBono ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {mostrandoBono && (
          <div className="mt-2">
            <FormularioBono onAjustarSaldoFreebet={onAjustarSaldoFreebet} casas={casas} casaFija={casa.nombre} />
          </div>
        )}
      </div>

      <div>
        <p className="text-xs font-medium text-slate mb-2">Movimientos ({movimientosCasa.length})</p>
        <ListaMovimientos movimientos={movimientosCasa} casas={casas} onBorrar={onBorrarMovimiento} />
      </div>

      <button
        type="button"
        onClick={onPedirBorrar}
        className="flex items-center gap-1.5 text-xs font-medium text-lose hover:underline"
      >
        <Trash2 size={14} />
        Borrar esta casa
      </button>
      </div>
    </div>
  );
}
