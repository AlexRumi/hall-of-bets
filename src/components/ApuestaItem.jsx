import { useState } from "react";
import { X, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { calcularBeneficio, calcularCuotaTotal, agruparSeleccionesPorPartido } from "../utils/apuestas";
import { useColorCasa } from "../hooks/useColorCasa";
import ConfirmDialog from "./ConfirmDialog";
import FormularioApuesta from "./FormularioApuesta";

const ETIQUETAS_RESULTADO = {
  pendiente: "Pendiente",
  ganada: "Ganada",
  perdida: "Perdida",
  nula: "Nula",
  cashout: "Cash Out",
};

const COLOR_PUNTO = {
  pendiente: "bg-pending",
  ganada: "bg-win",
  perdida: "bg-lose",
  nula: "bg-void",
  cashout: "bg-cashout",
};

// Con borde a juego — para el mini-selector de resultado por partido, ver
// más abajo.
const ESTILOS_BOTON_RESULTADO = {
  ganada: "border-win text-win",
  perdida: "border-lose text-lose",
  nula: "border-void text-void",
};

// Fondo sólido para el "sello" de resultado sobre cada partido — ver
// "colorResultado !== pendiente" más abajo. Mismos tokens que COLOR_PUNTO,
// como relleno en vez de punto.
const TINTE_SELLO = {
  ganada: "bg-win",
  perdida: "bg-lose",
  nula: "bg-void",
  cashout: "bg-cashout",
};

// Detalle simplificado (tercera ronda de ajuste sobre el rediseño anterior):
// se quitó el modo "✎ Editar"/"quitar mercados sueltos" inline — quitar un
// mercado de un partido ya se puede hacer desde el formulario completo (el
// bet builder de FormularioApuesta.jsx ya deja borrar mercados de un
// bloque), así que un único botón "Editar" (lápiz, cabecera) basta y evita
// tener dos formas distintas de "editar" en la misma pantalla. El
// mini-selector Ganada/Perdida/Nula por partido (solo en combinadas, 2+
// partidos) ahora se ve siempre, sin activar ningún modo — y el resultado
// de cada partido es independiente del resultado final de toda la apuesta:
// marcar la apuesta entera como "Perdida" ya NO pinta todos los partidos de
// rojo, cada uno conserva el suyo (puede haber acertado 4 de 5).
export default function ApuestaItem({
  apuesta,
  casas,
  movimientos,
  todasApuestas,
  onMarcarResultado,
  onMarcarResultadoSeleccion,
  onBorrar,
  onEditar,
  onCerrar,
}) {
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);
  const [mostrandoCashOut, setMostrandoCashOut] = useState(false);
  const [importeCashOut, setImporteCashOut] = useState("");
  const [editando, setEditando] = useState(false);
  // En escritorio, el sello de cada partido ya se revela solo al pasar el
  // ratón (group-hover). En móvil no hay hover — este set guarda qué
  // partidos (por indiceLider) se han revelado a mano con su propio ojo,
  // independiente uno de otro: revelar el primer partido no afecta al
  // segundo. Evita depender de un ":hover" simulado al tocar que en
  // algunos navegadores se queda pegado de forma poco predecible.
  const [revelados, setRevelados] = useState(() => new Set());
  const esPendiente = apuesta.resultado === "pendiente";
  const cuotaTotal = calcularCuotaTotal(apuesta);
  const beneficio = calcularBeneficio(apuesta);
  // Misma agrupación por partido tanto si es combinada como si es una
  // apuesta simple (con 1 solo grupo) — así la lista de selecciones usa
  // siempre el mismo trozo de interfaz, sin un caso especial aparte.
  const gruposPartido = agruparSeleccionesPorPartido(apuesta.selecciones);
  // "Combinada" cuenta partidos, no mercados sueltos: un "multi" de un solo
  // partido con 4 mercados (un bet builder) no es una combinada, es una
  // apuesta simple con varios mercados agrupados — mismo criterio en
  // TarjetaApuestaResumen.jsx y utils/trofeos.js.
  const esCombinada = gruposPartido.length > 1;
  const casaObj = casas.find((c) => c.nombre === apuesta.casa);
  const logoCasa = casaObj?.logo;
  const colorCasa = useColorCasa(casaObj ?? { nombre: apuesta.casa, logo: null });

  const baseGanancia = apuesta.stake * (cuotaTotal - 1);
  const gananciaPotencial = apuesta.aumentoPct
    ? baseGanancia * (1 + apuesta.aumentoPct / 100)
    : baseGanancia;
  const valorResumen = esPendiente ? gananciaPotencial : beneficio;
  const colorResumen = valorResumen > 0 ? "text-win" : valorResumen < 0 ? "text-lose" : "text-ink";

  function alternarCashOut() {
    setMostrandoCashOut((actual) => !actual);
    setImporteCashOut("");
  }

  function confirmarCashOut() {
    if (!importeCashOut || Number(importeCashOut) < 0) return;
    onMarcarResultado(apuesta.id, "cashout", Number(importeCashOut));
    setImporteCashOut("");
    setMostrandoCashOut(false);
  }

  function alternarRevelado(indiceLider) {
    setRevelados((actuales) => {
      const nuevo = new Set(actuales);
      if (nuevo.has(indiceLider)) nuevo.delete(indiceLider);
      else nuevo.add(indiceLider);
      return nuevo;
    });
  }

  if (editando) {
    return (
      <FormularioApuesta
        casas={casas}
        movimientos={movimientos}
        apuestas={todasApuestas}
        apuestaInicial={apuesta}
        onGuardar={(datos) => onEditar(apuesta.id, datos)}
        onCancelar={() => setEditando(false)}
      />
    );
  }

  return (
    <div className="bg-surface border border-line rounded-xl overflow-hidden">
      <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-line">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {logoCasa && (
              <img src={logoCasa} alt="" className="w-10 h-10 rounded object-contain shrink-0" />
            )}
            <p className="text-sm text-slate truncate">
              {apuesta.fecha} ·{" "}
              <span style={{ color: colorCasa }} className="font-semibold">
                {apuesta.casa}
              </span>{" "}
              · {apuesta.deporte}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-sm font-semibold px-2.5 py-1 rounded-full bg-gold/10 text-gold">
              {esCombinada ? `Combinada · ${gruposPartido.length} partidos` : "Simple"}
            </span>
            {apuesta.tipoFondos === "freebet" && (
              <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-gold/10 text-gold">
                Freebet
              </span>
            )}
            {apuesta.seguroFreebetImporte > 0 && (
              <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-gold/10 text-gold">
                Asegurada
              </span>
            )}
            {apuesta.aumentoPct > 0 && (
              <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-gold/10 text-gold">
                +{apuesta.aumentoPct}% aumento
              </span>
            )}
            {apuesta.archivado && (
              <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-void/10 text-void">
                Archivada
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setEditando(true)}
            aria-label="Editar apuesta"
            className="text-slate hover:text-gold transition-colors"
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            onClick={() => setConfirmandoBorrado(true)}
            aria-label="Eliminar apuesta"
            className="text-slate hover:text-lose transition-colors"
          >
            <Trash2 size={16} />
          </button>
          {onCerrar && (
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar"
              className="text-slate hover:text-ink transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="flex border-b border-line">
        <div className="flex-1 text-center py-3">
          <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate whitespace-nowrap">
            Stake
          </p>
          <p className="font-mono text-sm sm:text-base font-bold text-ink">
            {apuesta.stake.toFixed(2)}€
          </p>
        </div>
        <div className="flex-1 text-center py-3">
          <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate whitespace-nowrap">
            Cuota{apuesta.cuotaTotalManual ? " *" : ""}
          </p>
          <p className="font-mono text-sm sm:text-base font-bold text-gold">
            {cuotaTotal.toFixed(2)}
          </p>
        </div>
        <div className="flex-1 text-center py-3">
          <p className="text-[10px] sm:text-xs uppercase tracking-wide text-slate whitespace-nowrap">
            {esPendiente ? "Ganancia" : "Beneficio"}
          </p>
          <p className={`font-mono text-sm sm:text-base font-bold ${colorResumen}`}>
            {valorResumen > 0 ? "+" : ""}
            {valorResumen.toFixed(2)}€
          </p>
        </div>
      </div>

      {apuesta.cuotaTotalManual && (
        <p className="text-center text-[11px] text-slate px-4 pt-2">
          * Cuota ajustada a mano al importe real que pagó la casa, no al
          producto de las cuotas de cada partido.
        </p>
      )}

      <div>
        {gruposPartido.map((grupo, indice) => {
          // El resultado de cada partido es el suyo propio (independiente
          // del resultado final de toda la apuesta) cuando es una
          // combinada; en una apuesta simple el único "partido" es la
          // apuesta entera, así que ahí sí refleja el resultado general.
          const colorResultado = esCombinada ? grupo.resultado : apuesta.resultado;
          const revelado = revelados.has(grupo.indiceLider);

          return (
            <div key={grupo.indiceLider}>
              {indice > 0 && <div className="h-px bg-line" />}
              <div className="relative group overflow-hidden px-4 sm:px-5 py-3">
                <div className="flex items-start gap-2.5">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${COLOR_PUNTO[colorResultado]}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-ink break-words">
                      {grupo.evento}
                    </p>
                    {grupo.pais && (
                      <p className="text-xs text-slate">
                        {grupo.competicion} · {grupo.pais}
                      </p>
                    )}
                    <div className="mt-1.5 space-y-1">
                      {grupo.selecciones.map((s) => (
                        <p
                          key={s.id}
                          className="flex items-baseline gap-1.5 text-sm font-medium text-ink break-words"
                        >
                          <span className="text-gold">▸</span>
                          {s.apuesta}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-base font-bold text-gold">
                      {grupo.cuota.toFixed(2)}
                    </p>
                  </div>
                </div>

                {esCombinada && onMarcarResultadoSeleccion && (
                  <div className="flex gap-1.5 mt-2 pl-[18px]">
                    {[
                      { valor: "ganada", etiqueta: "Ganada" },
                      { valor: "perdida", etiqueta: "Perdida" },
                      { valor: "nula", etiqueta: "Nula" },
                    ].map(({ valor, etiqueta }) => (
                      <button
                        key={valor}
                        type="button"
                        onClick={() =>
                          onMarcarResultadoSeleccion(
                            apuesta.id,
                            grupo.indiceLider,
                            grupo.resultado === valor ? "pendiente" : valor
                          )
                        }
                        className={`flex-1 text-sm font-semibold px-2 py-1.5 rounded-md border transition-colors ${
                          grupo.resultado === valor
                            ? ESTILOS_BOTON_RESULTADO[valor]
                            : "border-line text-slate hover:text-ink"
                        }`}
                      >
                        {etiqueta}
                      </button>
                    ))}
                  </div>
                )}

                {/* "Sello" de resultado (maqueta de referencia del
                    usuario): tinte de color + etiqueta grande, con
                    pointer-events-none para que los botones de arriba
                    (Ganada/Perdida/Nula) se sigan pudiendo pulsar a través
                    del sello. Al pasar el ratón, el texto desaparece, se
                    quita el desenfoque y el tinte baja de opacidad — deja
                    leer el contenido sin perder la marca de color. Solo en
                    partidos ya resueltos; "Pendiente" no lleva sello.
                    Desenfoque y tinte van en dos capas separadas (no una
                    sola con blur+opacity a la vez): con las dos cosas en
                    el mismo elemento, ese 10% de opacidad restante deja
                    ver el contenido de debajo SIN desenfocar (el blur ya
                    se había aplicado al 100% antes de bajar la opacidad),
                    así que se seguía leyendo texto de fondo. Con el blur
                    en su propia capa (siempre al 100%, nunca transparente)
                    y el tinte encima en una capa aparte, no hay fuga.
                    inset-x/inset-y (en vez de inset-0) dejan un margen a
                    los lados y arriba/abajo para que el sello se vea como
                    una tarjeta redondeada flotando dentro de la fila, no
                    como un bloque a sangre completa de borde a borde.
                    "revelado" (el ojo de la cabecera) fuerza el mismo
                    aspecto que el hover, sin depender de él — en móvil no
                    hay hover de verdad, y el ":hover" que simulan algunos
                    navegadores al tocar se queda pegado de forma
                    impredecible. Con "revelado" en true se aplican los
                    mismos estilos directamente; en false, el hover de
                    escritorio se conserva como atajo rápido de todas
                    formas. */}
                {colorResultado !== "pendiente" && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                      className={`absolute inset-x-2 sm:inset-x-3 inset-y-1 rounded-xl backdrop-blur-[5px] transition-[backdrop-filter] duration-200 ${
                        revelado ? "backdrop-blur-none" : "group-hover:backdrop-blur-none"
                      }`}
                    />
                    <div
                      className={`absolute inset-x-2 sm:inset-x-3 inset-y-1 rounded-xl transition-opacity duration-200 ${TINTE_SELLO[colorResultado]} ${
                        revelado ? "opacity-[0.48]" : "opacity-90 group-hover:opacity-[0.48]"
                      }`}
                    />
                    <div
                      className={`relative flex flex-col items-center gap-1 transition-opacity duration-200 px-4 text-center ${
                        revelado ? "opacity-0" : "group-hover:opacity-0"
                      }`}
                    >
                      <span className="font-display font-extrabold text-2xl tracking-wide text-paper">
                        {ETIQUETAS_RESULTADO[colorResultado].toUpperCase()}
                      </span>
                      <span className="text-sm font-semibold text-paper/90">{grupo.evento}</span>
                    </div>
                  </div>
                )}

                {/* Ojo propio de este partido — no uno solo para toda la
                    apuesta: revelar el primer partido no afecta al resto.
                    Va DESPUÉS del sello en el JSX (así pinta encima suyo
                    sin necesitar z-index) y con fondo propio para
                    distinguirse igual de bien tapado (sobre el tinte de
                    color) que revelado (sobre el contenido normal). */}
                {colorResultado !== "pendiente" && (
                  <button
                    type="button"
                    onClick={() => alternarRevelado(grupo.indiceLider)}
                    aria-label={revelado ? "Ocultar resultado de este partido" : "Ver resultado de este partido"}
                    className="absolute top-4 right-5 p-1.5 rounded-full bg-black/15 hover:bg-black/25 text-paper transition-colors"
                  >
                    {revelado ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {esPendiente && (
        <div className="p-4 sm:p-5 border-t border-line space-y-2">
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => onMarcarResultado(apuesta.id, "ganada")}
              className="py-2.5 rounded-lg text-sm font-bold border border-line text-win hover:border-win transition-colors"
            >
              Ganada
            </button>
            <button
              type="button"
              onClick={() => onMarcarResultado(apuesta.id, "perdida")}
              className="py-2.5 rounded-lg text-sm font-bold border border-line text-lose hover:border-lose transition-colors"
            >
              Perdida
            </button>
            <button
              type="button"
              onClick={() => onMarcarResultado(apuesta.id, "nula")}
              className="py-2.5 rounded-lg text-sm font-bold border border-line text-void hover:border-void transition-colors"
            >
              Nula
            </button>
            <button
              type="button"
              onClick={alternarCashOut}
              className={`py-2.5 rounded-lg text-sm font-bold border transition-colors ${
                mostrandoCashOut
                  ? "bg-cashout text-paper border-cashout"
                  : "border-line text-cashout hover:border-cashout"
              }`}
            >
              Cash Out
            </button>
          </div>

          {/* Importe directo en la propia tarjeta, en vez de un diálogo
              aparte (CashOutDialog.jsx, eliminado): la casa no calcula el
              cash out con la cuota, así que hace falta preguntarlo, pero no
              hacía falta un modal para un solo campo. */}
          {mostrandoCashOut && (
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                value={importeCashOut}
                onChange={(e) => setImporteCashOut(e.target.value)}
                placeholder="Importe recibido (€)"
                autoFocus
                className="flex-1 border border-line rounded-lg px-3 py-2 text-sm font-mono bg-surface"
              />
              <button
                type="button"
                onClick={confirmarCashOut}
                disabled={!importeCashOut || Number(importeCashOut) < 0}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-cashout text-paper hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Confirmar
              </button>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        abierto={confirmandoBorrado}
        titulo="Borrar apuesta"
        mensaje="Esta acción no se puede deshacer. ¿Seguro que quieres borrar esta apuesta?"
        onConfirmar={() => {
          onBorrar(apuesta.id);
          setConfirmandoBorrado(false);
        }}
        onCancelar={() => setConfirmandoBorrado(false)}
      />
    </div>
  );
}
