import CopiaSeguridad from "./CopiaSeguridad";
import ArchivarDatos from "./ArchivarDatos";

// Sitio para ajustes generales de la app. Por ahora tiene la copia de
// seguridad y el archivado por rango de fechas; futuras fases pueden añadir
// más aquí sin reestructurar de nuevo.
export default function Ajustes({
  userId,
  fechaAltaCuenta,
  apuestas,
  movimientos,
  onArchivarApuestas,
  onArchivarMovimientos,
  ultimaCopia,
  onCopiaRealizada,
  onVerPreviewNuevaApuesta,
  onEditarPreviewNuevaApuesta,
}) {
  // Apuestas pendientes ya en orden "más reciente primero" (useApuestas.js
  // pide a Supabase "order by creado_en desc"), así que basta con tomar
  // las 5 primeras — sin volver a ordenar nada aquí.
  const pendientesRecientes = apuestas.filter((a) => a.resultado === "pendiente").slice(0, 5);

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-semibold text-ink">Ajustes</h2>
      {/* TEMPORAL: rediseño de "Nueva apuesta" v3, construido por fases —
          la Fase 7 ya guarda apuestas de verdad en Supabase desde aquí, y
          la fase de "editar apuesta" (este bloque) permite corregir una ya
          guardada dentro del mismo asistente. Sigue siendo solo una vista
          previa: no sustituye todavía a FormularioApuesta.jsx en el resto
          de la app (Apuestas/Entretenimiento/Historial siguen creando y
          editando apuestas con el formulario de siempre). Este bloque se
          quita cuando se decida hacer ese cambio de verdad, con
          confirmación aparte. */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={onVerPreviewNuevaApuesta}
          className="text-xs font-semibold text-gold hover:underline"
        >
          🧪 Vista previa: Nueva apuesta v3 (crear)
        </button>
        {pendientesRecientes.length > 0 && (
          <div className="border border-line rounded-lg p-3 max-w-md">
            <p className="text-xs text-slate mb-2">
              🧪 Vista previa: editar una apuesta pendiente reciente (v3)
            </p>
            <ul className="space-y-1.5">
              {pendientesRecientes.map((apuesta) => (
                <li key={apuesta.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate text-ink">
                    {apuesta.casa} · {apuesta.fecha.split("-").reverse().join("/")}
                  </span>
                  <button
                    type="button"
                    onClick={() => onEditarPreviewNuevaApuesta(apuesta)}
                    className="shrink-0 text-xs font-semibold text-gold hover:underline"
                  >
                    Editar
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {/* Lado a lado desde "lg:" (rediseño de escritorio ancho): son dos
          tarjetas independientes con párrafos de texto — apiladas a todo
          el ancho de la página, esos párrafos se habrían leído en líneas
          larguísimas (mismo motivo que Informe/Estadísticas). En móvil,
          apiladas como siempre. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CopiaSeguridad
          userId={userId}
          fechaAltaCuenta={fechaAltaCuenta}
          ultimaCopia={ultimaCopia}
          onCopiaRealizada={onCopiaRealizada}
        />
        <ArchivarDatos
          apuestas={apuestas}
          movimientos={movimientos}
          onArchivarApuestas={onArchivarApuestas}
          onArchivarMovimientos={onArchivarMovimientos}
          onCopiaRealizada={onCopiaRealizada}
        />
      </div>
    </div>
  );
}
