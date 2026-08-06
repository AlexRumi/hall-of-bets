import CopiaSeguridad from "./CopiaSeguridad";

// Sitio para ajustes generales de la app. Por ahora solo tiene la copia de
// seguridad; futuras fases pueden añadir más aquí sin reestructurar de nuevo.
export default function Ajustes({ userId }) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-semibold text-ink">Ajustes</h2>
      <CopiaSeguridad userId={userId} />
    </div>
  );
}
