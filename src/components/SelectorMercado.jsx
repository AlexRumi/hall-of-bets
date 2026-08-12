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

// Filtro por posición del desplegable de jugador (petición directa):
// "Paradas del portero" solo tiene sentido con porteros; el resto de
// mercados de jugador de esta lista (remates, faltas, entradas,
// anotará/asistirá...) casi nunca los juega un portero, así que se
// excluyen para no alargar la lista con nombres que no van a usarse.
// "Tarjetas" se queda sin filtrar a propósito (un portero sí puede ver
// tarjeta). "posicion" viene tal cual la da API-Football (api/jugadores.js,
// campo "position" de /players/squads) — valor en inglés, "Goalkeeper"
// para porteros; sin verificar a mano contra la cuenta real todavía.
const PORTERO = "Goalkeeper";
const SUBCATS_JUGADOR_SOLO_PORTEROS = new Set(["paradas"]);
const SUBCATS_JUGADOR_SIN_PORTEROS = new Set([
  "goles",
  "asistencias",
  "anota-o-asiste",
  "remates",
  "remates-puerta",
  "faltas",
  "entradas",
]);

// Filtro adicional por posición (petición directa, tras excluir porteros
// de las categorías de arriba): con 20+ jugadores de campo en algunos
// equipos, acotar a Defensas/Centrocampistas/Delanteros ayuda a encontrar
// el jugador más rápido. Solo tiene sentido en las mismas categorías que
// ya excluyen porteros (donde SÍ puede salir cualquier jugador de campo)
// — en "Paradas del portero" (solo porteros) y "Tarjetas" (sin filtrar,
// puede ser cualquiera) no aporta nada, así que no se ofrece ahí.
const POSICIONES_CAMPO = [
  { valor: "todas", etiqueta: "Todas", posicionApi: null },
  { valor: "defensa", etiqueta: "Defensas", posicionApi: "Defender" },
  { valor: "centrocampista", etiqueta: "Centrocampistas", posicionApi: "Midfielder" },
  { valor: "delantero", etiqueta: "Delanteros", posicionApi: "Attacker" },
];

function filtrarPorPosicion(jugadores, subcategoriaId, posicionFiltro) {
  if (SUBCATS_JUGADOR_SOLO_PORTEROS.has(subcategoriaId)) {
    return jugadores.filter((j) => j.posicion === PORTERO);
  }
  if (SUBCATS_JUGADOR_SIN_PORTEROS.has(subcategoriaId)) {
    const sinPorteros = jugadores.filter((j) => j.posicion !== PORTERO);
    const posicionApi = POSICIONES_CAMPO.find((p) => p.valor === posicionFiltro)?.posicionApi;
    return posicionApi ? sinPorteros.filter((j) => j.posicion === posicionApi) : sinPorteros;
  }
  return jugadores;
}

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
// subcategoría) + navegación en niveles debajo — pestañas de categoría
// principal, pestañas de subcategoría, y una fila más pequeña de
// Local/Visitante (o lo que toque, p.ej. mitad) cuando la subcategoría la
// tiene (ver real-demo-v3.html, referencia aportada por el usuario). Un
// puñado de categorías (Goles/Córners "por equipo y mitad") llegan a un 4º
// nivel — mitad → Over/Under, mismo patrón un escalón más abajo, con una
// fila aún más pequeña. El panel entero va siempre visible, nunca es un
// desplegable que se abre/cierra.
export default function SelectorMercado({
  evento,
  valor,
  onCambiar,
  equipoLocalId = null,
  equipoVisitanteId = null,
  // Petición directa: en "Crear multi de este partido" (ConstructorPartido.jsx),
  // elegir un mercado no es la acción final — hay un paso de confirmación
  // aparte ("Añadir mercado") que lo empuja a la lista del bloque. Colapsar
  // el panel de golpe ahí se sentía como un salto brusco a "otra pantalla"
  // sin relación (el usuario lo describió como "dos ventanas"). En el resto
  // de sitios (pick simple, editar un mercado ya guardado) elegir SÍ es la
  // acción final, así que ahí se mantiene el colapso de siempre.
  colapsarAlElegir = true,
  // Petición directa (flujo multi-mercado de ConstructorPartido.jsx): se
  // llama con el texto ya definitivo justo cuando el panel colapsa de
  // verdad (al elegir una opción de la lista, o al pulsar "Listo" en
  // "Otro mercado") — a diferencia de onCambiar, que en el campo de texto
  // libre se dispara en cada tecla, esto solo dispara una vez, cuando el
  // usuario ya ha terminado. El texto se pasa como argumento (no se lee de
  // ningún estado) para no depender de si React ya aplicó o no el cambio
  // de onCambiar de esa misma pulsación.
  onFinalizar,
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
  // Filtro de posición (petición directa) — independiente del de Equipo,
  // no se resetea al cambiar de equipo ni de subcategoría de jugador: si
  // ya buscabas "Delanteros", tiene sentido que se quede así al mirar
  // otro mercado o el otro equipo. Solo se usa de verdad en las
  // categorías de SUBCATS_JUGADOR_SIN_PORTEROS (ver filtrarPorPosicion).
  const [posicionFiltro, setPosicionFiltro] = useState("todas");
  const [busqueda, setBusqueda] = useState("");

  // Ruta (categoría → subcategoría → Local/Visitante) de la selección ya
  // guardada, para abrir el árbol justo donde vive — se calcula una sola
  // vez aquí y se reutiliza en los tres useState de abajo.
  // Petición directa: sin selección previa, ninguno de los tres niveles
  // arranca con nada elegido (antes se abría directo en la primera
  // categoría/subcategoría) — mismo principio de "crece progresivamente"
  // que ya tiene BuscadorEvento.jsx: solo se ven las pestañas de
  // categoría, y las de subcategoría/la lista de opciones van apareciendo
  // según se elige cada nivel, nunca antes.
  const rutaInicial =
    seleccion && seleccion !== OTRO ? rutaEnArbol(seleccion) : null;
  const [topActiva, setTopActiva] = useState(
    () => (seleccion === OTRO ? OTRO : rutaInicial?.categoriaId ?? null)
  );
  const [subActiva, setSubActiva] = useState(() => rutaInicial?.subcategoriaId ?? null);
  const [nivel3Activa, setNivel3Activa] = useState(() => rutaInicial?.nivel3Id ?? null);
  // 4º nivel (petición directa, p.ej. Goles/Córners "por equipo y mitad":
  // mitad → Over/Under) — mismo principio de crecimiento progresivo que
  // los otros tres, sin auto-elegir nada.
  const [nivel4Activa, setNivel4Activa] = useState(() => rutaInicial?.nivel4Id ?? null);

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
  const jugadoresLocalFiltrados = filtrarPorPosicion(jugadoresLocal, subActiva, posicionFiltro);
  const jugadoresVisitanteFiltrados = filtrarPorPosicion(jugadoresVisitante, subActiva, posicionFiltro);
  // Solo se ofrece el filtro de posición donde tiene sentido (mismo
  // criterio que ya excluye porteros ahí): en "Paradas" ya son todo
  // porteros, y en "Tarjetas" puede salir cualquiera sin distinción.
  const mostrarFiltroPosicion = SUBCATS_JUGADOR_SIN_PORTEROS.has(subActiva);
  const gruposJugadores = [
    ...(jugadoresLocalFiltrados.length > 0
      ? [
          {
            etiqueta: equipos.local,
            opciones: jugadoresLocalFiltrados.map((j) => ({ valor: j.nombre, texto: j.nombre })),
          },
        ]
      : []),
    ...(jugadoresVisitanteFiltrados.length > 0
      ? [
          {
            etiqueta: equipos.visitante,
            opciones: jugadoresVisitanteFiltrados.map((j) => ({ valor: j.nombre, texto: j.nombre })),
          },
        ]
      : []),
  ];
  const hayPlantilla = gruposJugadores.length > 0;

  function elegirTop(id) {
    setTopActiva(id);
    // Sin auto-elegir la primera subcategoría (crecimiento progresivo):
    // hace falta tocarla a propósito, igual que país no auto-elige
    // competición en BuscadorEvento.jsx. Excepción: una categoría con una
    // única subcategoría (p.ej. "Equipo que clasifica", solo 2 mercados)
    // no tiene nada que elegir ahí — se auto-selecciona sola, para no
    // obligar a un clic sin sentido en una pestaña que no ofrece ninguna
    // alternativa.
    const nodo = ARBOL_MERCADOS.find((c) => c.id === id);
    setSubActiva(nodo?.subcategorias.length === 1 ? nodo.subcategorias[0].id : null);
    setNivel3Activa(null);
    setNivel4Activa(null);
  }

  function elegirSub(id) {
    setSubActiva(id);
    setNivel3Activa(null);
    setNivel4Activa(null);
  }

  function elegirNivel3(id) {
    setNivel3Activa(id);
    setNivel4Activa(null);
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
    if (!opcion) return;
    const texto = opcion.texto(equipos, jugadorTexto);
    onCambiar(texto);
    if (colapsarAlElegir) {
      setExpandido(false);
      onFinalizar?.(texto);
    }
  }

  function elegirOtro(texto) {
    setSeleccion(OTRO);
    onCambiar(texto);
  }

  const resultadosBusqueda = busqueda.trim() ? buscarEnArbol(busqueda, equipos) : [];

  const subNode = topNode?.subcategorias.find((s) => s.id === subActiva) ?? null;
  const tieneNivel3 = !!(subNode && subNode.subcategorias);
  // Sin reserva al primer Local/Visitante (crecimiento progresivo): la
  // lista de opciones no aparece hasta que se elige a propósito, ni
  // siquiera en las subcategorías con este tercer nivel.
  const nivel3Node = tieneNivel3
    ? subNode.subcategorias.find((n) => n.id === nivel3Activa) ?? null
    : null;
  // 4º nivel (p.ej. mitad → Over/Under) — mismo patrón que tieneNivel3,
  // un escalón más abajo.
  const tieneNivel4 = !!(nivel3Node && nivel3Node.subcategorias);
  const nivel4Node = tieneNivel4
    ? nivel3Node.subcategorias.find((n) => n.id === nivel4Activa) ?? null
    : null;
  const opcionesActuales = tieneNivel4
    ? nivel4Node?.opciones ?? []
    : tieneNivel3
    ? nivel3Node?.opciones ?? []
    : subNode?.opciones ?? [];

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
                onClick={() => {
                  setExpandido(false);
                  onFinalizar?.(valor);
                }}
                disabled={!(seleccion === OTRO && valor.trim())}
                className="text-xs font-semibold text-gold border border-gold/40 rounded-full px-3 py-1 hover:bg-gold/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Listo
              </button>
            </div>
          )}

          {/* compacto: pestañas más pequeñas sobre fondo propio (paperDim)
              — se nota de un vistazo que es un nivel anidado dentro de las
              de categoría, no una fila más al mismo nivel. Con una única
              subcategoría (ver elegirTop) no hay nada que elegir, así que
              tampoco se muestra la fila — solo estorbaría. */}
          {topNode && topActiva !== OTRO && topNode.subcategorias.length > 1 && (
            <TabsDesplazables
              opciones={topNode.subcategorias.map((s) => ({ valor: s.id, texto: s.etiqueta }))}
              valor={subActiva}
              onElegir={elegirSub}
              colorActivo="gold"
              compacto
            />
          )}

          {/* Petición directa: antes era una fila de botones a mano, sin
              scroll — con etiquetas largas o más de 2-3 opciones se salía
              del panel en móvil en vez de deslizar. TabsDesplazables ya
              trae ese scroll (flechas, desvanecido, deslizado táctil)
              resuelto, mismo patrón que el nivel2 de arriba. */}
          {tieneNivel3 && (
            <TabsDesplazables
              opciones={subNode.subcategorias.map((n) => ({ valor: n.id, texto: n.etiqueta }))}
              valor={nivel3Activa}
              onElegir={elegirNivel3}
              colorActivo="gold"
              compacto
            />
          )}

          {/* 4º nivel (p.ej. Goles/Córners "por equipo y mitad": mitad →
              Over/Under) — mismo componente que el nivel3 de arriba, ya
              deslizante; pierde el matiz de "un pelín más pequeño todavía"
              que tenía la versión a mano, pero gana el scroll. */}
          {tieneNivel4 && (
            <TabsDesplazables
              opciones={nivel3Node.subcategorias.map((n) => ({ valor: n.id, texto: n.etiqueta }))}
              valor={nivel4Activa}
              onElegir={setNivel4Activa}
              colorActivo="gold"
              compacto
            />
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
              {mostrarFiltroPosicion && (
                <div>
                  <label className="block text-xs text-slate mb-1">Posición</label>
                  <TabsDesplazables
                    opciones={POSICIONES_CAMPO.map(({ valor, etiqueta }) => ({ valor, texto: etiqueta }))}
                    valor={posicionFiltro}
                    onElegir={setPosicionFiltro}
                    colorActivo="gold"
                    compacto
                  />
                </div>
              )}
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
