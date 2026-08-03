import { useState } from "react";
import { Trash2 } from "lucide-react";
import FormularioPromocion from "./FormularioPromocion";
import ListaPromociones from "./ListaPromociones";
import ConfirmDialog from "./ConfirmDialog";

export default function PromocionesSection({
  casas,
  promociones,
  agregarPromocion,
  resolverPromocion,
  borrarPromocion,
  borrarTodasPromociones,
}) {
  const [confirmandoBorrarTodo, setConfirmandoBorrarTodo] = useState(false);

  function manejarBorrarTodo() {
    borrarTodasPromociones();
    setConfirmandoBorrarTodo(false);
  }

  return (
    <>
      <FormularioPromocion onAgregar={agregarPromocion} casas={casas} />

      {promociones.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setConfirmandoBorrarTodo(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-lose hover:underline"
          >
            <Trash2 size={14} />
            Borrar todas las promociones
          </button>
        </div>
      )}
      <ListaPromociones
        promociones={promociones}
        casas={casas}
        onResolver={resolverPromocion}
        onBorrar={borrarPromocion}
      />

      <ConfirmDialog
        abierto={confirmandoBorrarTodo}
        titulo="Borrar todas las promociones"
        mensaje={`Vas a borrar las ${promociones.length} promociones registradas. Esta acción no se puede deshacer.`}
        onConfirmar={manejarBorrarTodo}
        onCancelar={() => setConfirmandoBorrarTodo(false)}
      />
    </>
  );
}
