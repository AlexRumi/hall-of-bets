import { useState } from "react";
import { Landmark, Trash2 } from "lucide-react";
import FormularioCasa from "./FormularioCasa";
import ConfirmDialog from "./ConfirmDialog";

export default function ListadoCasas({ casas, onAgregarCasa, onBorrarCasa }) {
  const [casaABorrar, setCasaABorrar] = useState(null);

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

          <div className="space-y-2">
            {casas.map((casa) => (
              <div
                key={casa.nombre}
                className="flex items-center gap-3 bg-surface border border-line rounded-xl p-3 sm:p-4"
              >
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
            ))}
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
