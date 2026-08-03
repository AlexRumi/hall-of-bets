import { useState } from "react";
import { calcularInformeMensual } from "../utils/apuestas";

const BANKROLLS = [
  { id: "apuestas", etiqueta: "Apuestas" },
  { id: "entretenimiento", etiqueta: "Entretenimiento" },
];

function formatearMes(claveMes) {
  const [anio, mes] = claveMes.split("-").map(Number);
  const texto = new Date(anio, mes - 1, 1).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default function InformeMensual({ apuestas }) {
  const [bankroll, setBankroll] = useState("apuestas");
  const meses = calcularInformeMensual(
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

      {meses.length === 0 ? (
        <p className="text-center text-sm text-slate py-10">
          Todavía no hay apuestas registradas en {bankroll === "apuestas" ? "Apuestas" : "Entretenimiento"}.
        </p>
      ) : (
        <div className="space-y-3">
          {meses.map((mes) => (
            <div
              key={mes.mes}
              className="bg-surface border border-line rounded-xl p-4 sm:p-5"
            >
              <p className="font-display text-base font-semibold text-ink mb-3">
                {formatearMes(mes.mes)}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <p className="text-xs text-slate">Nº apuestas</p>
                  <p className="font-mono text-sm font-medium text-ink">
                    {mes.numApuestas}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate">Stake total</p>
                  <p className="font-mono text-sm font-medium text-ink">
                    {mes.stakeTotalReal.toFixed(2)}€
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate">Beneficio</p>
                  <p
                    className={`font-mono text-sm font-bold ${
                      mes.beneficio > 0
                        ? "text-win"
                        : mes.beneficio < 0
                        ? "text-lose"
                        : "text-ink"
                    }`}
                  >
                    {mes.beneficio > 0 ? "+" : ""}
                    {mes.beneficio.toFixed(2)}€
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate">Yield</p>
                  <p
                    className={`font-mono text-sm font-medium ${
                      mes.yieldPct > 0
                        ? "text-win"
                        : mes.yieldPct < 0
                        ? "text-lose"
                        : "text-ink"
                    }`}
                  >
                    {mes.yieldPct > 0 ? "+" : ""}
                    {mes.yieldPct.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate">% Acierto</p>
                  <p className="font-mono text-sm font-medium text-ink">
                    {mes.aciertoPct.toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
