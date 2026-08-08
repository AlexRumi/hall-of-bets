import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { agruparPorMesYDia } from "../utils/agrupado";
import TarjetaApuestaResumen from "./TarjetaApuestaResumen";
import ApuestaItem from "./ApuestaItem";

// agrupada=true (el caso normal en Apuestas/Entretenimiento) agrupa por mes
// (colapsable, con su total) y día (con el suyo). agrupada=false (p.ej.
// "Últimas apuestas" en PantallaInicio.jsx, solo 5 apuestas sueltas) pinta
// las tarjetas en una lista plana, sin cabeceras. Tocar una tarjeta abre el
// detalle completo (ApuestaItem.jsx, con las acciones de marcar
// resultado/editar/borrar) en un modal.
export default function ListaApuestas({
  apuestas,
  casas,
  movimientos,
  todasApuestas,
  bonos,
  onMarcarResultado,
  onBorrar,
  onEditar,
  agrupada = true,
}) {
  const [apuestaAbiertaId, setApuestaAbiertaId] = useState(null);
  // Qué meses ha tocado el usuario explícitamente (abrir/cerrar). El mes
  // que no ha tocado usa su valor por defecto: solo el más reciente
  // (esPrimero) empieza expandido, recalculado en cada render, para que no
  // se quede "pegado" un mes viejo si cambia el filtro/periodo.
  const [overrides, setOverrides] = useState({});

  const apuestaAbierta = apuestas.find((a) => a.id === apuestaAbiertaId) ?? null;

  useEffect(() => {
    if (apuestaAbiertaId && !apuestaAbierta) setApuestaAbiertaId(null);
  }, [apuestaAbiertaId, apuestaAbierta]);

  if (apuestas.length === 0) {
    return (
      <p className="text-center text-sm text-slate py-10">
        Todavía no hay apuestas registradas.
      </p>
    );
  }

  const contenido = agrupada ? (
    agruparPorMesYDia(apuestas).map((mes, i) => {
      const expandido = overrides[mes.clave] ?? i === 0;
      return (
        <div key={mes.clave}>
          <button
            type="button"
            onClick={() =>
              setOverrides((actuales) => ({ ...actuales, [mes.clave]: !expandido }))
            }
            className="w-full flex items-center justify-between gap-2 bg-surface border border-line rounded-lg px-3 py-2.5 hover:border-gold/40 transition-colors"
          >
            <span className="flex items-center gap-1.5 font-display font-semibold text-ink">
              {expandido ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              {mes.etiqueta}
            </span>
            <span
              className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg ${
                mes.beneficio > 0
                  ? "bg-win/10 text-win"
                  : mes.beneficio < 0
                  ? "bg-lose/10 text-lose"
                  : "bg-paperDim text-slate"
              }`}
            >
              {mes.beneficio > 0 ? "+" : ""}
              {mes.beneficio.toFixed(2)}€
            </span>
          </button>

          {expandido && (
            <div className="space-y-3 mt-2">
              {mes.dias.map((dia) => (
                <div key={dia.fecha} className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-sm font-semibold text-ink">{dia.etiqueta}</span>
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded-lg ${
                        dia.beneficio > 0
                          ? "bg-win/10 text-win"
                          : dia.beneficio < 0
                          ? "bg-lose/10 text-lose"
                          : "bg-paperDim text-slate"
                      }`}
                    >
                      {dia.beneficio > 0 ? "+" : ""}
                      {dia.beneficio.toFixed(2)}€
                    </span>
                  </div>
                  {dia.apuestas.map((apuesta) => (
                    <TarjetaApuestaResumen
                      key={apuesta.id}
                      apuesta={apuesta}
                      onAbrir={setApuestaAbiertaId}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    })
  ) : (
    <div className="space-y-2">
      {apuestas.map((apuesta) => (
        <TarjetaApuestaResumen key={apuesta.id} apuesta={apuesta} onAbrir={setApuestaAbiertaId} />
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      {contenido}

      {apuestaAbierta && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setApuestaAbiertaId(null)}
        >
          {/* max-w-3xl: mismo ancho que el contenedor del listado normal
              (ver App.jsx, "max-w-3xl mx-auto"), donde ApuestaItem ya se ve
              bien — con un modal más estrecho, "sm:flex-row" se activaba
              igual (depende del ancho de la ventana, no del contenedor) y
              apretaba el evento a una columna demasiado estrecha. */}
          <div
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <ApuestaItem
              apuesta={apuestaAbierta}
              casas={casas}
              movimientos={movimientos}
              todasApuestas={todasApuestas}
              bonos={bonos}
              onMarcarResultado={onMarcarResultado}
              onBorrar={onBorrar}
              onEditar={onEditar}
              onCerrar={() => setApuestaAbiertaId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
