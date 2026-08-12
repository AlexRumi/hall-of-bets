import { Check, X, Minus } from "lucide-react";
import { agruparSeleccionesPorPartido, calcularCuotaTotal, calcularBeneficio, horaInicioPartido } from "../utils/apuestas";
import { equiposDesdeEvento, esFormatoEquipos } from "../utils/mercados";
import { InfoPartido } from "./ApuestaItem";
import "./TicketApuesta.css";

const ETIQUETAS_ESTADO = {
  pendiente: "Pendiente",
  ganada: "Ganada",
  perdida: "Perdida",
  nula: "Nula",
  cashout: "Cash Out",
};

const ICONOS_PICK = { ganada: Check, perdida: X, nula: Minus };
const COLOR_BOTON = { ganada: "#34c77e", perdida: "#e1685a", nula: "#9c9284" };

// Diseño "ticket" para la Mini App de Telegram (petición directa, con
// betslip-demo.html como referencia visual) — muescas, sello rotado y
// divisor punteado tal cual la maqueta, tipografías cambiadas a
// Fraunces/IBM Plex Mono para que encaje con el resto de Hall of Bets.
// Puramente presentacional: toda la lógica (agrupar picks, cuota, marcador,
// caché de resultado final) viene de las mismas piezas que ya usa
// ApuestaItem.jsx, nada se recalcula aquí de otra forma.
export default function TicketApuesta({
  apuesta,
  soloLectura,
  onMarcarPick,
  cashOutAbierto,
  importeCashOut,
  onCambiarImporteCashOut,
}) {
  const grupos = agruparSeleccionesPorPartido(apuesta.selecciones);
  const cuotaTotal = calcularCuotaTotal(apuesta);
  const esPendiente = apuesta.resultado === "pendiente";
  const beneficio = esPendiente ? apuesta.stake * cuotaTotal : calcularBeneficio(apuesta);

  return (
    <div className="hob-ticket">
      <div
        className={`hob-stamp ${apuesta.resultado}`}
      >
        {ETIQUETAS_ESTADO[apuesta.resultado] ?? apuesta.resultado}
      </div>

      <div className="flex items-center gap-2 text-[11.5px] pr-16" style={{ color: "#8fa99a" }}>
        <span>{apuesta.fecha}</span>
        <span style={{ color: "#24493a" }}>·</span>
        <span>{grupos.length > 1 ? `Combinada · ${grupos.length} partidos` : "Simple"}</span>
        <span
          className="ml-auto text-[10.5px] font-bold px-2 py-0.5 rounded-full"
          style={{
            color: "#e0c464",
            background: "rgba(216,179,120,.12)",
            border: "1px solid rgba(216,179,120,.35)",
          }}
        >
          {apuesta.tipoFondos === "freebet" ? "FREEBET" : "REAL"}
        </span>
      </div>

      {grupos.map((grupo, indiceGrupo) => (
        <div key={grupo.indiceLider}>
          <div className="hob-divider" />
          <InfoPartido
            partidoId={grupo.partidoId}
            horaInicioMs={horaInicioPartido(grupo.fecha ?? apuesta.fecha, grupo.hora)}
          >
            {(info, terminado) => {
              const conEquipos = esFormatoEquipos(grupo.evento);
              const equipos = equiposDesdeEvento(grupo.evento);
              const cabecera = [grupo.competicion, grupo.pais].filter(Boolean).join(" · ");

              return (
                <>
                  {cabecera && (
                    <p className="font-mono text-[11px] font-semibold mb-0.5" style={{ color: "#e0c464" }}>
                      {cabecera}
                    </p>
                  )}
                  <p className="font-display text-[17px] font-bold mb-3 leading-tight" style={{ color: "#f3efe3" }}>
                    {grupo.evento}
                  </p>

                  <div className="flex flex-col gap-2">
                    {grupo.selecciones.map((pick) => {
                      const estadoPick = pick.resultado ?? "pendiente";
                      const puedeCiclar = !soloLectura && estadoPick === "pendiente";
                      return (
                        <div key={pick.indice} className="hob-leg">
                          {["ganada", "perdida", "nula"].map((resultado) => {
                            const Icono = ICONOS_PICK[resultado];
                            const activo = estadoPick === resultado;
                            if (!puedeCiclar && !activo) return null;
                            return (
                              <button
                                key={resultado}
                                type="button"
                                disabled={soloLectura}
                                onClick={() => onMarcarPick(pick.indice, resultado)}
                                className="hob-pick-btn"
                                style={{
                                  background: activo ? COLOR_BOTON[resultado] : "transparent",
                                  border: `1.5px solid ${activo ? COLOR_BOTON[resultado] : "#8fa99a"}`,
                                }}
                                aria-label={ETIQUETAS_ESTADO[resultado]}
                              >
                                <Icono size={11} strokeWidth={3} />
                              </button>
                            );
                          })}
                          <span
                            className="flex-1 text-[13.5px] font-medium"
                            style={{
                              color: "#f3efe3",
                              textDecoration: estadoPick === "perdida" ? "line-through" : "none",
                              opacity: estadoPick === "perdida" || estadoPick === "nula" ? 0.6 : 1,
                            }}
                          >
                            {pick.apuesta}
                          </span>
                          <span
                            className="font-mono text-[13px]"
                            style={{ color: estadoPick === "ganada" ? "#34c77e" : "#8fa99a" }}
                          >
                            {Number(pick.cuota).toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {conEquipos && (
                    (() => {
                      const esManual = !grupo.partidoId;
                      const hayMarcadorManual = grupo.golesLocalManual != null && grupo.golesVisitanteManual != null;
                      const golesLocal = terminado ? info.golesLocal : grupo.golesLocalManual;
                      const golesVisitante = terminado ? info.golesVisitante : grupo.golesVisitanteManual;
                      const hayMarcador = terminado || hayMarcadorManual;
                      if (!hayMarcador) return null;
                      return (
                        <div className="mt-2 pt-2 flex flex-col gap-1" style={{ borderTop: "1px solid rgba(143,169,154,.25)" }}>
                          <div className="flex items-center justify-between text-[13px] font-semibold" style={{ color: "#f3efe3" }}>
                            <span>{equipos.local}</span>
                            <span className="font-mono">{golesLocal}</span>
                          </div>
                          <div className="flex items-center justify-between text-[13px] font-semibold" style={{ color: "#f3efe3" }}>
                            <span>{equipos.visitante}</span>
                            <span className="font-mono">{golesVisitante}</span>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </>
              );
            }}
          </InfoPartido>
        </div>
      ))}

      <div className="hob-footer">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: "#8fa99a" }}>
            {esPendiente ? "Retorno potencial" : "Beneficio"}
          </span>
          <span
            className="font-mono text-[16px] font-bold"
            style={{ color: !esPendiente && beneficio > 0 ? "#34c77e" : !esPendiente && beneficio < 0 ? "#e1685a" : "#e0c464" }}
          >
            {!esPendiente && beneficio > 0 ? "+" : ""}
            {beneficio.toFixed(2)}€
          </span>
        </div>
      </div>

      {esPendiente && !soloLectura && cashOutAbierto && (
        <div className="mt-2.5 flex items-center gap-2">
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="Importe cobrado (€)"
            value={importeCashOut}
            onChange={(e) => onCambiarImporteCashOut(e.target.value)}
            className="flex-1 font-mono text-sm rounded-lg px-3 py-2"
            style={{ background: "rgba(0,0,0,.25)", color: "#f3efe3", border: "1px solid #24493a" }}
          />
        </div>
      )}
    </div>
  );
}
