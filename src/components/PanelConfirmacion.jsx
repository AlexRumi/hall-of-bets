import { useEffect, useState } from "react";
import { X } from "lucide-react";

// Fase 4 del rediseño v3 de "Nueva apuesta" (ver PROMPT_NUEVA_APUESTA_V3.md):
// "Ventana 3" — muestra SOLO el partido activo, nunca acumula selecciones
// de varios partidos. Aquí se teclea la cuota (nunca antes, en Mercados) y
// se confirma el bloque, que pasa al ticket (Fase 5). Cambiar de partido
// con pendientes sin confirmar las descarta — eso ya lo hace
// NuevaApuestaV3.jsx (vacía "pendientes" en elegirPartido).
export default function PanelConfirmacion({
  matchActivo,
  equipos,
  pendientes,
  onQuitarPendiente,
  onConfirmar,
  totalPartidos = 0,
}) {
  const [cuota, setCuota] = useState("");

  // Al cambiar de partido se descarta la cuota a medio teclear (las
  // pendientes ya se vacían en el padre) — no tiene sentido arrastrarla a
  // otra selección.
  useEffect(() => {
    setCuota("");
  }, [matchActivo?.id]);

  const cuotaNum = Number(cuota.replace(",", "."));
  const puedeConfirmar = cuotaNum > 1;

  function confirmar() {
    if (!puedeConfirmar) return;
    onConfirmar(cuotaNum);
    setCuota("");
  }

  if (pendientes.length === 0) {
    return (
      <div className="bg-surface border border-line rounded-xl p-6 text-center">
        <p className="font-display text-base text-ink mb-1.5">Añade una selección</p>
        <p className="text-sm text-slate">
          Elige un mercado del partido y aquí confirmarás su cuota antes de sumarlo a la apuesta.
        </p>
        {totalPartidos > 0 && (
          <p className="text-sm text-slate mt-3 pt-3 border-t border-line">
            Llevas <span className="text-ink font-medium">{totalPartidos}</span>{" "}
            {totalPartidos === 1 ? "partido" : "partidos"} en el ticket de abajo.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-surface border border-line rounded-xl overflow-hidden flex flex-col">
      {/* En móvil se oculta — misma barra superior compartida que ya
          esconde la cabecera de PanelMercados.jsx (Fase 6). */}
      <div className="hidden lg:block p-3.5 border-b border-line bg-paperDim">
        <p className="text-xs text-slate">
          {matchActivo.pais} · {matchActivo.competicion}
        </p>
        <h3 className="font-display text-base text-ink mt-0.5">
          {equipos.local} – {equipos.visitante}
        </h3>
        <p className="font-mono text-xs text-slate mt-1">Hoy {matchActivo.hora}</p>
      </div>

      <div className="divide-y divide-line">
        {pendientes.map((p) => (
          <div key={p.label} className="flex items-start gap-2 px-3.5 py-2.5">
            <span className="flex-1 min-w-0 text-sm text-ink">
              {p.label}
              <span className="block text-xs text-slate mt-0.5">{p.mercado}</span>
            </span>
            <button
              type="button"
              onClick={() => onQuitarPendiente(p.mercado, p.label)}
              aria-label="Quitar selección"
              className="text-slate hover:text-lose transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="p-3.5 border-t border-line space-y-1.5">
        <label className="block text-xs text-slate">
          Cuota {pendientes.length > 1 ? "de la creación de apuesta" : "de esta selección"}
        </label>
        <div className="flex items-center gap-2 bg-paperDim border-2 border-gold/40 focus-within:border-gold rounded-lg px-3 h-10 w-full sm:w-40 transition-colors">
          <input
            type="text"
            inputMode="decimal"
            value={cuota}
            onChange={(e) => setCuota(e.target.value)}
            placeholder="0.00"
            className="flex-1 min-w-0 bg-transparent outline-none font-mono font-bold text-lg text-gold placeholder:text-slate/60"
          />
          <span className="text-[10px] text-slate shrink-0">×</span>
        </div>
        <p className="text-xs text-slate">
          {pendientes.length > 1
            ? "Al combinar varias selecciones del mismo partido, la casa da una cuota única para la creación de apuesta. Cópiala tal cual."
            : "Cópiala de tu casa de apuestas tal cual aparece en el boleto."}
        </p>
      </div>

      <div className="p-3.5 pt-0">
        <button
          type="button"
          onClick={confirmar}
          disabled={!puedeConfirmar}
          className="w-full bg-gold text-feltDark px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-goldDark transition-colors disabled:opacity-50"
        >
          Añadir a la apuesta
        </button>
      </div>
    </div>
  );
}
