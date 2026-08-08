import { useState } from "react";
import { X, Pencil, Trash2 } from "lucide-react";
import { calcularBeneficio, calcularCuotaTotal, agruparSeleccionesPorPartido } from "../utils/apuestas";
import { useColorCasa } from "../hooks/useColorCasa";
import ConfirmDialog from "./ConfirmDialog";
import CashOutDialog from "./CashOutDialog";
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

const COLOR_TEXTO = {
  pendiente: "text-pending",
  ganada: "text-win",
  perdida: "text-lose",
  nula: "text-void",
  cashout: "text-cashout",
};

// Con borde a juego (a diferencia de COLOR_TEXTO, que es solo texto) — para
// el mini-selector de resultado por partido, ver más abajo.
const ESTILOS_BOTON_RESULTADO = {
  ganada: "border-win text-win",
  perdida: "border-lose text-lose",
  nula: "border-void text-void",
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
  const [editando, setEditando] = useState(false);
  const esPendiente = apuesta.resultado === "pendiente";
  const cuotaTotal = calcularCuotaTotal(apuesta.selecciones);
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
          <p className="text-xs uppercase tracking-wide text-slate">Stake</p>
          <p className="font-mono text-base font-bold text-ink">{apuesta.stake.toFixed(2)}€</p>
        </div>
        <div className="flex-1 text-center py-3">
          <p className="text-xs uppercase tracking-wide text-slate">Cuota total</p>
          <p className="font-mono text-base font-bold text-gold">{cuotaTotal.toFixed(2)}</p>
        </div>
        <div className="flex-1 text-center py-3">
          <p className="text-xs uppercase tracking-wide text-slate">
            {esPendiente ? "Ganancia potencial" : "Beneficio"}
          </p>
          <p className={`font-mono text-base font-bold ${colorResumen}`}>
            {valorResumen > 0 ? "+" : ""}
            {valorResumen.toFixed(2)}€
          </p>
        </div>
      </div>

      <div className="px-3 sm:px-4">
        {gruposPartido.map((grupo, indice) => {
          // El resultado de cada partido es el suyo propio (independiente
          // del resultado final de toda la apuesta) cuando es una
          // combinada; en una apuesta simple el único "partido" es la
          // apuesta entera, así que ahí sí refleja el resultado general.
          const colorResultado = esCombinada ? grupo.resultado : apuesta.resultado;

          return (
            <div key={grupo.indiceLider}>
              {indice > 0 && <div className="h-px bg-line" />}
              <div className="py-3">
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
                    <div className="mt-1 space-y-0.5">
                      {grupo.selecciones.map((s) => (
                        <p key={s.id} className="text-sm text-slate break-words">
                          {s.apuesta}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-base font-bold text-gold">
                      {grupo.cuota.toFixed(2)}
                    </p>
                    <p className={`text-xs font-bold mt-0.5 ${COLOR_TEXTO[colorResultado]}`}>
                      {ETIQUETAS_RESULTADO[colorResultado].toUpperCase()}
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
              </div>
            </div>
          );
        })}
      </div>

      {esPendiente && (
        <div className="p-4 sm:p-5 border-t border-line space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onMarcarResultado(apuesta.id, "ganada")}
              className="py-2.5 rounded-lg text-sm font-bold border border-line text-win hover:border-win transition-colors"
            >
              Apuesta Ganada
            </button>
            <button
              type="button"
              onClick={() => onMarcarResultado(apuesta.id, "perdida")}
              className="py-2.5 rounded-lg text-sm font-bold border border-line text-lose hover:border-lose transition-colors"
            >
              Apuesta Perdida
            </button>
            <button
              type="button"
              onClick={() => onMarcarResultado(apuesta.id, "nula")}
              className="py-2.5 rounded-lg text-sm font-bold border border-line text-void hover:border-void transition-colors"
            >
              Nula
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMostrandoCashOut(true)}
            className="w-full py-2 rounded-lg text-sm font-semibold bg-gold text-felt hover:bg-goldDark transition-colors"
          >
            Cash Out
          </button>
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

      <CashOutDialog
        abierto={mostrandoCashOut}
        onConfirmar={(importe) => {
          onMarcarResultado(apuesta.id, "cashout", importe);
          setMostrandoCashOut(false);
        }}
        onCancelar={() => setMostrandoCashOut(false)}
      />
    </div>
  );
}
