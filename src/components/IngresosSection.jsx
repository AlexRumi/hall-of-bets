import { useState } from "react";
import { Trash2 } from "lucide-react";
import FormularioMovimiento from "./FormularioMovimiento";
import ListaMovimientos from "./ListaMovimientos";
import ConfirmDialog from "./ConfirmDialog";

// El registro de movimientos (ingresos/retiradas) vive aquí; el saldo
// resultante por casa (Bankroll y ROI) se muestra en la pestaña "Casas de
// apuestas", junto a cada casa, en vez de aquí.
export default function IngresosSection({
  casas,
  movimientos,
  agregarMovimiento,
  borrarMovimiento,
  borrarTodosMovimientos,
}) {
  const [confirmandoBorrarTodo, setConfirmandoBorrarTodo] = useState(false);

  function manejarBorrarTodo() {
    borrarTodosMovimientos();
    setConfirmandoBorrarTodo(false);
  }

  return (
    <div className="space-y-6">
      <FormularioMovimiento onAgregar={agregarMovimiento} casas={casas} />

      {movimientos.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setConfirmandoBorrarTodo(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-lose hover:underline"
          >
            <Trash2 size={14} />
            Borrar todos los movimientos
          </button>
        </div>
      )}
      <ListaMovimientos
        movimientos={movimientos}
        casas={casas}
        onBorrar={borrarMovimiento}
      />

      <ConfirmDialog
        abierto={confirmandoBorrarTodo}
        titulo="Borrar todos los movimientos"
        mensaje={`Vas a borrar los ${movimientos.length} movimientos registrados. Esta acción no se puede deshacer.`}
        onConfirmar={manejarBorrarTodo}
        onCancelar={() => setConfirmandoBorrarTodo(false)}
      />
    </div>
  );
}
