import { useState } from "react";
import { Check, Pencil, Search, X } from "lucide-react";
import {
  CATEGORIAS_MERCADO,
  equiposDesdeEvento,
  buscarMercadoPorTexto,
  interpretarMercadoJugador,
} from "../utils/mercados";
import { normalizarTexto } from "../utils/texto";
import { usePlantilla } from "../hooks/usePlantilla";
import SelectorDesplegable from "./SelectorDesplegable";
import TabsDesplazables from "./TabsDesplazables";

const OTRO = "otro";

function buscarOpcion(valor) {
  const [catId, opId] = valor.split("|");
  return CATEGORIAS_MERCADO.find((c) => c.id === catId)?.opciones.find((o) => o.id === opId) ?? null;
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
  if (deJugador) return `jugador|${deJugador.opcionId}`;
  const encontrado = buscarMercadoPorTexto(valorApuesta, equipos);
  return encontrado ? `${encontrado.categoriaId}|${encontrado.opcionId}` : OTRO;
}

function etiquetaSeleccion(seleccion, equipos, jugadorTexto) {
  if (!seleccion) return "";
  if (seleccion === OTRO) return "Otro mercado";
  const opcion = buscarOpcion(seleccion);
  return opcion ? opcion.texto(equipos, jugadorTexto) : "";
}

const TABS = [...CATEGORIAS_MERCADO.map((c) => ({ valor: c.id, texto: c.etiqueta })), { valor: OTRO, texto: "Otro mercado" }];

// Campo "Apuesta" de una selección (ver FormularioApuesta.jsx): buscador de
// texto libre (filtra en todas las categorías a la vez, agrupando por
// categoría) + pestañas horizontales por categoría debajo — mismo patrón
// que BuscadorEvento.jsx (ver mercado-picker-demo.html, referencia
// aportada por el usuario). Ya no es un desplegable que se abre/cierra:
// el panel entero va siempre visible, más simple de usar que el acordeón
// de antes con muchas categorías.
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
  const [busqueda, setBusqueda] = useState("");
  const [tabActiva, setTabActiva] = useState(() => (seleccion ? seleccion.split("|")[0] : CATEGORIAS_MERCADO[0].id));
  // Bug real (2026-08-10): al elegir un mercado, el panel (buscador +
  // pestañas + lista) se quedaba abierto sin ninguna señal de que ya se
  // había elegido algo. Ahora, elegir una opción lo colapsa a la píldora
  // dorada + "Cambiar mercado" (mismo patrón que el bloque superior de
  // FormularioApuesta.jsx: Confirmar → tira resumen → ✎ Editar). Arranca
  // colapsado si ya había un valor guardado (al editar una selección ya
  // creada), abierto si no.
  const [expandido, setExpandido] = useState(() => !valor);

  // Plantillas de los dos equipos del partido (categoría "Jugador"): solo
  // hay datos si la selección viene de elegir un partido real del
  // buscador (ver BuscadorEvento.jsx / ConstructorPartido.jsx) — con
  // texto libre, o en apuestas de antes de esta función, no hay id de
  // equipo y el campo cae solo al texto libre de más abajo.
  const jugadoresLocal = usePlantilla(equipoLocalId);
  const jugadoresVisitante = usePlantilla(equipoVisitanteId);
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

  function elegir(nuevaSeleccion) {
    setSeleccion(nuevaSeleccion);
    setBusqueda("");
    if (nuevaSeleccion === OTRO) return;
    const opcion = buscarOpcion(nuevaSeleccion);
    if (opcion) onCambiar(opcion.texto(equipos, jugadorTexto));
    setExpandido(false);
  }

  function elegirOtro(texto) {
    setSeleccion(OTRO);
    onCambiar(texto);
  }

  // Resultados del buscador global: recorre todas las categorías (menos
  // "Jugador", cuyo texto no existe sin elegir antes un jugador) buscando
  // coincidencias de texto, agrupadas con su cabecera de categoría — igual
  // que el buscador de BuscadorEvento.jsx agrupa por competición.
  const categoriasConCoincidencias = busqueda.trim()
    ? CATEGORIAS_MERCADO.map((categoria) => ({
        categoria,
        opciones: categoria.requiereJugador
          ? []
          : categoria.opciones.filter((opcion) =>
              normalizarTexto(opcion.texto(equipos)).includes(normalizarTexto(busqueda))
            ),
      })).filter((g) => g.opciones.length > 0)
    : [];

  const categoriaActiva = CATEGORIAS_MERCADO.find((c) => c.id === tabActiva) ?? null;

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
          {categoriasConCoincidencias.length === 0 ? (
            <p className="px-3 py-4 text-sm text-slate text-center">Sin resultados — prueba "Otro mercado"</p>
          ) : (
            categoriasConCoincidencias.map(({ categoria, opciones }) => (
              <div key={categoria.id}>
                <p className="bg-felt px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-gold">
                  {categoria.etiqueta}
                </p>
                {opciones.map((opcion) => {
                  const valorOpcion = `${categoria.id}|${opcion.id}`;
                  return (
                    <button
                      key={opcion.id}
                      type="button"
                      onClick={() => elegir(valorOpcion)}
                      className={`w-full flex items-center justify-between gap-2 px-4 py-2 text-sm border-b border-line/60 last:border-b-0 transition-colors ${
                        seleccion === valorOpcion ? "bg-gold/10 text-gold font-medium" : "text-ink hover:bg-paperDim"
                      }`}
                    >
                      <span className="truncate">{opcion.texto(equipos)}</span>
                      {seleccion === valorOpcion && <Check size={14} className="shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      ) : (
        <>
          <TabsDesplazables opciones={TABS} valor={tabActiva} onElegir={setTabActiva} colorActivo="gold" />

          {tabActiva === OTRO && (
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

          {categoriaActiva?.requiereJugador && (
            <div className="p-3 space-y-2">
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
                {categoriaActiva.opciones.map((opcion) => {
                  const valorOpcion = `${categoriaActiva.id}|${opcion.id}`;
                  return (
                    <button
                      key={opcion.id}
                      type="button"
                      disabled={!jugadorTexto.trim()}
                      onClick={() => elegir(valorOpcion)}
                      className={`w-full flex items-center justify-between gap-2 px-4 py-2 text-sm border-b border-line/60 last:border-b-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        seleccion === valorOpcion ? "bg-gold/10 text-gold font-medium" : "text-ink hover:bg-paperDim"
                      }`}
                    >
                      <span className="truncate">{opcion.texto(equipos, jugadorTexto || "…")}</span>
                      {seleccion === valorOpcion && <Check size={14} className="shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {categoriaActiva && !categoriaActiva.requiereJugador && (
            <div className="max-h-72 overflow-y-auto scrollbar-oculto">
              {categoriaActiva.opciones.map((opcion) => {
                const valorOpcion = `${categoriaActiva.id}|${opcion.id}`;
                return (
                  <button
                    key={opcion.id}
                    type="button"
                    onClick={() => elegir(valorOpcion)}
                    className={`w-full flex items-center justify-between gap-2 px-4 py-2 text-sm border-b border-line/60 last:border-b-0 transition-colors ${
                      seleccion === valorOpcion ? "bg-gold/10 text-gold font-medium" : "text-ink hover:bg-paperDim"
                    }`}
                  >
                    <span className="truncate">{opcion.texto(equipos)}</span>
                    {seleccion === valorOpcion && <Check size={14} className="shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
