import { useState } from "react";
import { Landmark } from "lucide-react";
import { calcularDesglosePorCasa } from "../utils/apuestas";

const BANKROLLS = [
  { id: "apuestas", etiqueta: "Apuestas" },
  { id: "entretenimiento", etiqueta: "Entretenimiento" },
];

export default function DesgloseCasas({ apuestas, casas }) {
  const [bankroll, setBankroll] = useState("apuestas");
  const desglose = calcularDesglosePorCasa(
    apuestas.filter((a) => a.categoria === bankroll)
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-2">
        {BANKROLLS.map(({ id, etiqueta }) => (
          <button
            key={id}
            type="button"
            onClick={() => setBankroll(id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              bankroll === id
                ? "bg-felt text-paper border-felt"
                : "border-line text-slate hover:text-ink"
            }`}
          >
            {etiqueta}
          </button>
        ))}
      </div>

      {desglose.length === 0 ? (
        <p className="text-center text-sm text-slate py-10">
          Todavía no hay apuestas registradas en{" "}
          {bankroll === "apuestas" ? "Apuestas" : "Entretenimiento"}.
        </p>
      ) : (
        <div className="space-y-3">
          {desglose.map((fila) => {
            const logo = casas.find((c) => c.nombre === fila.casa)?.logo;

            return (
              <div
                key={fila.casa}
                className="bg-surface border border-line rounded-xl p-4 sm:p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  {logo ? (
                    <img
                      src={logo}
                      alt=""
                      className="w-8 h-8 rounded object-contain shrink-0"
                    />
                  ) : (
                    <Landmark size={20} className="text-gold shrink-0" />
                  )}
                  <p className="font-display text-base font-semibold text-ink">
                    {fila.casa}
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <p className="text-xs text-slate">Nº apuestas</p>
                    <p className="font-mono text-sm font-medium text-ink">
                      {fila.numApuestas}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate">Total apostado</p>
                    <p className="font-mono text-sm font-medium text-ink">
                      {fila.stakeTotalReal.toFixed(2)}€
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate">Beneficio</p>
                    <p
                      className={`font-mono text-sm font-bold ${
                        fila.beneficio > 0
                          ? "text-win"
                          : fila.beneficio < 0
                          ? "text-lose"
                          : "text-ink"
                      }`}
                    >
                      {fila.beneficio > 0 ? "+" : ""}
                      {fila.beneficio.toFixed(2)}€
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate">Yield</p>
                    <p
                      className={`font-mono text-sm font-medium ${
                        fila.yieldPct > 0
                          ? "text-win"
                          : fila.yieldPct < 0
                          ? "text-lose"
                          : "text-ink"
                      }`}
                    >
                      {fila.yieldPct > 0 ? "+" : ""}
                      {fila.yieldPct.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate">% Acierto</p>
                    <p className="font-mono text-sm font-medium text-ink">
                      {fila.aciertoPct.toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
