import { useState } from "react";
import { ChevronDown, Search, Clock } from "lucide-react";
import {
  TABLAS_MERCADO,
  tablaOverUnder,
  textoJugador,
  tablaMarcadorExacto,
  tablaDescansoFinal,
  opcionesHandicap,
  TARJETAS_JUGADOR,
  escudoUrl,
} from "../utils/mercados";
import { usePlantilla } from "../hooks/usePlantilla";
import { normalizarTexto } from "../utils/texto";

// Fase 3 del rediseño v3 de "Nueva apuesta" (ver PROMPT_NUEVA_APUESTA_V3.md):
// lista plana de paneles de mercado (acordeón, sin navegar fuera) para el
// partido activo. Cada opción tiene 3 estados: normal, pendiente (ámbar,
// todavía sin confirmar en la Fase 4) y confirmada (borde verde, ya en el
// ticket de ese mismo partido).
const FILAS_INICIALES_JUGADOR = 5;

// Solo para esta vista previa: si usePlantilla.js no consigue jugadores
// reales (hace falta `vercel dev`, no `vite` a secas), se usan estos de
// ejemplo. Se quita en cuanto esto se conecte a un partido real.
// "posicion" con los mismos valores que da la API real (api/jugadores.js:
// "Goalkeeper"/"Defender"/"Midfielder"/"Attacker") — hace falta para que
// el filtro de posición nuevo también funcione en modo demo.
const JUGADORES_DEMO = {
  local: [
    { id: -1, nombre: "Thibaut Courtois", posicion: "Goalkeeper" },
    { id: -2, nombre: "Dani Carvajal", posicion: "Defender" },
    { id: -3, nombre: "Aurélien Tchouaméni", posicion: "Midfielder" },
    { id: -4, nombre: "Jude Bellingham", posicion: "Midfielder" },
    { id: -5, nombre: "Vinícius Júnior", posicion: "Attacker" },
    { id: -6, nombre: "Kylian Mbappé", posicion: "Attacker" },
  ],
  visitante: [
    { id: -11, nombre: "Marc-André ter Stegen", posicion: "Goalkeeper" },
    { id: -12, nombre: "Jules Koundé", posicion: "Defender" },
    { id: -13, nombre: "Pedri", posicion: "Midfielder" },
    { id: -14, nombre: "Frenkie de Jong", posicion: "Midfielder" },
    { id: -15, nombre: "Raphinha", posicion: "Attacker" },
    { id: -16, nombre: "Robert Lewandowski", posicion: "Attacker" },
  ],
};

// Filtro de posición (petición directa, para no tener que mirar toda la
// plantilla): mismo criterio que ya usaba SelectorMercado.jsx — se excluye
// siempre al portero (rara vez apuestas de este tipo lo incluyen), y
// "Todas"/Defensas/Centrocampistas/Delanteros filtra el resto. El mercado
// de Paradas (soloPorteros, ver TARJETAS_JUGADOR) no usa esto — ahí ya son
// todo porteros, el filtro no aportaría nada.
const PORTERO = "Goalkeeper";
const POSICIONES_CAMPO = [
  { valor: "todas", etiqueta: "Todas", posicionApi: null },
  { valor: "defensa", etiqueta: "Defensas", posicionApi: "Defender" },
  { valor: "centrocampista", etiqueta: "Centrocampistas", posicionApi: "Midfielder" },
  { valor: "delantero", etiqueta: "Delanteros", posicionApi: "Attacker" },
];
function filtrarPorPosicion(jugadores, soloPorteros, posicionFiltro) {
  if (soloPorteros) return jugadores.filter((j) => j.posicion === PORTERO);
  const sinPortero = jugadores.filter((j) => j.posicion !== PORTERO);
  const posicionApi = POSICIONES_CAMPO.find((p) => p.valor === posicionFiltro)?.posicionApi;
  return posicionApi ? sinPortero.filter((j) => j.posicion === posicionApi) : sinPortero;
}

function lineaDeId(id) {
  const m = id.match(/-([\d.]+)$/);
  return m ? m[1] : "";
}

// Botón de una opción, mismo componente en varias tablas para que el
// tricolor normal/pendiente/confirmada se vea siempre igual.
function BotonOpcion({ opcion, equipos, pendiente, confirmada, onClick, icono = "●" }) {
  if (!opcion) {
    return <span className="h-8 lg:h-9 w-full flex items-center justify-center text-slate/40">—</span>;
  }
  return (
    <button
      type="button"
      title={opcion.texto(equipos)}
      onClick={onClick}
      className={`h-8 lg:h-9 w-full rounded flex items-center justify-center text-xs lg:text-sm font-medium transition-colors ${
        confirmada
          ? "border-2 border-win text-win bg-win/10"
          : pendiente
          ? "bg-gold text-feltDark font-semibold"
          : "border border-line text-slate hover:border-gold/40 hover:text-ink"
      }`}
    >
      {icono}
    </button>
  );
}

// Botón de texto visible (marcador exacto, descanso/final, hándicap): a
// diferencia de BotonOpcion (icono ● en una rejilla con cabeceras), aquí el
// propio texto corto ("1/X", "3-1", "-1.5") ES la etiqueta, sin cabecera
// de columna que lo explique.
function BotonTexto({ texto, pendiente, confirmada, onClick, children, className = "" }) {
  return (
    <button
      type="button"
      title={texto}
      onClick={onClick}
      className={`px-1.5 lg:px-2 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-mono font-semibold text-center border transition-colors ${
        confirmada
          ? "border-2 border-win text-win bg-win/10"
          : pendiente
          ? "bg-gold text-feltDark border-gold"
          : "border-line text-slate hover:border-gold/40 hover:text-ink"
      } ${className}`}
    >
      {children}
    </button>
  );
}

// "onAbrir" (opcional): avisa la PRIMERA vez que se despliega (no en cada
// toque) — lo usa TarjetaJugadorMercado para no pedir la plantilla del
// equipo hasta que el usuario de verdad abre esa tarjeta, en vez de
// pedirla ya al montar el panel de Mercados aunque la tarjeta siga
// plegada (petición directa, tras detectar en el dashboard de
// API-Football que las plantillas se pedían solas sin tocar nada).
function Acordeon({ etiqueta, children, onAbrir }) {
  const [abierta, setAbierta] = useState(false);
  return (
    <div className="rounded-xl border border-line bg-surface overflow-hidden">
      <button
        type="button"
        onClick={() =>
          setAbierta((a) => {
            const siguiente = !a;
            if (siguiente) onAbrir?.();
            return siguiente;
          })
        }
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-ink">{etiqueta}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate transition-transform ${abierta ? "rotate-180" : ""}`}
        />
      </button>
      {abierta && <div className="border-t border-line px-3 pb-3 pt-3">{children(setAbierta)}</div>}
    </div>
  );
}

function TarjetaTabla({ etiqueta, tabla, equipos, esPendiente, onToggle, estaConfirmada }) {
  const multiFila = tabla.filas.length > 1;
  const nCols = tabla.columnas.length;
  const plantilla = multiFila ? `1.2fr repeat(${nCols}, 1fr)` : `repeat(${nCols}, 1fr)`;
  return (
    <Acordeon etiqueta={etiqueta}>
      {() => (
        <>
          <div
            className="grid gap-1.5 lg:gap-2 text-[10px] lg:text-xs font-semibold text-slate uppercase tracking-wide px-3 py-1.5"
            style={{ gridTemplateColumns: plantilla }}
          >
            {multiFila && <span />}
            {tabla.columnas.map((c) => (
              <span key={c.clave} className="text-center leading-tight break-words">
                {c.etiqueta}
              </span>
            ))}
          </div>
          <div className="divide-y divide-line">
            {tabla.filas.map((fila, i) => (
              <div
                key={`${fila.equipoClave ?? fila.etiqueta ?? i}${fila.sufijoEtiqueta ?? ""}`}
                className="grid gap-1.5 lg:gap-2 items-center px-3 py-2"
                style={{ gridTemplateColumns: plantilla }}
              >
                {multiFila && (
                  <span className="h-8 lg:h-9 flex items-center text-xs lg:text-sm text-ink truncate">
                    {fila.equipoClave
                      ? `${equipos[fila.equipoClave]}${fila.sufijoEtiqueta ?? ""}`
                      : fila.etiqueta}
                  </span>
                )}
                {tabla.columnas.map((c) => {
                  const opcion = fila.celdas[c.clave];
                  const texto = opcion?.texto(equipos);
                  // Grupo excluyente = esta fila: Local/Empate/Visitante (o
                  // Sí/No) son mutuamente excluyentes entre sí, solo puede
                  // haber una marcada a la vez en la misma fila.
                  const grupo = `${etiqueta}::${fila.equipoClave ?? fila.etiqueta ?? i}::${fila.sufijoEtiqueta ?? ""}`;
                  return (
                    <BotonOpcion
                      key={c.clave}
                      opcion={opcion}
                      equipos={equipos}
                      pendiente={texto ? esPendiente(texto) : false}
                      confirmada={texto ? estaConfirmada(texto) : false}
                      onClick={() => texto && onToggle(etiqueta, texto, grupo)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </Acordeon>
  );
}

// Ámbito (Partido/Local/Visitante) y periodo (Encuentro/1ª/2ª mitad)
// iguales para los 5 mercados Over/Under (Goles, Córners, Tarjetas,
// Remates, Remates a puerta) — ya hay datos reales para las 15
// combinaciones (mercado × ámbito × periodo), así que no hace falta que
// unos dependan de otros.
const AMBITO_EQUIPO = [
  { valor: "ambos", etiqueta: "Ambos equipos" },
  { valor: "local", etiqueta: null },
  { valor: "visitante", etiqueta: null },
];
const PERIODOS_OU = [
  { valor: "encuentro", etiqueta: "Encuentro" },
  { valor: "1t", etiqueta: "1ª mitad" },
  { valor: "2t", etiqueta: "2ª mitad" },
];

function TarjetaOU({ etiqueta, mercadoId, unidad, equipos, esPendiente, onToggle, estaConfirmada }) {
  const [ambito, setAmbito] = useState("ambos");
  const [periodo, setPeriodo] = useState("encuentro");
  const tabla = tablaOverUnder(mercadoId, ambito, periodo);
  const filas = tabla ? tabla.over.map((over, i) => ({ etiqueta: lineaDeId(over.id), over, under: tabla.under[i] })) : [];

  return (
    <Acordeon etiqueta={etiqueta}>
      {() => (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <select
              value={ambito}
              onChange={(e) => setAmbito(e.target.value)}
              className="w-full rounded-lg border border-line bg-paperDim text-ink text-sm px-3 py-2"
            >
              {AMBITO_EQUIPO.map((a) => (
                <option key={a.valor} value={a.valor}>
                  {a.valor === "ambos" ? a.etiqueta : equipos[a.valor]}
                </option>
              ))}
            </select>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="w-full rounded-lg border border-line bg-paperDim text-ink text-sm px-3 py-2"
            >
              {PERIODOS_OU.map((p) => (
                <option key={p.valor} value={p.valor}>
                  {p.etiqueta}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-1.5 lg:gap-2 text-[10px] lg:text-xs font-semibold text-slate uppercase tracking-wide px-3 py-1.5">
            <span>Línea</span>
            <span className="text-center">Más de</span>
            <span className="text-center">Menos de</span>
          </div>
          <div className="divide-y divide-line">
            {filas.map((f) => {
              const textoMas = f.over.texto(equipos);
              const textoMenos = f.under.texto(equipos);
              // Grupo excluyente = esta línea: "Más de X" y "Menos de X" son
              // mutuamente excluyentes (no tiene sentido marcar las dos).
              const grupo = `${etiqueta}::${ambito}::${periodo}::${f.etiqueta}`;
              return (
                <div key={f.over.id} className="grid grid-cols-3 gap-1.5 lg:gap-2 items-center px-3 py-2">
                  <span className="text-xs lg:text-sm text-ink truncate">
                    {unidad ? `${f.etiqueta} ${unidad}` : f.etiqueta}
                  </span>
                  <BotonOpcion
                    opcion={f.over}
                    equipos={equipos}
                    pendiente={esPendiente(textoMas)}
                    confirmada={estaConfirmada(textoMas)}
                    onClick={() => onToggle(etiqueta, textoMas, grupo)}
                    icono="▲"
                  />
                  <BotonOpcion
                    opcion={f.under}
                    equipos={equipos}
                    pendiente={esPendiente(textoMenos)}
                    confirmada={estaConfirmada(textoMenos)}
                    onClick={() => onToggle(etiqueta, textoMenos, grupo)}
                    icono="▼"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Acordeon>
  );
}

// Cada mercado de Jugador es su propia tarjeta suelta (petición directa:
// "sacar todo" en vez de agruparlo bajo una única tarjeta "Jugador" con
// sub-pestañas). "columnas" es fijo (la mayoría); "periodos" (Remates/
// Remates a puerta) añade además un desplegable Encuentro/1ª mitad/2ª
// mitad que cambia qué juego de columnas se usa — ver TARJETAS_JUGADOR en
// utils/mercados.js.
function TarjetaJugadorMercado({
  etiqueta,
  partido,
  columnas,
  periodos,
  soloPorteros = false,
  equipos,
  esPendiente,
  onToggle,
  estaConfirmada,
}) {
  const [periodo, setPeriodo] = useState("encuentro");
  const [equipoElegido, setEquipoElegido] = useState("local");
  const [verMas, setVerMas] = useState(false);
  // El filtro de posición no se resetea al cambiar de equipo (petición
  // directa, mismo criterio que ya usaba SelectorMercado.jsx): si ya
  // buscabas "Delanteros", tiene sentido que se quede así al mirar el
  // otro equipo.
  const [posicionFiltro, setPosicionFiltro] = useState("todas");
  // No se pide la plantilla hasta que el usuario despliega esta tarjeta
  // (petición directa): antes se pedía ya al montar el panel de Mercados,
  // aunque la tarjeta siguiera plegada — con una docena de mercados de
  // jugador por partido, eso eran hasta 12 peticiones de la MISMA
  // plantilla con solo abrir "Mercados", nunca al usuario tocar nada.
  const [seHaAbierto, setSeHaAbierto] = useState(false);
  const jugadoresLocalApi = usePlantilla(
    seHaAbierto && equipoElegido === "local" ? partido.equipoLocalId : null
  );
  const jugadoresVisitanteApi = usePlantilla(
    seHaAbierto && equipoElegido === "visitante" ? partido.equipoVisitanteId : null
  );
  const jugadoresApi = equipoElegido === "local" ? jugadoresLocalApi : jugadoresVisitanteApi;
  const usandoDemo = jugadoresApi.length === 0;
  const jugadoresSinFiltrar = usandoDemo ? JUGADORES_DEMO[equipoElegido] : jugadoresApi;
  const jugadores = filtrarPorPosicion(jugadoresSinFiltrar, soloPorteros, posicionFiltro);
  const filas = verMas ? jugadores : jugadores.slice(0, FILAS_INICIALES_JUGADOR);
  const columnasActivas = periodos ? periodos[periodo] : columnas;

  return (
    <Acordeon etiqueta={etiqueta} onAbrir={() => setSeHaAbierto(true)}>
      {() => (
        <div className="space-y-3">
          {usandoDemo && (
            <p className="text-xs text-slate">
              No se ha podido cargar la plantilla real (hace falta <code>vercel dev</code>, no{" "}
              <code>vite</code> a secas) — jugadores de ejemplo mientras tanto.
            </p>
          )}
          {periodos && (
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="w-full sm:max-w-[220px] rounded-lg border border-line bg-paperDim text-ink text-sm px-3 py-2"
            >
              <option value="encuentro">Encuentro</option>
              <option value="1t">1ª mitad</option>
              <option value="2t">2ª mitad</option>
            </select>
          )}
          <div className="grid grid-cols-2 gap-2 sm:max-w-[460px]">
            <select
              value={equipoElegido}
              onChange={(e) => {
                setEquipoElegido(e.target.value);
                setVerMas(false);
              }}
              className="w-full rounded-lg border border-line bg-paperDim text-ink text-sm px-3 py-2"
            >
              <option value="local">{equipos.local}</option>
              <option value="visitante">{equipos.visitante}</option>
            </select>
            {!soloPorteros && (
              <select
                value={posicionFiltro}
                onChange={(e) => {
                  setPosicionFiltro(e.target.value);
                  setVerMas(false);
                }}
                className="w-full rounded-lg border border-line bg-paperDim text-ink text-sm px-3 py-2"
              >
                {POSICIONES_CAMPO.map((p) => (
                  <option key={p.valor} value={p.valor}>
                    {p.etiqueta}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="overflow-x-auto -mx-3">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-xs font-semibold text-slate uppercase tracking-wide">
                  <th className="sticky left-0 z-10 bg-surface text-left px-3 py-1.5 whitespace-nowrap">
                    Jugador
                  </th>
                  {columnasActivas.map((c) => (
                    <th key={c.clave} className="px-2 py-1.5 text-center whitespace-nowrap">
                      {c.etiqueta}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filas.length === 0 && (
                  <tr>
                    <td colSpan={columnasActivas.length + 1} className="px-3 py-4 text-sm text-slate text-center">
                      Sin jugadores para ese filtro.
                    </td>
                  </tr>
                )}
                {filas.map((j) => (
                  <tr key={j.id}>
                    <td className="sticky left-0 z-10 bg-surface px-3 py-2 text-sm text-ink whitespace-nowrap">
                      {j.nombre}
                    </td>
                    {columnasActivas.map((c) => {
                      const texto = textoJugador(c.plantillaId, j.nombre);
                      return (
                        <td key={c.clave} className="px-2 py-1 w-20">
                          <BotonOpcion
                            opcion={{ texto: () => texto }}
                            equipos={equipos}
                            pendiente={esPendiente(texto)}
                            confirmada={estaConfirmada(texto)}
                            onClick={() => onToggle(etiqueta, texto)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {jugadores.length > FILAS_INICIALES_JUGADOR && (
            <button
              type="button"
              onClick={() => setVerMas((v) => !v)}
              className="w-full flex items-center justify-center gap-1 text-xs font-semibold text-gold"
            >
              {verMas ? "Ver menos" : "Ver más"}
              <ChevronDown size={14} className={`transition-transform ${verMas ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
      )}
    </Acordeon>
  );
}

function TarjetaOtroMercado({ etiqueta, onToggle }) {
  const [texto, setTexto] = useState("");
  return (
    <Acordeon etiqueta={etiqueta}>
      {() => (
        <div className="flex gap-2">
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribe el mercado tal cual lo puso la casa"
            className="flex-1 border border-line rounded-lg px-3 py-2 text-sm bg-paperDim text-ink"
          />
          <button
            type="button"
            disabled={!texto.trim()}
            onClick={() => {
              onToggle("Otro mercado", texto.trim());
              setTexto("");
            }}
            className="px-4 rounded-lg text-sm font-semibold bg-gold text-feltDark disabled:opacity-50"
          >
            Añadir
          </button>
        </div>
      )}
    </Acordeon>
  );
}

// Descanso/Final: petición directa, notación corta "1/X/2" (1ª mitad /
// final) en vez de una rejilla con cabeceras Local/Empate/Visitante — cada
// botón ya se explica solo, sin tener que cruzar fila+columna.
function TarjetaDescansoFinal({ etiqueta, equipos, esPendiente, onToggle, estaConfirmada }) {
  const combos = tablaDescansoFinal();
  return (
    <Acordeon etiqueta={etiqueta}>
      {() => (
        <div className="grid grid-cols-3 gap-2">
          {combos.map((c) => {
            const texto = c.opcion.texto(equipos);
            return (
              <BotonTexto
                key={c.etiqueta}
                texto={texto}
                pendiente={esPendiente(texto)}
                confirmada={estaConfirmada(texto)}
                onClick={() => onToggle(etiqueta, texto, "descanso-final")}
              >
                {c.etiqueta}
              </BotonTexto>
            );
          })}
        </div>
      )}
    </Acordeon>
  );
}

// Marcador exacto: petición directa, tres columnas (Local/Empate/
// Visitante) con los marcadores agrupados por quién gana, en vez de una
// rejilla 5×5 — "Otro resultado" aparte, a todo lo ancho.
function TarjetaMarcadorExacto({ etiqueta, equipos, esPendiente, onToggle, estaConfirmada }) {
  const tabla = tablaMarcadorExacto();
  const textoOtro = tabla.otro.texto(equipos);
  const columnas = [
    { clave: "local", etiqueta: equipos.local, items: tabla.local },
    { clave: "empate", etiqueta: "Empate", items: tabla.empate },
    { clave: "visitante", etiqueta: equipos.visitante, items: tabla.visitante },
  ];
  const nFilas = Math.max(...columnas.map((c) => c.items.length));

  return (
    <Acordeon etiqueta={etiqueta}>
      {() => (
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-1.5 lg:gap-2 text-[10px] lg:text-xs font-semibold text-slate uppercase tracking-wide px-1">
            {columnas.map((c) => (
              <span key={c.clave} className="text-center leading-tight break-words">
                {c.etiqueta}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: nFilas }).map((_, fila) =>
              columnas.map((c) => {
                const item = c.items[fila];
                if (!item) return <span key={`${c.clave}-${fila}`} />;
                const texto = item.opcion.texto(equipos);
                return (
                  <BotonTexto
                    key={`${c.clave}-${fila}`}
                    texto={texto}
                    pendiente={esPendiente(texto)}
                    confirmada={estaConfirmada(texto)}
                    // Un solo "grupo" para TODA la rejilla: solo puede haber
                    // un marcador exacto correcto en todo el partido.
                    onClick={() => onToggle(etiqueta, texto, "marcador-exacto")}
                  >
                    {item.etiqueta}
                  </BotonTexto>
                );
              })
            )}
          </div>
          <BotonTexto
            texto={textoOtro}
            pendiente={esPendiente(textoOtro)}
            confirmada={estaConfirmada(textoOtro)}
            onClick={() => onToggle(etiqueta, textoOtro, "marcador-exacto")}
            className="w-full"
          >
            Otro resultado
          </BotonTexto>
        </div>
      )}
    </Acordeon>
  );
}

// Hándicap asiático: petición directa, tres columnas (Negativo/0/
// Positivo) en vez de una lista plana — desplegable de equipo encima,
// mismo "grupo" excluyente de siempre (nunca dos líneas del mismo equipo
// a la vez).
function TarjetaHandicap({ etiqueta, equipos, esPendiente, onToggle, estaConfirmada }) {
  const [equipoElegido, setEquipoElegido] = useState("local");
  const grupos = opcionesHandicap(equipoElegido);
  const columnas = [
    { clave: "negativos", etiqueta: "Negativo", items: grupos.negativos },
    { clave: "cero", etiqueta: "0", items: grupos.cero },
    { clave: "positivos", etiqueta: "Positivo", items: grupos.positivos },
  ];
  const nFilas = Math.max(...columnas.map((c) => c.items.length));

  return (
    <Acordeon etiqueta={etiqueta}>
      {() => (
        <div className="space-y-3">
          <select
            value={equipoElegido}
            onChange={(e) => setEquipoElegido(e.target.value)}
            className="w-full sm:max-w-[220px] rounded-lg border border-line bg-paperDim text-ink text-sm px-3 py-2"
          >
            <option value="local">{equipos.local}</option>
            <option value="visitante">{equipos.visitante}</option>
          </select>
          <div className="grid grid-cols-3 gap-1.5 lg:gap-2 text-[10px] lg:text-xs font-semibold text-slate uppercase tracking-wide px-1">
            {columnas.map((c) => (
              <span key={c.clave} className="text-center">
                {c.etiqueta}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto scrollbar-oculto">
            {Array.from({ length: nFilas }).map((_, fila) =>
              columnas.map((c) => {
                const opcion = c.items[fila];
                if (!opcion) return <span key={`${c.clave}-${fila}`} />;
                const texto = opcion.texto(equipos);
                return (
                  <BotonTexto
                    key={opcion.id}
                    texto={texto}
                    pendiente={esPendiente(texto)}
                    confirmada={estaConfirmada(texto)}
                    onClick={() => onToggle(etiqueta, texto, `handicap::${equipoElegido}`)}
                  >
                    {texto.split(": ")[1] ?? texto}
                  </BotonTexto>
                );
              })
            )}
          </div>
        </div>
      )}
    </Acordeon>
  );
}

const jugadorPorClave = Object.fromEntries(TARJETAS_JUGADOR.map((j) => [j.clave, j]));

// Orden pedido explícitamente por el usuario, de arriba abajo. Los 5
// marcados como "(sin pedir, insertado)" no aparecían en la lista que dio
// — no se pidió quitarlos, así que se han dejado en un sitio razonable
// cerca de mercados parecidos en vez de borrarlos.
const ORDERED_CARDS = [
  { tipo: "jugador", cfg: jugadorPorClave["anota-o-asiste"] },
  { tipo: "jugador", cfg: jugadorPorClave["jugador-goles"] },
  { tipo: "jugador", cfg: jugadorPorClave["jugador-asistencias"] },
  { tipo: "jugador", cfg: jugadorPorClave["jugador-tarjetas"] },
  { tipo: "jugador", cfg: jugadorPorClave["jugador-remates-puerta"] },
  { tipo: "jugador", cfg: jugadorPorClave["jugador-remates"] },
  { tipo: "tabla", clave: "resultado", etiqueta: "Resultado" },
  { tipo: "tabla", clave: "favor-contra", etiqueta: "Favor / Contra" },
  { tipo: "tabla", clave: "equipo-clasifica", etiqueta: "Equipo que clasifica" },
  { tipo: "tabla", clave: "metodo-clasificacion", etiqueta: "Método de clasificación" },
  { tipo: "tabla", clave: "ganador-trofeo", etiqueta: "Ganador del trofeo" }, // sin pedir, insertado
  { tipo: "tabla", clave: "doble-oportunidad", etiqueta: "Doble oportunidad" },
  { tipo: "tabla", clave: "empate-no-valido", etiqueta: "Empate no válido" },
  { tipo: "tabla", clave: "ambos-marcan", etiqueta: "Ambos equipos marcan" },
  { tipo: "tabla", clave: "porteria-cero", etiqueta: "Portería a cero" }, // sin pedir, insertado
  { tipo: "ou", clave: "goles", etiqueta: "Total de goles", mercadoId: "goles", unidad: "goles" },
  { tipo: "ou", clave: "corners", etiqueta: "Córners", mercadoId: "corners", unidad: "córners" },
  { tipo: "tabla", clave: "ambos-reciben-tarjeta", etiqueta: "Ambos reciben tarjeta" },
  { tipo: "ou", clave: "tarjetas-ou", etiqueta: "Tarjetas", mercadoId: "tarjetas", unidad: "tarjetas" }, // sin pedir, insertado
  { tipo: "tabla", clave: "equipo-mas", etiqueta: "Equipo — Mayor número" },
  { tipo: "jugador", cfg: jugadorPorClave["jugador-faltas-cometidas"] },
  { tipo: "jugador", cfg: jugadorPorClave["jugador-faltas-recibidas"] },
  { tipo: "jugador", cfg: jugadorPorClave["jugador-entradas"] },
  { tipo: "jugador", cfg: jugadorPorClave["jugador-remates-puerta-cabeza"] },
  { tipo: "jugador", cfg: jugadorPorClave["jugador-remates-puerta-fuera-area"] },
  { tipo: "jugador", cfg: jugadorPorClave["jugador-paradas"] },
  {
    // Petición directa (responsive): sin "unidad" — con "remates a
    // puerta" añadido a cada línea (p.ej. "4.5 remates a puerta") no
    // cabía en móvil; ahora solo se ve la línea ("4.5").
    tipo: "ou",
    clave: "remates-puerta",
    etiqueta: "Total - Remates a puerta",
    mercadoId: "remates-puerta",
    unidad: "",
  },
  { tipo: "ou", clave: "remates", etiqueta: "Total - Remates", mercadoId: "remates", unidad: "" },
  { tipo: "custom", clave: "descanso-final", etiqueta: "Descanso / Final", Componente: TarjetaDescansoFinal },
  { tipo: "custom", clave: "marcador-exacto", etiqueta: "Marcador exacto", Componente: TarjetaMarcadorExacto },
  { tipo: "tabla", clave: "mitad-mas-goles", etiqueta: "Mitad con más goles" },
  { tipo: "tabla", clave: "especiales", etiqueta: "Especiales" },
  { tipo: "tabla", clave: "penalti-encuentro", etiqueta: "Penalti en el encuentro" },
  { tipo: "tabla", clave: "primera-tarjeta", etiqueta: "Primera tarjeta" }, // sin pedir, insertado
  { tipo: "tabla", clave: "tarjeta-roja", etiqueta: "Tarjeta roja" },
  { tipo: "tabla", clave: "margen-victoria", etiqueta: "Margen de victoria" },
  { tipo: "custom", clave: "handicap", etiqueta: "Hándicap Asiático", Componente: TarjetaHandicap },
  { tipo: "otro", clave: "otro", etiqueta: "Otro mercado" },
];

export default function PanelMercados({ partido, equipos, pendientes, onTogglePendiente, estaConfirmada = () => false }) {
  const [busqueda, setBusqueda] = useState("");

  const esPendiente = (texto) => pendientes.some((p) => p.label === texto);

  const objetivo = normalizarTexto(busqueda.trim());
  const visibles = objetivo
    ? ORDERED_CARDS.filter((c) => normalizarTexto(c.etiqueta ?? c.cfg?.etiqueta).includes(objetivo))
    : ORDERED_CARDS;

  return (
    <div className="bg-surface border border-line rounded-xl overflow-hidden flex flex-col">
      {/* En móvil esta cabecera se oculta — se sustituye por la barra
          superior compartida (NuevaApuestaV3.jsx) para no repetir el
          nombre del partido dos veces (petición directa, Fase 6). */}
      {/* Petición directa: escudos + "VS" en vez de solo texto — mismo
          criterio que la barra móvil equivalente (NuevaApuestaV3.jsx). */}
      <div className="hidden lg:block p-4 border-b border-line bg-paperDim">
        <p className="text-center text-xs font-semibold text-gold uppercase tracking-wide">
          {partido.pais} · {partido.competicion}
          {partido.jornada ? ` · ${partido.jornada}` : ""}
        </p>
        <div className="mt-3 flex items-center justify-center gap-3 flex-wrap">
          {escudoUrl(partido.equipoLocalId) && (
            <img src={escudoUrl(partido.equipoLocalId)} alt="" className="w-11 h-11 shrink-0 object-contain" />
          )}
          <h3 className="font-display text-lg text-ink text-center">{equipos.local}</h3>
          <span className="font-display text-sm font-bold text-gold shrink-0">VS</span>
          <h3 className="font-display text-lg text-ink text-center">{equipos.visitante}</h3>
          {escudoUrl(partido.equipoVisitanteId) && (
            <img src={escudoUrl(partido.equipoVisitanteId)} alt="" className="w-11 h-11 shrink-0 object-contain" />
          )}
        </div>
        <div className="mt-3 flex justify-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-gold border border-gold/40 rounded-full px-3 py-1">
            <Clock size={12} />
            Hoy {partido.hora}
            {partido.sede ? ` · ${partido.sede}` : ""}
          </span>
        </div>
      </div>

      <div className="p-3 border-b border-line">
        <div className="flex items-center gap-2 bg-paperDim border border-line rounded-lg px-2.5 py-1.5">
          <Search size={14} className="text-slate shrink-0" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar mercado"
            className="w-full bg-transparent text-sm outline-none text-ink placeholder:text-slate"
          />
        </div>
      </div>

      <div className="p-3 space-y-2">
        {visibles.map((c) => {
          if (c.tipo === "tabla") {
            return (
              <TarjetaTabla
                key={c.clave}
                etiqueta={c.etiqueta}
                tabla={TABLAS_MERCADO[c.clave]}
                equipos={equipos}
                esPendiente={esPendiente}
                onToggle={onTogglePendiente}
                estaConfirmada={estaConfirmada}
              />
            );
          }
          if (c.tipo === "ou") {
            return (
              <TarjetaOU
                key={c.clave}
                etiqueta={c.etiqueta}
                mercadoId={c.mercadoId}
                unidad={c.unidad}
                equipos={equipos}
                esPendiente={esPendiente}
                onToggle={onTogglePendiente}
                estaConfirmada={estaConfirmada}
              />
            );
          }
          if (c.tipo === "jugador") {
            return (
              <TarjetaJugadorMercado
                key={c.cfg.clave}
                etiqueta={c.cfg.etiqueta}
                partido={partido}
                columnas={c.cfg.columnas}
                periodos={c.cfg.periodos}
                soloPorteros={c.cfg.soloPorteros}
                equipos={equipos}
                esPendiente={esPendiente}
                onToggle={onTogglePendiente}
                estaConfirmada={estaConfirmada}
              />
            );
          }
          if (c.tipo === "custom") {
            const Componente = c.Componente;
            return (
              <Componente
                key={c.clave}
                etiqueta={c.etiqueta}
                equipos={equipos}
                esPendiente={esPendiente}
                onToggle={onTogglePendiente}
                estaConfirmada={estaConfirmada}
              />
            );
          }
          return <TarjetaOtroMercado key={c.clave} etiqueta={c.etiqueta} onToggle={onTogglePendiente} />;
        })}
        {visibles.length === 0 && <p className="p-4 text-sm text-slate text-center">Sin mercados para ese filtro.</p>}
      </div>
    </div>
  );
}
