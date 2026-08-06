import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { calcularBeneficio, calcularCuotaTotal } from "../utils/apuestas";
import ConfirmDialog from "./ConfirmDialog";
import FormularioApuesta from "./FormularioApuesta";

const ESTILOS_RESULTADO = {
  pendiente: "bg-pending/10 text-pending",
  ganada: "bg-win/10 text-win",
  perdida: "bg-lose/10 text-lose",
  nula: "bg-void/10 text-void",
};

const ETIQUETAS_RESULTADO = {
  pendiente: "Pendiente",
  ganada: "Ganada",
  perdida: "Perdida",
  nula: "Nula",
};

export default function ApuestaItem({ apuesta, casas, onMarcarResultado, onBorrar, onEditar }) {
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);
  const [editando, setEditando] = useState(false);
  const esPendiente = apuesta.resultado === "pendiente";
  const esCombinada = apuesta.selecciones.length > 1;
  const cuotaTotal = calcularCuotaTotal(apuesta.selecciones);
  const beneficio = calcularBeneficio(apuesta);
  const logoCasa = casas.find((c) => c.nombre === apuesta.casa)?.logo;

  if (editando) {
    return (
      <FormularioApuesta
        casas={casas}
        apuestaInicial={apuesta}
        onGuardar={(datos) => onEditar(apuesta.id, datos)}
        onCancelar={() => setEditando(false)}
      />
    );
  }

  return (
    <div className="bg-surface border border-line rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
      {logoCasa && (
        <img
          src={logoCasa}
          alt=""
          className="w-12 h-12 rounded-lg object-contain shrink-0"
        />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs text-slate">{apuesta.fecha}</span>
          <span className="text-xs text-slate">·</span>
          <span className="text-base font-bold text-ink">{apuesta.casa}</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-paperDim text-slate">
            {apuesta.deporte}
          </span>
          {esCombinada && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gold/10 text-gold">
              Combinada · {apuesta.selecciones.length} selecciones
            </span>
          )}
          {apuesta.tipoFondos === "freebet" && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gold/10 text-gold">
              Freebet
            </span>
          )}
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              ESTILOS_RESULTADO[apuesta.resultado]
            }`}
          >
            {ETIQUETAS_RESULTADO[apuesta.resultado]}
          </span>
        </div>

        {esCombinada ? (
          <ul className="mt-1 space-y-1">
            {apuesta.selecciones.map((seleccion) => (
              <li
                key={seleccion.id}
                className="text-sm text-ink break-words flex gap-2"
              >
                <span className="flex-1 min-w-0">
                  {seleccion.evento}
                  {seleccion.apuesta && (
                    <span className="italic text-slate"> — {seleccion.apuesta}</span>
                  )}
                </span>
                <span className="font-mono text-xs text-slate shrink-0">
                  {seleccion.cuota.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-1">
            <p className="text-sm text-ink break-words">
              {apuesta.selecciones[0].evento}
            </p>
            {apuesta.selecciones[0].apuesta && (
              <p className="text-sm italic text-slate break-words">
                {apuesta.selecciones[0].apuesta}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 font-mono text-xs text-slate">
          <span>Apostado: {apuesta.stake.toFixed(2)}€</span>
          <span>Cuota total: {cuotaTotal.toFixed(2)}</span>
          {!esPendiente && (
            <span className={`font-bold ${beneficio > 0 ? "text-win" : beneficio < 0 ? "text-lose" : "text-void"}`}>
              {beneficio > 0 ? "+" : ""}
              {beneficio.toFixed(2)}€
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        {esPendiente && (
          <>
            <button
              onClick={() => onMarcarResultado(apuesta.id, "ganada")}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-win text-win hover:bg-win/10 transition-colors"
            >
              Ganada
            </button>
            <button
              onClick={() => onMarcarResultado(apuesta.id, "perdida")}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-lose text-lose hover:bg-lose/10 transition-colors"
            >
              Perdida
            </button>
            <button
              onClick={() => onMarcarResultado(apuesta.id, "nula")}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-void text-void hover:bg-void/10 transition-colors"
            >
              Nula
            </button>
          </>
        )}
        <button
          onClick={() => setEditando(true)}
          aria-label="Editar apuesta"
          className="text-slate hover:text-ink transition-colors p-1.5"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={() => setConfirmandoBorrado(true)}
          aria-label="Borrar apuesta"
          className="text-slate hover:text-lose transition-colors p-1.5"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <ConfirmDialog
        abierto={confirmandoBorrado}
        titulo="Borrar apuesta"
        mensaje="Esta acción no se puede deshacer. ¿Seguro que quieres borrar esta apuesta?"
        onConfirmar={() => {
          onBorrar(apuesta.id);
          setConfirmandoBorrado(false);
        }}
        onCancelar={() => setConfirmandoBorrado(false)}
      />
    </div>
  );
}
