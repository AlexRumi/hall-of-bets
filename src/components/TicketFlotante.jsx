import { useState } from "react";
import { ChevronDown, X, AlertTriangle } from "lucide-react";
import { equiposDesdeEvento, escudoUrl } from "../utils/mercados";

// Fase 5 del rediseño v3 de "Nueva apuesta" (ver PROMPT_NUEVA_APUESTA_V3.md):
// ticket flotante (position: fixed, separado del fondo, borde ámbar).
// Solo existe con al menos un bloque confirmado (Fase 4); arranca siempre
// colapsado, nunca se abre solo. Opción B decidida con el usuario: cada
// bloque suelto conserva su propia casilla de cantidad ADEMÁS de la
// combinada — al guardar (Fase 7, NuevaApuestaV3.jsx), eso puede crear
// varias apuestas de una vez de verdad en Supabase, no solo simularlo.
const NOMBRE_COMBINADA = { 2: "Doble", 3: "Triple", 4: "Cuádruple", 5: "Quíntuple", 6: "Séxtuple" };
const ATAJOS_CANTIDAD = [2, 5, 10, 20, 50];

function numero(v) {
  return parseFloat(String(v).replace(",", ".")) || 0;
}
function formatear(n) {
  return n.toFixed(2);
}

// Pareja cuota+cantidad, reutilizada en cada bloque y en la fila
// combinada — con etiqueta pequeña encima de cada campo y la cuota en
// ámbar (mismo lenguaje visual que el resto de la app para las cuotas),
// en vez de dos cajas de texto sueltas sin más. Con "Mixta" gana un
// tercer campo "Freebet" (la etiqueta del segundo pasa de "Cantidad" a
// "Real" para dejar claro qué es cada uno) — igual que ya hace
// FormularioApuesta.jsx para una apuesta mixta.
function CampoCuotaCantidad({ cuota, onCuota, cantidad, onCantidad, cantidadFreebet, onCantidadFreebet, esMixta }) {
  return (
    <div className="flex items-end gap-1.5 shrink-0">
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[9px] font-semibold text-slate uppercase tracking-wide">Cuota</span>
        <input
          type="text"
          inputMode="decimal"
          value={cuota}
          onChange={(e) => onCuota(e.target.value)}
          className="w-14 text-center bg-surface border-2 border-gold/40 focus:border-gold rounded px-1 py-1 font-mono font-bold text-sm text-gold outline-none transition-colors"
        />
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[9px] font-semibold text-slate uppercase tracking-wide">
          {esMixta ? "Real" : "Cantidad"}
        </span>
        <div className="flex items-center bg-surface border border-line focus-within:border-gold/50 rounded px-1.5 py-1 transition-colors">
          <input
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={cantidad}
            onChange={(e) => onCantidad(e.target.value)}
            className="w-14 text-right bg-transparent font-mono text-sm text-ink outline-none placeholder:text-slate/60"
          />
        </div>
      </div>
      {esMixta && (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[9px] font-semibold text-slate uppercase tracking-wide">Freebet</span>
          <div className="flex items-center bg-surface border border-line focus-within:border-gold/50 rounded px-1.5 py-1 transition-colors">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={cantidadFreebet}
              onChange={(e) => onCantidadFreebet(e.target.value)}
              className="w-14 text-right bg-transparent font-mono text-sm text-ink outline-none placeholder:text-slate/60"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Retorno total si gana (lo que se muestra como "Ganancia potencial"):
// el stake real se recupera + beneficio sobre real+freebet juntos — la
// freebet nunca se "recupera" porque nunca fue dinero propio. En "Real"
// (stakeFreebet 0) esto da lo de siempre (stake × cuota); en "Freebet"
// puro, el único campo del ticket ES el importe de freebet (no hay campo
// "Real" en ese modo), así que se pasa como stakeFreebet y el real como 0
// — mismo resultado que antes ((cuota-1) × cantidad). Misma fórmula que
// calcularBeneficio en utils/apuestas.js, adaptada para "cuánto volvería".
function retorno(stakeReal, stakeFreebet, cuota) {
  return (stakeReal + stakeFreebet) * (cuota - 1) + stakeReal;
}

export default function TicketFlotante({
  bloques,
  tipoFondos,
  comboCuota,
  comboStake,
  comboStakeFreebet,
  onQuitarBloque,
  onQuitarItem,
  onCambiarCuotaBloque,
  onCambiarStakeBloque,
  onCambiarStakeFreebetBloque,
  onCambiarComboCuota,
  onCambiarComboStake,
  onCambiarComboStakeFreebet,
  onRellenarCantidad,
  onGuardar,
  avisoBankroll,
  avisoFreebet,
}) {
  const [abierto, setAbierto] = useState(false);

  if (bloques.length === 0) return null;

  const nb = bloques.length;
  const cuotaComboAuto = bloques.reduce((total, b) => total * numero(b.cuota), 1);
  const cuotaComboValor = numero(comboCuota) || cuotaComboAuto;
  const esFreebet = tipoFondos === "freebet";
  const esMixta = tipoFondos === "mixta";

  const stakesTotal =
    bloques.reduce((total, b) => total + numero(b.stake) + (esMixta ? numero(b.stakeFreebet) : 0), 0) +
    (nb > 1 ? numero(comboStake) + (esMixta ? numero(comboStakeFreebet) : 0) : 0);

  const ganancia =
    bloques.reduce((total, b) => {
      const real = esFreebet ? 0 : numero(b.stake);
      const freebetParte = esFreebet ? numero(b.stake) : esMixta ? numero(b.stakeFreebet) : 0;
      if (!real && !freebetParte) return total;
      return total + retorno(real, freebetParte, numero(b.cuota));
    }, 0) +
    (nb > 1 && (numero(comboStake) || (esMixta && numero(comboStakeFreebet)))
      ? retorno(esFreebet ? 0 : numero(comboStake), esFreebet ? numero(comboStake) : esMixta ? numero(comboStakeFreebet) : 0, cuotaComboValor)
      : 0);

  let titulo;
  let resumen;
  let cuotaMostrada;
  if (nb === 1) {
    const b = bloques[0];
    const equipos = equiposDesdeEvento(b.partido.evento);
    const multi = b.items.length > 1;
    titulo = multi ? "Creación de apuesta" : b.items[0].label;
    resumen = multi
      ? `${equipos.local} - ${equipos.visitante} · ${b.items.length} selecciones`
      : `${equipos.local} - ${equipos.visitante}`;
    cuotaMostrada = numero(b.cuota);
  } else {
    titulo = NOMBRE_COMBINADA[nb] || `Combinada de ${nb}`;
    resumen = bloques
      .map((b) => {
        const equipos = equiposDesdeEvento(b.partido.evento);
        return b.items.length > 1 ? `${equipos.local} - ${equipos.visitante}` : b.items[0].label;
      })
      .join(", ");
    cuotaMostrada = cuotaComboValor;
  }

  return (
    <div className="w-full max-w-lg pointer-events-auto bg-surface border-2 border-gold rounded-2xl shadow-2xl overflow-hidden">
      {!abierto ? (
          <>
            <button
              type="button"
              onClick={() => setAbierto(true)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left"
            >
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-ink truncate">{titulo}</span>
                <span className="block text-xs text-slate truncate">{resumen}</span>
              </span>
              <span className="font-mono text-lg text-gold shrink-0">{formatear(cuotaMostrada)}</span>
              <ChevronDown size={16} className="text-slate shrink-0" />
            </button>
            <div className="flex border-t border-line">
              <button
                type="button"
                onClick={() => setAbierto(true)}
                className="flex-1 py-3 text-sm font-semibold text-gold"
              >
                {stakesTotal ? `Cantidad ${formatear(stakesTotal)}€` : "Establecer cantidad"}
              </button>
              <button
                type="button"
                onClick={onGuardar}
                disabled={!stakesTotal}
                className={`px-6 py-3 text-sm font-semibold transition-colors ${
                  stakesTotal ? "bg-gold text-feltDark hover:bg-goldDark" : "bg-paperDim text-slate"
                }`}
              >
                Guardar apuesta
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-line bg-paperDim">
              <span className="font-mono text-xs font-bold text-feltDark bg-gold rounded-full px-2 py-0.5">
                {nb}
              </span>
              <h3 className="text-sm font-semibold text-ink">{nb === 1 ? "Partido" : "Partidos"}</h3>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Colapsar ticket"
                className="ml-auto text-slate hover:text-ink"
              >
                <ChevronDown size={16} className="rotate-180" />
              </button>
            </div>

            {/* Petición directa: solo la lista de partidos hace scroll
                (cuando son muchos) — la fila "Doble"/combinada y el pie
                (atajos de cantidad, ganancia potencial, Guardar apuesta)
                se quedan siempre visibles, sin que haya que desplazarse
                para verlos. Antes la fila de la combinada vivía DENTRO de
                este mismo scroll, como un bloque más, y con 2-3 partidos
                ya podía quedar oculta hasta hacer scroll dentro del ticket. */}
            <div className="max-h-[36vh] overflow-y-auto scrollbar-oculto">
              {bloques.map((b, bi) => {
                const equipos = equiposDesdeEvento(b.partido.evento);
                const multi = b.items.length > 1;
                return (
                  <div key={bi} className="m-3 border border-line rounded-lg overflow-hidden bg-paperDim">
                    {/* Petición directa: escudo + nombre de cada equipo en
                        su propia fila (en vez de "Local - Visitante" en una
                        sola línea, que se cortaba con nombres largos) —
                        Cuota/Cantidad quedan arriba a la derecha, sin
                        competir por sitio con el nombre. Sin la hora
                        (redundante con el escudo/nombre ya identificando
                        el partido). */}
                    <div className="px-3 py-2.5">
                      {multi && (
                        <span className="block text-[11px] font-semibold text-gold mb-1">
                          Creación de apuesta
                        </span>
                      )}
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => onQuitarBloque(bi)}
                          aria-label="Quitar partido"
                          className="text-slate hover:text-lose shrink-0 mt-1"
                        >
                          <X size={14} />
                        </button>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5">
                            {escudoUrl(b.partido.equipoLocalId, b.partido.escudoLocal) && (
                              <img
                                src={escudoUrl(b.partido.equipoLocalId, b.partido.escudoLocal)}
                                alt=""
                                className="w-5 h-5 shrink-0 object-contain"
                              />
                            )}
                            <span className="text-sm text-ink truncate">{equipos.local}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {escudoUrl(b.partido.equipoVisitanteId, b.partido.escudoVisitante) && (
                              <img
                                src={escudoUrl(b.partido.equipoVisitanteId, b.partido.escudoVisitante)}
                                alt=""
                                className="w-5 h-5 shrink-0 object-contain"
                              />
                            )}
                            <span className="text-sm text-ink truncate">{equipos.visitante}</span>
                          </div>
                        </div>
                        <CampoCuotaCantidad
                          cuota={b.cuota}
                          onCuota={(v) => onCambiarCuotaBloque(bi, v)}
                          cantidad={b.stake}
                          onCantidad={(v) => onCambiarStakeBloque(bi, v)}
                          cantidadFreebet={b.stakeFreebet}
                          onCantidadFreebet={(v) => onCambiarStakeFreebetBloque(bi, v)}
                          esMixta={esMixta}
                        />
                      </div>
                    </div>
                    {/* Cada mercado elegido, con el mismo lenguaje visual
                        que al elegirlo en "Mercados"/"Confirmar": puntito,
                        el mercado en sí destacado (text-ink) y el tipo de
                        mercado debajo, más apagado (text-slate). Antes solo
                        se veía así con 2+ mercados del mismo partido; ahora
                        siempre, también con uno solo. */}
                    <div className="px-3 pb-2.5 space-y-2">
                      {b.items.map((it, ii) => (
                        <div key={ii} className="flex items-start gap-2 pl-3 relative">
                          <span className="absolute left-0 top-0 bottom-0 w-px bg-line" />
                          <span className="absolute -left-[3px] top-2 w-1.5 h-1.5 rounded-full bg-gold" />
                          <span className="flex-1 min-w-0 text-xs text-ink">
                            {it.label}
                            {it.mercado && <span className="block text-[11px] text-slate">{it.mercado}</span>}
                          </span>
                          <button
                            type="button"
                            onClick={() => onQuitarItem(bi, ii)}
                            aria-label="Quitar selección"
                            className="text-slate hover:text-lose shrink-0"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {nb > 1 && (
              <div className="mx-3 mt-3 border border-gold bg-gold/10 rounded-lg px-3 py-2.5 flex items-center gap-2 shrink-0">
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-gold">
                    {NOMBRE_COMBINADA[nb] || `Combinada de ${nb}`}
                  </span>
                  <span className="block text-xs text-slate">
                    {nb} partidos · cuota calculada {formatear(cuotaComboAuto)}
                  </span>
                </span>
                <CampoCuotaCantidad
                  cuota={comboCuota || formatear(cuotaComboAuto)}
                  onCuota={onCambiarComboCuota}
                  cantidad={comboStake}
                  onCantidad={onCambiarComboStake}
                  cantidadFreebet={comboStakeFreebet}
                  onCantidadFreebet={onCambiarComboStakeFreebet}
                  esMixta={esMixta}
                />
              </div>
            )}

            <div className="border-t border-line bg-paperDim shrink-0">
              <div className="flex gap-1.5 px-3.5 pt-3">
                {ATAJOS_CANTIDAD.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => onRellenarCantidad(String(q))}
                    className="px-2.5 py-1 rounded-full border border-line text-xs font-mono text-slate hover:border-gold/40 hover:text-gold transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
              <div className="flex justify-between px-4 pt-2.5 text-xs text-slate">
                <span>Ganancia potencial</span>
                <span className="font-mono text-win">{stakesTotal ? `${formatear(ganancia)}€` : "—"}</span>
              </div>
              {/* Petición directa: solo avisa si de verdad te pasas del
                  saldo de la casa (real y/o freebet, según toque) — no una
                  cifra fija de fondo mientras todo cuadra, a diferencia de
                  FormularioApuesta.jsx (ahí el importe ya se teclea en el
                  mismo formulario que la casa; aquí se pone más tarde, en
                  este ticket). */}
              {(avisoBankroll || avisoFreebet) && (
                <div className="px-4 pt-2 space-y-1">
                  {avisoBankroll && (
                    <p className="flex items-center gap-1 text-xs text-lose">
                      <AlertTriangle size={12} className="shrink-0" />
                      {avisoBankroll}
                    </p>
                  )}
                  {avisoFreebet && (
                    <p className="flex items-center gap-1 text-xs text-lose">
                      <AlertTriangle size={12} className="shrink-0" />
                      {avisoFreebet}
                    </p>
                  )}
                </div>
              )}
              {nb > 1 && (
                <p className="px-4 pt-2 text-xs text-slate leading-relaxed">
                  Pon cantidad solo en la combinada para guardar una apuesta, o en los partidos
                  sueltos para guardarlos como sencillas.
                </p>
              )}
              <button
                type="button"
                onClick={onGuardar}
                disabled={!stakesTotal}
                className="mx-3.5 mt-3 mb-3.5 block w-[calc(100%-28px)] bg-gold text-feltDark py-3 rounded-lg text-sm font-semibold hover:bg-goldDark transition-colors disabled:bg-line disabled:text-slate"
              >
                Guardar apuesta {stakesTotal ? `${formatear(stakesTotal)}€` : ""}
              </button>
            </div>
          </>
        )}
    </div>
  );
}
