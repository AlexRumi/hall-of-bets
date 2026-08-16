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
}) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-semibold text-ink">Ajustes</h2>
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
