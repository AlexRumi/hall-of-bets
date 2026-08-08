import { useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { calcularBeneficio, calcularCuotaTotal } from "../utils/apuestas";
import { useColorCasa } from "../hooks/useColorCasa";
import ConfirmDialog from "./ConfirmDialog";
import CashOutDialog from "./CashOutDialog";
import FormularioApuesta from "./FormularioApuesta";

const ESTILOS_RESULTADO = {
  pendiente: "bg-pending/10 text-pending",
  ganada: "bg-win/10 text-win",
  perdida: "bg-lose/10 text-lose",
  nula: "bg-void/10 text-void",
  cashout: "bg-cashout/10 text-cashout",
};

const ETIQUETAS_RESULTADO = {
  pendiente: "Pendiente",
  ganada: "Ganada",
  perdida: "Perdida",
  nula: "Nula",
  cashout: "Cash Out",
};

export default function ApuestaItem({
  apuesta,
  casas,
  movimientos,
  todasApuestas,
  onMarcarResultado,
  onBorrar,
  onEditar,
  onCerrar,
}) {
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);
  const [mostrandoCashOut, setMostrandoCashOut] = useState(false);
  const [editando, setEditando] = useState(false);
  const esPendiente = apuesta.resultado === "pendiente";
  const esCombinada = apuesta.selecciones.length > 1;
  const cuotaTotal = calcularCuotaTotal(apuesta.selecciones);
  const beneficio = calcularBeneficio(apuesta);
  const casaObj = casas.find((c) => c.nombre === apuesta.casa);
  const logoCasa = casaObj?.logo;
  const colorCasa = useColorCasa(casaObj ?? { nombre: apuesta.casa, logo: null });

  if (editando) {
    return (
      <FormularioApuesta
        casas={casas}
        movimientos={movimientos}
        apuestas={todasApuestas}
        apuestaInicial={apuesta}
        onGuardar={(datos) => onEditar(apuesta.id, datos)}
        onCancelar={() => setEditando(false)}
      />
    );
  }

  return (
    <div className="relative bg-surface border border-line rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
      {onCerrar && (
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          className="absolute top-3 right-3 text-slate hover:text-ink transition-colors p-1"
        >
          <X size={18} />
        </button>
      )}
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
          <span
            className="text-sm font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${colorCasa}1A`, color: colorCasa }}
          >
            {apuesta.casa}
          </span>
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
          {apuesta.seguroFreebetImporte > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gold/10 text-gold">
              Asegurada
            </span>
          )}
          {apuesta.aumentoPct > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gold/10 text-gold">
              +{apuesta.aumentoPct}% aumento
            </span>
          )}
          {apuesta.archivado && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-void/10 text-void">
              Archivada
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
          <ul className="mt-1.5 space-y-2">
            {apuesta.selecciones.map((seleccion) => (
              <li key={seleccion.id} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-ink break-words">
                    {seleccion.evento}
                  </p>
                  {seleccion.apuesta && (
                    <p
                      className={`inline-block mt-1 px-2 py-0.5 rounded-md text-sm font-bold break-words ${ESTILOS_RESULTADO[apuesta.resultado]}`}
                    >
                      {seleccion.apuesta}
                    </p>
                  )}
                  {seleccion.pais && (
                    <p className="mt-1 text-xs text-slate">
                      {seleccion.competicion} · {seleccion.pais}
                    </p>
                  )}
                </div>
                <span className="font-mono text-xs text-slate shrink-0 pt-0.5">
                  {seleccion.cuota.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-1.5">
            <p className="text-base font-semibold text-ink break-words">
              {apuesta.selecciones[0].evento}
            </p>
            {apuesta.selecciones[0].apuesta && (
              <p
                className={`inline-block mt-1 px-2 py-0.5 rounded-md text-sm font-bold break-words ${ESTILOS_RESULTADO[apuesta.resultado]}`}
              >
                {apuesta.selecciones[0].apuesta}
              </p>
            )}
            {apuesta.selecciones[0].pais && (
              <p className="mt-1 text-xs text-slate">
                {apuesta.selecciones[0].competicion} · {apuesta.selecciones[0].pais}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 font-mono text-[13px] text-slate">
          <span>Apostado: {apuesta.stake.toFixed(2)}€</span>
          <span>Cuota total: {cuotaTotal.toFixed(2)}</span>
          {apuesta.resultado === "cashout" && (
            <span>Cash out: {apuesta.cashoutImporte.toFixed(2)}€</span>
          )}
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
            <button
              onClick={() => setMostrandoCashOut(true)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-cashout text-cashout hover:bg-cashout/10 transition-colors"
            >
              Cash Out
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

      <CashOutDialog
        abierto={mostrandoCashOut}
        onConfirmar={(importe) => {
          onMarcarResultado(apuesta.id, "cashout", importe);
          setMostrandoCashOut(false);
        }}
        onCancelar={() => setMostrandoCashOut(false)}
      />
    </div>
  );
}
