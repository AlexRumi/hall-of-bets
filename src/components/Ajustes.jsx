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
  );
}
