import { useState } from "react";
import { Check, Pencil, Search, X } from "lucide-react";
import {
  CATEGORIAS_MERCADO,
  ARBOL_MERCADOS,
  equiposDesdeEvento,
  buscarMercadoPorTexto,
  interpretarMercadoJugador,
  rutaEnArbol,
} from "../utils/mercados";
import { normalizarTexto } from "../utils/texto";
import { usePlantilla } from "../hooks/usePlantilla";
import SelectorDesplegable from "./SelectorDesplegable";
import TabsDesplazables from "./TabsDesplazables";

const OTRO = "otro";

// Los 433 ids del catálogo son únicos en todo el árbol (comprobado a mano
// al reorganizarlo en categoría → subcategoría → Local/Visitante), así que
// basta con el id de la opción para encontrarla — ya no hace falta
// arrastrar también la categoría plana como en el desplegable anterior.
function buscarOpcionPorId(opcionId) {
  for (const categoria of CATEGORIAS_MERCADO) {
    const opcion = categoria.opciones.find((o) => o.id === opcionId);
    if (opcion) return opcion;
  }
  return null;
}

// Si el texto ya guardado en "Apuesta" coincide con una opción del
// catálogo para este evento, la deja preseleccionada (para poder editar
// una apuesta ya creada); si no coincide con nada (apuestas de antes de
// este desplegable, o texto libre), abre directamente en "Otro mercado"
// para no esconder lo que ya había escrito. Los mercados de jugador se
// comprueban primero: su texto no lo genera equiposDesdeEvento, así que
// buscarMercadoPorTexto nunca los reconocería.
function seleccionInicial(valorApuesta, equipos) {
  if (!valorApuesta) return "";
  const deJugador = interpretarMercadoJugador(valorApuesta);
  if (deJugador) return deJugador.opcionId;
  const encontrado = buscarMercadoPorTexto(valorApuesta, equipos);
  return encontrado ? encontrado.opcionId : OTRO;
}

function etiquetaSeleccion(seleccion, equipos, jugadorTexto) {
  if (!seleccion) return "";
  if (seleccion === OTRO) return "Otro mercado";
  const opcion = buscarOpcionPorId(seleccion);
  return opcion ? opcion.texto(equipos, jugadorTexto) : "";
}

const TABS_NIVEL1 = [
  ...ARBOL_MERCADOS.map((c) => ({ valor: c.id, texto: c.etiqueta })),
  { valor: OTRO, texto: "Otro mercado" },
];

// Recorre TODO el árbol (menos "Jugador", cuyo texto no existe sin elegir
// antes un jugador) buscando coincidencias de texto, acumulando la ruta
// completa (categoría · subcategoría · Local/Visitante) como cabecera de
// cada grupo de resultados — así se puede buscar sin tener que navegar
// primero hasta el nivel exacto donde vive el mercado.
function buscarEnArbol(query, equipos) {
  const resultados = [];
  const objetivo = normalizarTexto(query);

  function recorrer(nodo, ruta) {
    if (nodo.opciones) {
      const coincidencias = nodo.opciones.filter((o) =>
        normalizarTexto(o.texto(equipos)).includes(objetivo)
      );
      if (coincidencias.length > 0) resultados.push({ ruta, opciones: coincidencias });
      return;
    }
    for (const hijo of nodo.subcategorias) {
      recorrer(hijo, `${ruta} · ${hijo.etiqueta}`);
    }
  }

  for (const categoria of ARBOL_MERCADOS) {
    if (categoria.requiereJugador) continue;
    for (const sub of categoria.subcategorias) {
      recorrer(sub, `${categoria.etiqueta} · ${sub.etiqueta}`);
    }
  }
  return resultados;
}

// Campo "Apuesta" de una selección (ver FormularioApuesta.jsx): buscador de
// texto libre (recorre todo el árbol a la vez, agrupando por categoría ·
// subcategoría) + navegación en 3 niveles debajo — pestañas de categoría
// principal, pestañas de subcategoría, y una fila más pequeña de
// Local/Visitante cuando la subcategoría la tiene (ver real-demo-v3.html,
// referencia aportada por el usuario). El panel entero va siempre visible,
// nunca es un desplegable que se abre/cierra.
export default function SelectorMercado({
  evento,
  valor,
  onCambiar,
  equipoLocalId = null,
  equipoVisitanteId = null,
}) {
  const equipos = equiposDesdeEvento(evento);
  const [seleccion, setSeleccion] = useState(() => seleccionInicial(valor, equipos));
  const [jugadorTexto, setJugadorTexto] = useState(
    () => interpretarMercadoJugador(valor)?.jugador ?? ""
  );
  // Filtro Local/Visitante de la categoría "Jugador" (petición directa):
  // no es un mercado nuevo, solo acota qué plantilla se pide — antes se
  // pedían las de los dos equipos a la vez en cuanto se abría esta
  // categoría, el doble de llamadas de las que hacían falta si solo
  // querías un jugador de uno de los dos.
  const [equipoJugadorFiltro, setEquipoJugadorFiltro] = useState("local");
  const [busqueda, setBusqueda] = useState("");

  // Ruta (categoría → subcategoría → Local/Visitante) de la selección ya
  // guardada, para abrir el árbol justo donde vive — se calcula una sola
  // vez aquí y se reutiliza en los tres useState de abajo.
  const rutaInicial =
    seleccion && seleccion !== OTRO ? rutaEnArbol(seleccion) : null;
  const [topActiva, setTopActiva] = useState(
    () => (seleccion === OTRO ? OTRO : rutaInicial?.categoriaId ?? ARBOL_MERCADOS[0].id)
  );
  const [subActiva, setSubActiva] = useState(
    () => rutaInicial?.subcategoriaId ?? ARBOL_MERCADOS[0].subcategorias[0].id
  );
  const [nivel3Activa, setNivel3Activa] = useState(() => rutaInicial?.nivel3Id ?? null);

  // Bug real (2026-08-10): al elegir un mercado, el panel (buscador +
  // pestañas + lista) se quedaba abierto sin ninguna señal de que ya se
  // había elegido algo. Ahora, elegir una opción lo colapsa a la píldora
  // dorada + "Cambiar mercado" (mismo patrón que el bloque superior de
  // FormularioApuesta.jsx: Confirmar → tira resumen → ✎ Editar). Arranca
  // colapsado si ya había un valor guardado (al editar una selección ya
  // creada), abierto si no.
  const [expandido, setExpandido] = useState(() => !valor);

  const topNode = ARBOL_MERCADOS.find((c) => c.id === topActiva) ?? null;
  const enTabJugador = topActiva === "jugador";

  // Plantillas de los dos equipos del partido: solo hay datos si la
  // selección viene de elegir un partido real del buscador — con texto
  // libre, o en apuestas de antes de esta función, no hay id de equipo y
  // el campo cae solo al texto libre de más abajo.
  // Bug real (2026-08-11): antes se pedían las dos plantillas en cuanto se
  // abría el selector de CUALQUIER mercado, sin haber tocado "Jugador" —
  // en una combinada de 7 partidos eso eran 14 llamadas de sobra. Ahora
  // solo se pide de verdad estando en la pestaña "Jugador", y encima solo
  // la del equipo elegido en el filtro Local/Visitante de arriba — su
  // caché por equipo (a nivel de módulo) evita repetir la llamada si se
  // vuelve a esta pestaña o se cambia el filtro de un lado a otro.
  const jugadoresLocal = usePlantilla(
    enTabJugador && equipoJugadorFiltro === "local" ? equipoLocalId : null
  );
  const jugadoresVisitante = usePlantilla(
    enTabJugador && equipoJugadorFiltro === "visitante" ? equipoVisitanteId : null
  );
  const gruposJugadores = [
    ...(jugadoresLocal.length > 0
      ? [{ etiqueta: equipos.local, opciones: jugadoresLocal.map((j) => ({ valor: j.nombre, texto: j.nombre })) }]
      : []),
    ...(jugadoresVisitante.length > 0
      ? [
          {
            etiqueta: equipos.visitante,
            opciones: jugadoresVisitante.map((j) => ({ valor: j.nombre, texto: j.nombre })),
          },
        ]
      : []),
  ];
  const hayPlantilla = gruposJugadores.length > 0;

  function elegirTop(id) {
    setTopActiva(id);
    if (id === OTRO) return;
    const nuevoTop = ARBOL_MERCADOS.find((c) => c.id === id);
    setSubActiva(nuevoTop?.subcategorias[0]?.id ?? "");
    setNivel3Activa(null);
  }

  function elegirSub(id) {
    setSubActiva(id);
    setNivel3Activa(null);
  }

  function cambiarEquipoJugador(clave) {
    setEquipoJugadorFiltro(clave);
    setJugadorTexto("");
  }

  function elegir(nuevaSeleccion) {
    setSeleccion(nuevaSeleccion);
    setBusqueda("");
    if (nuevaSeleccion === OTRO) return;
    const opcion = buscarOpcionPorId(nuevaSeleccion);
    if (opcion) onCambiar(opcion.texto(equipos, jugadorTexto));
    setExpandido(false);
  }

  function elegirOtro(texto) {
    setSeleccion(OTRO);
    onCambiar(texto);
  }

  const resultadosBusqueda = busqueda.trim() ? buscarEnArbol(busqueda, equipos) : [];

  const subNode = topNode?.subcategorias.find((s) => s.id === subActiva) ?? null;
  const tieneNivel3 = !!(subNode && subNode.subcategorias);
  const nivel3Node = tieneNivel3
    ? subNode.subcategorias.find((n) => n.id === nivel3Activa) ?? subNode.subcategorias[0]
    : null;
  const opcionesActuales = tieneNivel3 ? nivel3Node?.opciones ?? [] : subNode?.opciones ?? [];

  if (!expandido && seleccion) {
    return (
      <button
        type="button"
        onClick={() => setExpandido(true)}
        className="w-full flex items-center justify-between gap-2 border border-line rounded-lg bg-surface px-3 py-2.5 text-left hover:border-gold/40 transition-colors"
      >
        <span className="flex items-center gap-1 text-xs font-semibold text-gold bg-gold/10 border border-gold/30 rounded-full px-3 py-1.5 truncate">
          <Check size={12} className="shrink-0" />
          <span className="truncate">{etiquetaSeleccion(seleccion, equipos, jugadorTexto)}</span>
        </span>
        <span className="flex items-center gap-1 text-xs font-semibold text-gold shrink-0">
          <Pencil size={12} />
          Cambiar mercado
        </span>
      </button>
    );
  }

  return (
    <div className="border border-line rounded-lg bg-surface overflow-hidden">
      {seleccion && (
        <div className="flex items-center gap-1.5 px-3 pt-3">
          <span className="flex items-center gap-1 text-xs font-semibold text-gold bg-gold/10 border border-gold/30 rounded-full px-3 py-1.5 max-w-full">
            <Check size={12} className="shrink-0" />
            <span className="truncate">{etiquetaSeleccion(seleccion, equipos, jugadorTexto)}</span>
          </span>
        </div>
      )}

      <div className="p-3 pb-0">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar mercado (ej. over, hándicap...)"
            className="w-full border border-line rounded-lg pl-9 pr-9 py-2 text-sm"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda("")}
              aria-label="Vaciar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate hover:text-lose"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {busqueda.trim() ? (
        <div className="max-h-72 overflow-y-auto scrollbar-oculto mt-2">
          {resultadosBusqueda.length === 0 ? (
            <p className="px-3 py-4 text-sm text-slate text-center">Sin resultados — prueba "Otro mercado"</p>
          ) : (
            resultadosBusqueda.map(({ ruta, opciones }) => (
              <div key={ruta}>
                <p className="bg-felt px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-gold">
                  {ruta}
                </p>
                {opciones.map((opcion) => (
                  <button
                    key={opcion.id}
                    type="button"
                    onClick={() => elegir(opcion.id)}
                    className={`w-full flex items-center justify-between gap-2 px-4 py-2 text-sm border-b border-line/60 last:border-b-0 transition-colors ${
                      seleccion === opcion.id ? "bg-gold/10 text-gold font-medium" : "text-ink hover:bg-paperDim"
                    }`}
                  >
                    <span className="truncate">{opcion.texto(equipos)}</span>
                    {seleccion === opcion.id && <Check size={14} className="shrink-0" />}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      ) : (
        <>
          <TabsDesplazables opciones={TABS_NIVEL1} valor={topActiva} onElegir={elegirTop} colorActivo="gold" />

          {topActiva === OTRO && (
            <div className="p-3 space-y-2">
              <input
                type="text"
                value={seleccion === OTRO ? valor : ""}
                onChange={(e) => elegirOtro(e.target.value)}
                placeholder="Ej. Gana Real Madrid"
                className="w-full border border-line rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => setExpandido(false)}
                disabled={!(seleccion === OTRO && valor.trim())}
                className="text-xs font-semibold text-gold border border-gold/40 rounded-full px-3 py-1 hover:bg-gold/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Listo
              </button>
            </div>
          )}

          {topNode && (
            <TabsDesplazables
              opciones={topNode.subcategorias.map((s) => ({ valor: s.id, texto: s.etiqueta }))}
              valor={subActiva}
              onElegir={elegirSub}
              colorActivo="gold"
            />
          )}

          {tieneNivel3 && (
            <div className="flex gap-1.5 px-3 py-2 border-b border-line bg-paperDim/40">
              {subNode.subcategorias.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setNivel3Activa(n.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                    (nivel3Activa ?? subNode.subcategorias[0].id) === n.id
                      ? "bg-gold text-feltDark border-gold"
                      : "border-line text-slate hover:text-ink"
                  }`}
                >
                  {n.etiqueta}
                </button>
              ))}
            </div>
          )}

          {topNode?.requiereJugador && (
            <div className="p-3 space-y-2">
              <div>
                <label className="block text-xs text-slate mb-1">Equipo</label>
                <div className="flex gap-2">
                  {[
                    { clave: "local", nombre: equipos.local },
                    { clave: "visitante", nombre: equipos.visitante },
                  ].map(({ clave, nombre }) => (
                    <button
                      key={clave}
                      type="button"
                      onClick={() => cambiarEquipoJugador(clave)}
                      className={`flex-1 truncate px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        equipoJugadorFiltro === clave
                          ? "bg-gold text-feltDark border-gold"
                          : "border-line text-slate hover:text-ink"
                      }`}
                    >
                      {nombre}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate mb-1">Jugador</label>
                {hayPlantilla ? (
                  <SelectorDesplegable
                    valor={jugadorTexto}
                    placeholder="Elige un jugador"
                    grupos={gruposJugadores}
                    onElegir={setJugadorTexto}
                  />
                ) : (
                  <input
                    type="text"
                    value={jugadorTexto}
                    onChange={(e) => setJugadorTexto(e.target.value)}
                    placeholder="Nombre del jugador"
                    className="w-full border border-line rounded-lg px-3 py-2 text-sm"
                  />
                )}
              </div>
              <div className="max-h-56 overflow-y-auto scrollbar-oculto -mx-3">
                {opcionesActuales.map((opcion) => (
                  <button
                    key={opcion.id}
                    type="button"
                    disabled={!jugadorTexto.trim()}
                    onClick={() => elegir(opcion.id)}
                    className={`w-full flex items-center justify-between gap-2 px-4 py-2 text-sm border-b border-line/60 last:border-b-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                      seleccion === opcion.id ? "bg-gold/10 text-gold font-medium" : "text-ink hover:bg-paperDim"
                    }`}
                  >
                    <span className="truncate">{opcion.texto(equipos, jugadorTexto || "…")}</span>
                    {seleccion === opcion.id && <Check size={14} className="shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {topNode && !topNode.requiereJugador && (
            <div className="max-h-72 overflow-y-auto scrollbar-oculto">
              {opcionesActuales.map((opcion) => (
                <button
                  key={opcion.id}
                  type="button"
                  onClick={() => elegir(opcion.id)}
                  className={`w-full flex items-center justify-between gap-2 px-4 py-2 text-sm border-b border-line/60 last:border-b-0 transition-colors ${
                    seleccion === opcion.id ? "bg-gold/10 text-gold font-medium" : "text-ink hover:bg-paperDim"
                  }`}
                >
                  <span className="truncate">{opcion.texto(equipos)}</span>
                  {seleccion === opcion.id && <Check size={14} className="shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
