import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Search, X } from "lucide-react";
import { agruparPorMesYDia } from "../utils/agrupado";
import { normalizarTexto } from "../utils/texto";
import TarjetaApuestaResumen from "./TarjetaApuestaResumen";
import ApuestaItem from "./ApuestaItem";
import PanelLateral from "./PanelLateral";

// Coincide si el texto de búsqueda aparece en el evento o en el mercado de
// CUALQUIER selección de la apuesta (no solo la líder) — así buscar
// "Córners" encuentra también una combinada donde ese mercado es uno más
// entre varios, no el principal. Mismo "quitar acentos" que ya usa
// BuscadorEvento.jsx (utils/texto.js), para que escribir sin tildes también
// encuentre resultados.
function coincideApuesta(apuesta, busqueda) {
  if (!busqueda.trim()) return true;
  const objetivo = normalizarTexto(busqueda);
  return apuesta.selecciones.some(
    (s) => normalizarTexto(s.evento).includes(objetivo) || normalizarTexto(s.apuesta).includes(objetivo)
  );
}

// agrupada=true (el caso normal en Apuestas/Entretenimiento) agrupa por mes
// (colapsable, con su total) y día (con el suyo), con buscador de texto
// libre. agrupada=false (p.ej. "Últimas apuestas" en PantallaInicio.jsx,
// solo 5 apuestas sueltas) pinta las tarjetas en una lista plana, sin
// cabeceras ni buscador — no aporta con tan pocas apuestas. Tocar una
// tarjeta abre el detalle completo (ApuestaItem.jsx, con las acciones de
// marcar resultado/editar/borrar) en un modal.
export default function ListaApuestas({
  apuestas,
  casas,
  movimientos,
  todasApuestas,
  onMarcarResultado,
  onAjustarGanancia,
  onMarcarResultadoPartido,
  onActualizarCuotaSeleccion,
  onBorrar,
  onAbrirEdicion,
  agrupada = true,
  denso = false,
}) {
  const [apuestaAbiertaId, setApuestaAbiertaId] = useState(null);
  // Qué meses ha tocado el usuario explícitamente (abrir/cerrar). El mes
  // que no ha tocado usa su valor por defecto: solo el más reciente
  // (esPrimero) empieza expandido, recalculado en cada render, para que no
  // se quede "pegado" un mes viejo si cambia el filtro/periodo.
  const [overrides, setOverrides] = useState({});
  const [busqueda, setBusqueda] = useState("");

  // Se busca en "todasApuestas" (sin filtrar), no en "apuestas" (la lista
  // que se ve, ya filtrada) — Bug real: en un filtro por resultado (ej.
  // "Pendientes" de Historial.jsx), marcar un resultado hacía que la
  // apuesta dejara de cumplir el filtro y desapareciera de "apuestas" al
  // instante, cerrando el panel de detalle solo a mitad de marcarla (sin
  // dejar corregir a Perdida/Nula si el primer clic había sido un error).
  // Buscarla en la lista completa mantiene el panel abierto con los datos
  // en vivo hasta que el usuario lo cierre a propósito.
  const apuestaAbierta = (todasApuestas ?? apuestas).find((a) => a.id === apuestaAbiertaId) ?? null;

  useEffect(() => {
    if (apuestaAbiertaId && !apuestaAbierta) setApuestaAbiertaId(null);
  }, [apuestaAbiertaId, apuestaAbierta]);

  const apuestasVisibles = agrupada ? apuestas.filter((a) => coincideApuesta(a, busqueda)) : apuestas;

  // Bug real: esto vivía como un "return" temprano nada más entrar al
  // componente, ANTES de calcular "apuestaAbierta"/el panel de detalle. Con
  // un filtro por resultado (ej. "Pendientes" de Historial.jsx) y una sola
  // apuesta pendiente en pantalla, marcarla resuelta vaciaba esta lista al
  // instante — y ese "return" temprano se saltaba también el panel del
  // ticket que seguía abierto, aunque la apuesta siguiera existiendo
  // perfectamente (se buscaba en todasApuestas, no en esta lista filtrada).
  // Se veía como un parpadeo: el panel desaparecía un frame entero. Ahora
  // es un caso más de "contenido", así que el resto (buscador, panel) sigue
  // rendered sin importar si la lista visible está vacía.
  const contenido = apuestas.length === 0 ? (
    <p className="text-center text-sm text-slate py-10">
      Todavía no hay apuestas registradas.
    </p>
  ) : !agrupada ? (
    <div className="space-y-2">
      {apuestasVisibles.map((apuesta) => (
        <TarjetaApuestaResumen
          key={apuesta.id}
          apuesta={apuesta}
          onAbrir={setApuestaAbiertaId}
          denso={denso}
          casas={casas}
        />
      ))}
    </div>
  ) : apuestasVisibles.length === 0 ? (
    <p className="text-center text-sm text-slate py-10">
      Ninguna apuesta coincide con "{busqueda}".
    </p>
  ) : (
    agruparPorMesYDia(apuestasVisibles).map((mes, i) => {
      const expandido = overrides[mes.clave] ?? i === 0;
      return (
        <div key={mes.clave}>
          <button
            type="button"
            onClick={() =>
              setOverrides((actuales) => ({ ...actuales, [mes.clave]: !expandido }))
            }
            className="w-full flex items-center justify-between gap-2 bg-surface border border-line rounded-lg px-3 py-2.5 hover:border-gold/40 transition-colors"
          >
            <span className="flex items-center gap-1.5 font-display text-xl font-bold text-ink">
              {expandido ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              {mes.etiqueta}
            </span>
            <span
              className={`font-mono text-sm font-bold px-3 py-1 rounded-full ${
                mes.beneficio > 0
                  ? "bg-win/15 text-win"
                  : mes.beneficio < 0
                  ? "bg-lose/15 text-lose"
                  : "bg-paperDim text-slate"
              }`}
            >
              {mes.beneficio > 0 ? "+" : ""}
              {mes.beneficio.toFixed(2)}€
            </span>
          </button>

          {expandido && (
            <div className="space-y-3 mt-2">
              {mes.dias.map((dia) => (
                <div
                  key={dia.fecha}
                  className="bg-surface border border-line rounded-2xl p-3 sm:p-4 space-y-3"
                >
                  <div className="flex items-center justify-between px-1">
                    <span className="font-display text-sm font-semibold text-ink">{dia.etiqueta}</span>
                    <span
                      className={`font-mono text-xs font-bold px-2.5 py-1 rounded-full ${
                        dia.beneficio > 0
                          ? "bg-win/15 text-win"
                          : dia.beneficio < 0
                          ? "bg-lose/15 text-lose"
                          : "bg-paperDim text-slate"
                      }`}
                    >
                      {dia.beneficio > 0 ? "+" : ""}
                      {dia.beneficio.toFixed(2)}€
                    </span>
                  </div>
                  <div className="space-y-2">
                    {dia.apuestas.map((apuesta) => (
                      <TarjetaApuestaResumen
                        key={apuesta.id}
                        apuesta={apuesta}
                        onAbrir={setApuestaAbiertaId}
                        denso={denso}
                        casas={casas}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    })
  );

  return (
    <div className="space-y-3">
      {agrupada && (
        <div className="relative group">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate group-focus-within:text-gold transition-colors"
          />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por partido o mercado..."
            className="w-full border-2 border-line rounded-full pl-11 pr-10 py-2.5 text-sm bg-surface focus:outline-none focus:border-gold transition-colors"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda("")}
              aria-label="Borrar búsqueda"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate hover:text-lose transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {contenido}

      {apuestaAbierta && (
        <div
          className={`fixed inset-0 bg-black/50 flex items-center justify-center px-4 pb-4 pt-36 md:pt-20 z-50 ${
            denso ? "md:hidden" : ""
          }`}
          onClick={() => setApuestaAbiertaId(null)}
        >
          {/* max-w-xl: el detalle rediseñado ya no tiene un layout de
              escritorio en fila (era lo que necesitaba max-w-3xl antes) —
              es una lista vertical siempre, así que se ve mejor más
              estrecha, tipo tarjeta. Se deja algo más de margen que los
              ~420px de la maqueta para que "Editar" (FormularioApuesta, con
              campos a 2 columnas en pantallas anchas) no quede demasiado
              apretado. */}
          <div
            className="w-full max-w-xl max-h-[calc(100dvh-10rem)] md:max-h-[calc(100dvh-6rem)] overflow-y-auto scrollbar-oculto"
            onClick={(e) => e.stopPropagation()}
          >
            <ApuestaItem
              apuesta={apuestaAbierta}
              casas={casas}
              movimientos={movimientos}
              todasApuestas={todasApuestas}
              onMarcarResultado={onMarcarResultado}
              onAjustarGanancia={onAjustarGanancia}
              onMarcarResultadoPartido={onMarcarResultadoPartido}
              onActualizarCuotaSeleccion={onActualizarCuotaSeleccion}
              onBorrar={onBorrar}
              onAbrirEdicion={onAbrirEdicion}
              onCerrar={() => setApuestaAbiertaId(null)}
            />
          </div>
        </div>
      )}

      {/* Panel lateral de escritorio (solo cuando denso, ver PantallaInicio.jsx):
          mismo ApuestaItem que el modal de arriba, solo cambia el
          contenedor — anclado a la derecha en vez de centrado. */}
      {denso && (
        <PanelLateral abierto={!!apuestaAbierta} onCerrar={() => setApuestaAbiertaId(null)}>
          {apuestaAbierta && (
            <ApuestaItem
              apuesta={apuestaAbierta}
              casas={casas}
              movimientos={movimientos}
              todasApuestas={todasApuestas}
              onMarcarResultado={onMarcarResultado}
              onAjustarGanancia={onAjustarGanancia}
              onMarcarResultadoPartido={onMarcarResultadoPartido}
              onActualizarCuotaSeleccion={onActualizarCuotaSeleccion}
              onBorrar={onBorrar}
              onAbrirEdicion={onAbrirEdicion}
              onCerrar={() => setApuestaAbiertaId(null)}
            />
          )}
        </PanelLateral>
      )}
    </div>
  );
}
