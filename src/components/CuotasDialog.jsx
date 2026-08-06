import { X } from "lucide-react";
import { useCuotas } from "../hooks/useCuotas";

// Comparativa de cuotas (Gana local / Empate / Gana visitante) de 5 casas
// para el partido elegido en el buscador. Se pide a api/cuotas.js solo al
// abrir este diálogo, no antes — es una llamada por partido, así que no
// tiene sentido pedirla en automático para cada partido del buscador.
// useCuotas cachea por partido: reabrir el mismo no vuelve a llamar.
export default function CuotasDialog({ abierto, evento, partidoId, onCerrar }) {
  const { cuotas, cargando, error } = useCuotas(partidoId, abierto);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onCerrar}
    >
      <div
        className="bg-surface border border-line rounded-xl p-6 max-w-sm w-full space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-semibold text-ink">Cuotas</h3>
            <p className="text-xs text-slate break-words">{evento}</p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="text-slate hover:text-ink transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {cargando && (
          <p className="text-sm text-slate text-center py-6">Buscando cuotas…</p>
        )}
        {!cargando && error && (
          <p className="text-sm text-lose text-center py-6">
            No se pudieron consultar las cuotas.
          </p>
        )}
        {!cargando && !error && cuotas?.length === 0 && (
          <p className="text-sm text-slate text-center py-6">
            Ninguna de las 5 casas tiene cuotas todavía para este partido.
          </p>
        )}
        {!cargando && !error && cuotas?.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate text-left border-b border-line">
                <th className="py-1.5 font-medium">Casa</th>
                <th className="py-1.5 font-medium text-center">1</th>
                <th className="py-1.5 font-medium text-center">X</th>
                <th className="py-1.5 font-medium text-center">2</th>
              </tr>
            </thead>
            <tbody>
              {cuotas.map((c, i) => (
                <tr
                  key={c.casa}
                  className={`border-b border-line last:border-b-0 ${
                    i % 2 === 0 ? "bg-paperDim" : ""
                  }`}
                >
                  <td className="py-2 px-2 text-ink font-medium">{c.casa}</td>
                  <td className="py-2 px-2 text-center font-mono text-ink">{c.local ?? "—"}</td>
                  <td className="py-2 px-2 text-center font-mono text-ink">{c.empate ?? "—"}</td>
                  <td className="py-2 px-2 text-center font-mono text-ink">
                    {c.visitante ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
