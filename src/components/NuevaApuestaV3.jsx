import { useState } from "react";
import { Pencil, ChevronDown, Check, X, ArrowLeft, Clock } from "lucide-react";
import { calcularBankrollPorCasa } from "../utils/movimientos";
import { agruparSeleccionesPorPartido } from "../utils/apuestas";
import { equiposDesdeEvento, escudoUrl, esIdPartidoReal } from "../utils/mercados";
import CampoCasa from "./CampoCasa";
import SelectorFecha from "./SelectorFecha";
import PanelPartidos from "./PanelPartidos";
import PanelMercados from "./PanelMercados";
import PanelConfirmacion from "./PanelConfirmacion";
import TicketFlotante from "./TicketFlotante";

// Formulario real de crear/editar apuestas (ver CHANGELOG.md para el
// porqué del rediseño) — sustituyó al antiguo FormularioApuesta.jsx en
// los tres sitios donde se creaba/editaba una apuesta: "+ Añadir
// apuesta" (cabecera de escritorio y "+" central en móvil, ambos abren
// esto en modo crear) y "Modificar" en una apuesta ya guardada
// (ApuestaItem.jsx, modo editar vía apuestaInicial). Bankroll como
// primer campo, lista de partidos (PanelPartidos.jsx), mercados del
// partido activo (PanelMercados.jsx), ticket flotante con el importe
// (TicketFlotante.jsx).
const DEPORTES = ["Fútbol", "Baloncesto", "Tenis", "eSports", "Otro"];

function hoy() {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(
    ahora.getDate()
  ).padStart(2, "0")}`;
}

// Saldo real total del bankroll (suma de todas las casas) y nº de apuestas
// pendientes — mismos datos que ya usa el resto de la app (calcularBankrollPorCasa,
// utils/movimientos.js), no se inventa ningún cálculo nuevo.
function resumenBankroll(movimientos, apuestas, categoria) {
  const saldo = calcularBankrollPorCasa(movimientos, apuestas, categoria).reduce(
    (total, b) => total + b.bankroll,
    0
  );
  const enJuego = apuestas.filter((a) => a.categoria === categoria && a.resultado === "pendiente").length;
  return { saldo, enJuego };
}

// Fase "Editar apuesta": reconstruye los "bloques" del ticket (uno por
// partido) a partir de las selecciones ya guardadas — mismo criterio que
// bloquesDesdeApuesta en FormularioApuesta.jsx (misma agrupación,
// agruparSeleccionesPorPartido), adaptado a la forma que usa esta vista
// ("items" en vez de "mercados"). "partido.id" usa -1 si no hay
// partidoId real (apuestas de antes del buscador, o "Otro mercado") —
// seleccionesDeBloque ya trata cualquier id <= 0 como "sin partido real",
// mismo criterio que con los partidos de ejemplo de PanelPartidos.jsx.
// Cada item conserva resultado/avisoEnviado/golesManual de la selección
// original — perderlos al guardar borraría en silencio la pastilla de
// resultado ya marcada de ese partido (mismo bug que ya se corrigió una
// vez en FormularioApuesta.jsx).
function bloquesDesdeApuestaV3(apuestaInicial) {
  if (!apuestaInicial) return [];
  return agruparSeleccionesPorPartido(apuestaInicial.selecciones).map((grupo) => ({
    matchId: grupo.partidoId ?? null,
    partido: {
      id: grupo.partidoId ?? -1,
      evento: grupo.evento,
      pais: grupo.pais ?? "",
      competicion: grupo.competicion ?? "",
      hora: grupo.hora ?? "",
      fecha: grupo.fecha ?? null,
      equipoLocalId: grupo.equipoLocalId ?? null,
      equipoVisitanteId: grupo.equipoVisitanteId ?? null,
      escudoLocal: grupo.escudoLocal ?? null,
      escudoVisitante: grupo.escudoVisitante ?? null,
    },
    cuota: String(grupo.cuota),
    stake: "",
    stakeFreebet: "",
    items: grupo.selecciones.map((s) => ({
      mercado: "",
      label: s.apuesta,
      grupo: null,
      resultado: s.resultado,
      avisoEnviado: s.avisoEnviado ?? null,
      golesLocalManual: s.golesLocalManual ?? null,
      golesVisitanteManual: s.golesVisitanteManual ?? null,
    })),
  }));
}

export default function NuevaApuestaV3({
  casas,
  apuestas,
  movimientos,
  onGuardarApuesta,
  onAjustarSaldoFreebet,
  // "Editar apuesta" (petición directa): con apuestaInicial, el ticket
  // arranca ya cargado con sus partidos/mercados/cuota, y "Guardar"
  // actualiza esa MISMA apuesta (onEditarApuesta) en vez de crear una o
  // varias nuevas. onCancelar vuelve a la sección de la que se venía (ver
  // App.jsx, "seccionAnterior") — se usa tanto al cancelar una edición
  // como al salir de crear sin guardar.
  apuestaInicial = null,
  onEditarApuesta,
  ligasFijadas,
  onAlternarLigaFijada,
  onCancelar,
}) {
  const esEdicion = apuestaInicial !== null;
  const [bankroll, setBankroll] = useState(() => apuestaInicial?.categoria ?? "apuestas");
  const [fecha, setFecha] = useState(() => apuestaInicial?.fecha ?? hoy());
  const [casa, setCasa] = useState(() => apuestaInicial?.casa ?? "");
  const [tipoFondos, setTipoFondos] = useState(() => apuestaInicial?.tipoFondos ?? "real");
  const [titulo, setTitulo] = useState(() => apuestaInicial?.titulo ?? "");
  const [deporte, setDeporte] = useState(() => apuestaInicial?.deporte ?? "Fútbol");
  const [asegurada, setAsegurada] = useState(() => !!apuestaInicial?.seguroFreebetImporte);
  const [seguroImporte, setSeguroImporte] = useState(() =>
    apuestaInicial?.seguroFreebetImporte ? String(apuestaInicial.seguroFreebetImporte) : ""
  );
  const [conAumento, setConAumento] = useState(() => !!apuestaInicial?.aumentoPct);
  const [aumentoPct, setAumentoPct] = useState(() =>
    apuestaInicial?.aumentoPct ? String(apuestaInicial.aumentoPct) : ""
  );
  const [extrasAbiertas, setExtrasAbiertas] = useState(false);
  const [confirmado, setConfirmado] = useState(esEdicion);
  // Fase 2: partido activo (Ventana 1).
  const [matchActivo, setMatchActivo] = useState(null);
  // Fase 3: selecciones marcadas en Mercados, del partido activo, aún sin
  // cuota — se descartan al cambiar de partido.
  const [pendientes, setPendientes] = useState([]);
  // Fase 4: bloques ya confirmados (partido + cuota + selecciones). Cada
  // uno pasará a ser una fila del ticket en la Fase 5 — de momento solo se
  // acumulan aquí. Al editar, arranca con los partidos ya guardados.
  const [bloques, setBloques] = useState(() => bloquesDesdeApuestaV3(apuestaInicial));
  // Solo se usan al editar (ver guardarEdicion): a diferencia de crear,
  // una apuesta ya existente es SIEMPRE una sola (nunca "varias
  // sencillas + una combinada" a la vez), así que un único importe le
  // basta — mismo campo que cantidadApostada/cantidadFreebetMixta en
  // FormularioApuesta.jsx.
  const [stakeEdicion, setStakeEdicion] = useState(() => (apuestaInicial ? String(apuestaInicial.stake) : ""));
  const [stakeFreebetEdicion, setStakeFreebetEdicion] = useState(() =>
    apuestaInicial?.stakeFreebet ? String(apuestaInicial.stakeFreebet) : ""
  );
  // Fase 6 (móvil): 0=Partido, 1=Mercados, 2=Confirmar. En escritorio no
  // se usa para nada (las 3 ventanas se ven a la vez), solo decide qué
  // panel se ve en la pantalla estrecha.
  const [paso, setPaso] = useState(0);
  // Ticket de edición: arranca colapsado, igual que TicketFlotante (bug
  // real: sin esto ocupaba toda la pantalla de golpe, tapando el panel de
  // Mercados, sin ninguna forma de cerrarlo).
  const [ticketEdicionAbierto, setTicketEdicionAbierto] = useState(false);

  function elegirPartido(partido) {
    setMatchActivo(partido);
    setPendientes([]);
    setPaso(1);
    // Bug real (solo en pantallas estrechas, por debajo de "lg"): el
    // ticket de edición, si se había abierto para revisar los partidos ya
    // metidos, es un recuadro fijo que puede ocupar casi toda la pantalla
    // — tapaba el panel de Mercados/Confirmación (incluida la casilla de
    // la cuota), así que marcar un mercado nuevo parecía "no dejar poner
    // la cuota". Se cierra solo al elegir partido, para dejar sitio.
    setTicketEdicionAbierto(false);
  }

  function confirmarSeleccion(cuota) {
    if (!matchActivo || pendientes.length === 0) return;
    setBloques((actuales) => {
      // Bug real: volver a elegir un partido que YA tenía bloque (p.ej.
      // al editar una apuesta, añadir un mercado más a un partido que ya
      // estaba en el ticket) creaba un bloque NUEVO y duplicado para el
      // mismo partido, con su propia cuota en blanco — el partido
      // original se quedaba tal cual, así que el mercado nuevo parecía
      // "no añadirse". Se identifica el "mismo partido" por su id real
      // cuando los DOS lados lo tienen (dos partidos reales con id
      // distinto nunca se mezclan, aunque compartan equipos — dos
      // partidos del mismo día entre los mismos rivales, por ejemplo).
      // Si cualquiera de los dos lados no tiene un id real (apuestas de
      // antes del buscador de partidos, reconstruidas con el id de
      // repuesto -1 en bloquesDesdeApuestaV3 — o, en local sin
      // `vercel dev`, los partidos de ejemplo de PanelPartidos.jsx, que
      // por su cuenta también usan ids negativos), se compara por el
      // texto del evento en su lugar: ese id de repuesto es ambiguo
      // (vale para cualquier partido sin id real), así que comparar por
      // id ahí habría dejado sin fusionar justo el caso más común —
      // apuestas antiguas. Encontrado el bloque, sus selecciones nuevas
      // se añaden a él; la cuota tecleada aquí es la de ESTA selección
      // nueva sola (mismo criterio que pide PanelConfirmacion, "Cuota de
      // esta selección"), así que se MULTIPLICA por la que ya tenía el
      // bloque en vez de sustituirla — igual que entre partidos
      // distintos la cuota total ya se calcula multiplicando cada
      // bloque.
      const indiceExistente = actuales.findIndex((b) =>
        esIdPartidoReal(matchActivo.id) && esIdPartidoReal(b.matchId)
          ? b.matchId === matchActivo.id
          : b.partido.evento === matchActivo.evento
      );
      if (indiceExistente === -1) {
        return [
          ...actuales,
          {
            matchId: matchActivo.id,
            partido: matchActivo,
            cuota: String(cuota),
            stake: "",
            // Solo se usa con tipoFondos "mixta" (ver CampoCuotaCantidad en
            // TicketFlotante.jsx) — con "real"/"freebet" se queda vacío y no
            // se manda al guardar.
            stakeFreebet: "",
            items: pendientes,
          },
        ];
      }
      // Bug real: al fusionar, la cuota tecleada SUSTITUÍA a la que ya
      // tenía el bloque (2.00 de "Gana Real Madrid" + escribir 5 se
      // quedaba en 5, en vez de multiplicarse) — igual que entre
      // partidos distintos la cuota total ya se calcula multiplicando
      // cada bloque (ver cuotaComboAutoEdicion/comboCuota más abajo), la
      // cuota que se copia aquí es la de ESTA selección nueva sola (así
      // lo pide PanelConfirmacion, "Cuota de esta selección"), así que
      // hay que multiplicarla por la que ya tenía el bloque, no
      // reemplazarla.
      return actuales.map((b, i) =>
        i === indiceExistente
          ? { ...b, cuota: String(numero(b.cuota) * cuota), items: [...b.items, ...pendientes] }
          : b
      );
    });
    setPendientes([]);
    setPaso(0);
  }

  function contarSeleccionesDelPartido(matchId) {
    return bloques
      .filter((b) => b.matchId === matchId)
      .reduce((total, b) => total + b.items.length, 0);
  }

  function estaConfirmada(texto) {
    return bloques.some(
      (b) => b.matchId === matchActivo?.id && b.items.some((it) => it.label === texto)
    );
  }

  // Fase 5: ticket flotante. "comboCuota"/"comboStake" solo se usan con 2+
  // bloques (la fila Doble/Triple/…). Opción B decidida con el usuario:
  // cada bloque suelto conserva su propia cantidad — al guardar (Fase 7),
  // eso podrá crear varias apuestas de una vez, no solo una.
  const [comboCuota, setComboCuota] = useState(() =>
    apuestaInicial?.cuotaTotalManual ? String(apuestaInicial.cuotaTotalManual) : ""
  );
  const [comboStake, setComboStake] = useState("");
  const [comboStakeFreebet, setComboStakeFreebet] = useState("");
  const [avisoGuardado, setAvisoGuardado] = useState(null);

  function quitarBloque(index) {
    setBloques((actuales) => actuales.filter((_, i) => i !== index));
    setComboCuota("");
  }

  function quitarItemDeBloque(bloqueIndex, itemIndex) {
    setBloques((actuales) => {
      const bloque = actuales[bloqueIndex];
      const items = bloque.items.filter((_, i) => i !== itemIndex);
      // Borrar la última selección de un bloque elimina el bloque entero.
      if (items.length === 0) return actuales.filter((_, i) => i !== bloqueIndex);
      return actuales.map((b, i) => (i === bloqueIndex ? { ...b, items } : b));
    });
    setComboCuota("");
  }

  function cambiarCuotaBloque(index, valor) {
    setBloques((actuales) => actuales.map((b, i) => (i === index ? { ...b, cuota: valor } : b)));
    setComboCuota("");
  }

  function cambiarStakeBloque(index, valor) {
    setBloques((actuales) => actuales.map((b, i) => (i === index ? { ...b, stake: valor } : b)));
  }

  function cambiarStakeFreebetBloque(index, valor) {
    setBloques((actuales) => actuales.map((b, i) => (i === index ? { ...b, stakeFreebet: valor } : b)));
  }

  function rellenarCantidad(valor) {
    if (bloques.length > 1) {
      setComboStake(valor);
    } else {
      setBloques((actuales) => actuales.map((b, i) => (i === 0 ? { ...b, stake: valor } : b)));
    }
  }

  // Fase 7: conexión real con Supabase (onGuardarApuesta = agregarApuesta
  // tal cual, sin categoria todavía puesta — se añade aquí). Cada
  // selección de un bloque se aplana con el mismo criterio que ya usa
  // FormularioApuesta.jsx: la primera lleva la cuota real del bloque
  // (la que dio la casa por ese partido), el resto cuenta como 1 en el
  // producto — así calcularCuotaTotal (utils/apuestas.js) no cambia.
  // "partidoId" solo se guarda si es un id real de API-Football (los
  // partidos de ejemplo de PanelPartidos.jsx usan ids negativos de
  // mentira, que no deben acabar en Supabase).
  function seleccionesDeBloque(b) {
    return b.items.map((item, i) => ({
      evento: b.partido.evento,
      apuesta: item.label,
      cuota: i === 0 ? Number(String(b.cuota).replace(",", ".")) : 1,
      pais: b.partido.pais || null,
      competicion: b.partido.competicion || null,
      partidoId: esIdPartidoReal(b.partido.id) ? b.partido.id : null,
      equipoLocalId: b.partido.equipoLocalId ?? null,
      equipoVisitanteId: b.partido.equipoVisitanteId ?? null,
      escudoLocal: b.partido.escudoLocal ?? null,
      escudoVisitante: b.partido.escudoVisitante ?? null,
      hora: b.partido.hora || null,
      fecha: b.partido.fecha || fecha || null,
      // Solo tienen valor real al editar una selección ya existente (ver
      // bloquesDesdeApuestaV3) — al crear, "item" no los trae, así que se
      // quedan en null/undefined, igual que siempre. Sin esto, guardar
      // una edición borraría en silencio el resultado ya marcado de ese
      // partido (mismo bug ya corregido una vez en FormularioApuesta.jsx).
      golesLocalManual: item.golesLocalManual ?? null,
      golesVisitanteManual: item.golesVisitanteManual ?? null,
      avisoEnviado: item.avisoEnviado ?? null,
      resultado: item.resultado,
    }));
  }

  // Editar apuesta: a diferencia de crear (donde el ticket puede convertirse
  // en varias apuestas nuevas de una vez), una apuesta ya existente es y
  // sigue siendo UNA sola — se actualiza (onEditarApuesta), nunca se crean
  // registros nuevos. Los bloques aquí son sus partidos (se pueden añadir/
  // quitar partidos o mercados, cambiar cuota...), pero el importe es un
  // único campo aparte (stakeEdicion/stakeFreebetEdicion), no por bloque.
  async function guardarEdicion() {
    if (bloques.length === 0) {
      setAvisoGuardado({ error: "La apuesta necesita al menos un partido." });
      return;
    }
    if (!(Number(stakeEdicion) > 0)) {
      setAvisoGuardado({ error: "Pon la cantidad apostada." });
      return;
    }
    try {
      await onEditarApuesta(apuestaInicial.id, {
        fecha,
        casa,
        stake: stakeEdicion,
        stakeFreebet: tipoFondos === "mixta" ? Number(stakeFreebetEdicion) || 0 : null,
        tipoFondos,
        deporte,
        titulo: titulo.trim() ? titulo.trim() : null,
        seguroFreebetImporte: asegurada ? Number(seguroImporte) : null,
        aumentoPct: conAumento ? Number(aumentoPct) : null,
        // Igual que al crear: solo manda un valor si el usuario lo ha
        // tocado, y solo tiene sentido con 2+ partidos (una combinada).
        cuotaTotalManual:
          bloques.length > 1 && comboCuota.trim() !== "" ? Number(comboCuota.replace(",", ".")) : null,
        selecciones: bloques.flatMap(seleccionesDeBloque),
      });
      setAvisoGuardado({ ok: 1 });
      onCancelar?.();
    } catch (error) {
      console.error("Error al editar desde Nueva apuesta v3:", error);
      setAvisoGuardado({
        error: `No se pudo guardar: ${error?.message || "error desconocido"}.`,
      });
    }
  }

  // Opción B decidida con el usuario (Fase 5): cada bloque suelto con
  // cantidad crea su propia apuesta sencilla, y si además hay 2+ bloques
  // con cantidad puesta en la combinada, esa es OTRA apuesta aparte — un
  // solo "Guardar apuesta" puede crear varias a la vez. "Mixta" ya guarda
  // de verdad (antes se dejaba fuera a propósito): cada bloque/combinada
  // tiene un segundo campo "Freebet" además de "Real" (ver
  // CampoCuotaCantidad en TicketFlotante.jsx) — se incluye si CUALQUIERA
  // de los dos importes tiene algo, igual que Real/Freebet ya solo miran
  // su único campo. Sin nada de esto en modo edición — ver guardarEdicion.
  async function guardarApuesta() {
    if (esEdicion) return guardarEdicion();
    // Bug real: esto se construía FUERA del try/catch de más abajo — si
    // algo aquí lanzaba una excepción (por ejemplo un dato inesperado en
    // algún bloque), la función entera fallaba en silencio (una promesa
    // rechazada sin capturar no muestra nada en pantalla) y el botón
    // parecía "no hacer nada". Ahora todo el cuerpo va dentro del mismo
    // try, así cualquier fallo (aquí o al guardar) se ve en el aviso.
    try {
      const porGuardar = [];
      for (const b of bloques) {
        if (Number(b.stake) > 0 || Number(b.stakeFreebet) > 0) {
          porGuardar.push({
            stake: b.stake || 0,
            stakeFreebet: tipoFondos === "mixta" ? Number(b.stakeFreebet) || 0 : null,
            selecciones: seleccionesDeBloque(b),
            cuotaTotalManual: null,
          });
        }
      }
      if (bloques.length > 1 && (Number(comboStake) > 0 || Number(comboStakeFreebet) > 0)) {
        porGuardar.push({
          stake: comboStake || 0,
          stakeFreebet: tipoFondos === "mixta" ? Number(comboStakeFreebet) || 0 : null,
          selecciones: bloques.flatMap(seleccionesDeBloque),
          // Solo se manda como manual si el usuario ha tocado el campo — si
          // no, se deja calcular sola (y se reajusta si luego se anula un
          // partido), ver comentario de calcularCuotaTotal.
          cuotaTotalManual: comboCuota.trim() !== "" ? Number(comboCuota.replace(",", ".")) : null,
        });
      }
      if (porGuardar.length === 0) return;

      for (const datos of porGuardar) {
        await onGuardarApuesta({
          fecha,
          casa,
          stake: datos.stake,
          stakeFreebet: datos.stakeFreebet,
          categoria: bankroll,
          tipoFondos,
          deporte,
          titulo: titulo.trim() ? titulo.trim() : null,
          seguroFreebetImporte: asegurada ? Number(seguroImporte) : null,
          aumentoPct: conAumento ? Number(aumentoPct) : null,
          cuotaTotalManual: datos.cuotaTotalManual,
          selecciones: datos.selecciones,
        });
      }

      // Un único ajuste de saldo de freebet con el total (no uno por
      // apuesta): ajustarSaldoFreebet calcula el nuevo saldo a partir del
      // saldo actual en memoria, así que dos llamadas seguidas sin esperar
      // a que se refresque ese estado pisarían el mismo cambio en vez de
      // sumarse — con el total ya sumado de antemano no hay ese riesgo.
      // "Mixta" descuenta solo la parte freebet (datos.stakeFreebet), no
      // el stake real.
      if (tipoFondos === "freebet") {
        const totalFreebet = porGuardar.reduce((total, d) => total + Number(d.stake), 0);
        await onAjustarSaldoFreebet(casa, -totalFreebet, bankroll);
      } else if (tipoFondos === "mixta") {
        const totalFreebet = porGuardar.reduce((total, d) => total + Number(d.stakeFreebet), 0);
        if (totalFreebet > 0) await onAjustarSaldoFreebet(casa, -totalFreebet, bankroll);
      }

      setAvisoGuardado({ ok: porGuardar.length });
      setBloques([]);
      setComboCuota("");
      setComboStake("");
      setComboStakeFreebet("");
    } catch (error) {
      console.error("Error al guardar desde Nueva apuesta v3:", error);
      setAvisoGuardado({
        error: `No se pudo guardar: ${error?.message || "error desconocido"}.`,
      });
    }
  }

  // "grupo" (opcional): identifica una fila/línea con opciones mutuamente
  // excluyentes (Local/Empate/Visitante, Más de/Menos de la misma línea…)
  // — al marcar una nueva del mismo grupo, se desmarca la anterior. Sin
  // grupo (Jugador, Otro mercado), cada opción es independiente.
  function togglePendiente(mercado, label, grupo = null) {
    setPendientes((actuales) => {
      const existe = actuales.some((p) => p.label === label);
      if (existe) return actuales.filter((p) => p.label !== label);
      const sinGrupo = grupo ? actuales.filter((p) => p.grupo !== grupo) : actuales;
      return [...sinGrupo, { mercado, label, grupo }];
    });
    // Mismo motivo que en elegirPartido: si el ticket de edición estaba
    // abierto (revisando los partidos ya metidos) y desde ahí se marca un
    // mercado nuevo sin cambiar de partido, también hay que quitarlo de
    // en medio para llegar a la casilla de la cuota.
    setTicketEdicionAbierto(false);
  }

  const resumenApuestas = resumenBankroll(movimientos, apuestas, "apuestas");
  const resumenEntretenimiento = resumenBankroll(movimientos, apuestas, "entretenimiento");

  const puedeConfirmar = casa.trim() !== "";

  // Aviso de saldo (petición directa): a diferencia de FormularioApuesta.jsx
  // (que enseña siempre la cifra disponible, porque ahí la cantidad ya se
  // teclea en el mismo formulario), aquí el importe se pone más tarde, en
  // el ticket — así que solo tiene sentido avisar cuando de verdad te
  // pasas, no mostrar una cifra fija de fondo mientras tanto. Suma TODO lo
  // puesto en el ticket ahora mismo (cada bloque + la combinada), no solo
  // el bloque que se está tocando.
  const bankrollCasa = casa
    ? calcularBankrollPorCasa(movimientos, apuestas, bankroll).find((b) => b.casa === casa)?.bankroll ?? 0
    : null;
  const campoFreebetCasa = bankroll === "entretenimiento" ? "freebetSaldoEntretenimiento" : "freebetSaldoApuestas";
  const freebetsCasa = casa ? casas.find((c) => c.nombre === casa)?.[campoFreebetCasa] ?? 0 : 0;
  const numero = (v) => parseFloat(String(v).replace(",", ".")) || 0;
  // Al editar, el importe vive en stakeEdicion/stakeFreebetEdicion (un
  // único campo para toda la apuesta), no repartido por bloque/combinada
  // como al crear.
  const montoReal = esEdicion
    ? numero(stakeEdicion)
    : bloques.reduce((total, b) => total + numero(b.stake), 0) + (bloques.length > 1 ? numero(comboStake) : 0);
  // En "freebet" el único campo del ticket ("Cantidad") ES el importe de
  // freebet — en "mixta", el campo "Freebet" aparte; en "real" no hay
  // freebet que comparar.
  const montoFreebet =
    tipoFondos === "freebet"
      ? montoReal
      : esEdicion
      ? numero(stakeFreebetEdicion)
      : bloques.reduce((total, b) => total + numero(b.stakeFreebet), 0) +
        (bloques.length > 1 ? numero(comboStakeFreebet) : 0);
  const superaBankroll = tipoFondos !== "freebet" && bankrollCasa !== null && montoReal > bankrollCasa;
  const superaFreebets = tipoFondos !== "real" && montoFreebet > freebetsCasa;
  const extrasActivas =
    (titulo.trim() ? 1 : 0) + (deporte !== "Fútbol" ? 1 : 0) + (asegurada ? 1 : 0) + (conAumento ? 1 : 0);

  function confirmar() {
    if (!puedeConfirmar) return;
    setConfirmado(true);
  }

  const etiquetaFondos = { real: "Real", freebet: "Freebet", mixta: "Mixta" }[tipoFondos];

  // Resumen del ticket de edición colapsado (mismo criterio que
  // TicketFlotante.jsx, adaptado: aquí no hay "varias apuestas nuevas",
  // así que la cuota mostrada siempre es la de ESTA apuesta).
  const cuotaComboAutoEdicion = bloques.reduce((total, b) => total * numero(b.cuota), 1);
  const cuotaMostradaEdicion = numero(comboCuota) || cuotaComboAutoEdicion;
  const primerBloqueEdicion = bloques[0] ?? null;
  const tituloTicketEdicion =
    bloques.length > 1
      ? `Combinada de ${bloques.length} partidos`
      : primerBloqueEdicion
      ? primerBloqueEdicion.items.length > 1
        ? "Creación de apuesta"
        : primerBloqueEdicion.items[0].label
      : "Sin partidos";
  const resumenTicketEdicion =
    bloques.length > 0
      ? bloques
          .map((b) => {
            const eq = equiposDesdeEvento(b.partido.evento);
            return `${eq.local} - ${eq.visitante}`;
          })
          .join(", ")
      : "Añade al menos un partido";

  if (confirmado) {
    return (
      <div className="bg-surface border border-line rounded-xl p-4 sm:p-5">
        {/* Carrusel horizontal en móvil (petición del prompt) — en
            escritorio, la fila de siempre con salto de línea. Bug real:
            "Editar"/"Cancelar" vivían dentro del propio carrusel con
            "ml-auto" — en pantallas estrechas con muchas pastillas
            (bankroll/fecha/casa/fondos/opciones) el carrusel se quedaba
            más ancho que la pantalla, y "ml-auto" los empujaba al FINAL
            de ese contenido desbordado, no al borde de la pantalla — se
            veían cortados ("Ed") en vez de necesitar solo deslizar para
            llegar a ellos. Ahora son una fila aparte, siempre visible
            entera sin deslizar nada (en escritorio, "lg:flex-row" los
            vuelve a poner en la misma fila que las pastillas, como
            antes). */}
        <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
          <div className="flex-1 min-w-0 flex flex-nowrap lg:flex-wrap items-center gap-2 overflow-x-auto scrollbar-oculto lg:overflow-visible">
            {esEdicion && (
              <span className="shrink-0 text-xs font-semibold text-feltDark bg-gold rounded-full px-2.5 py-1">
                Editando apuesta
              </span>
            )}
            <span className="shrink-0 text-xs font-semibold text-gold border border-gold/40 bg-gold/10 rounded-full px-2.5 py-1">
              {bankroll === "apuestas" ? "Apuestas" : "Entretenimiento"}
            </span>
            <span className="shrink-0 text-xs text-slate border border-line rounded-full px-2.5 py-1">
              {fecha.split("-").reverse().join("/")}
            </span>
            <span className="shrink-0 text-xs text-slate border border-line rounded-full px-2.5 py-1">
              {casa}
            </span>
            <span className="shrink-0 text-xs text-slate border border-line rounded-full px-2.5 py-1">
              {etiquetaFondos}
            </span>
            {extrasActivas > 0 && (
              <span className="shrink-0 text-xs text-slate border border-line rounded-full px-2.5 py-1">
                {extrasActivas} {extrasActivas === 1 ? "opción" : "opciones"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0 lg:ml-auto">
            <button
              type="button"
              onClick={() => setConfirmado(false)}
              className="shrink-0 flex items-center gap-1 text-xs font-semibold text-gold hover:underline"
            >
              <Pencil size={12} />
              Editar
            </button>
            <button
              type="button"
              onClick={onCancelar}
              className="shrink-0 flex items-center gap-1 text-xs font-semibold text-slate hover:text-lose hover:underline"
            >
              <X size={12} />
              Cancelar
            </button>
          </div>
        </div>

        {/* Indicador de pasos — solo móvil (Fase 6): en escritorio las 3
            ventanas ya se ven a la vez, "paso" no tiene ningún efecto ahí. */}
        <div className="lg:hidden mt-4 flex border border-line rounded-lg overflow-hidden">
          {["Partido", "Mercados", "Confirmar"].map((etiquetaPaso, i) => (
            <button
              key={etiquetaPaso}
              type="button"
              onClick={() => setPaso(i)}
              className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                paso === i ? "bg-paperDim text-ink" : "text-slate"
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-mono ${
                  paso === i ? "border-gold text-gold" : "border-line"
                }`}
              >
                {i + 1}
              </span>
              {etiquetaPaso}
            </button>
          ))}
        </div>

        {/* Barra superior compartida (solo móvil, pasos Mercados/Confirmar):
            sustituye la ficha de cabecera que Mercados/Confirmación ya
            tienen en escritorio, para no repetir el nombre del partido dos
            veces (petición directa del prompt). Rediseñada con escudos +
            "VS" (petición directa, mismo criterio que la cabecera de
            escritorio de PanelMercados.jsx) — antes era una fila con solo
            texto pequeño. */}
        {matchActivo && paso !== 0 && (
          <div className="lg:hidden mt-3 relative bg-paperDim border border-gold/30 rounded-xl px-3 py-3">
            <button
              type="button"
              onClick={() => setPaso(0)}
              aria-label="Volver a partidos"
              className="absolute left-3 top-3 text-gold hover:text-goldDark"
            >
              <ArrowLeft size={18} />
            </button>
            <p className="text-center text-[10px] font-semibold text-gold uppercase tracking-wide truncate px-8">
              {matchActivo.pais} · {matchActivo.competicion}
              {matchActivo.sede ? ` · ${matchActivo.sede}` : ""}
            </p>
            <div className="mt-2 flex items-center justify-center gap-2">
              {escudoUrl(matchActivo.equipoLocalId, matchActivo.escudoLocal) && (
                <img
                  src={escudoUrl(matchActivo.equipoLocalId, matchActivo.escudoLocal)}
                  alt=""
                  className="w-8 h-8 shrink-0 object-contain"
                />
              )}
              <span className="font-display text-sm text-ink">
                {equiposDesdeEvento(matchActivo.evento).local}
              </span>
              <span className="font-display text-xs font-bold text-gold shrink-0">VS</span>
              <span className="font-display text-sm text-ink">
                {equiposDesdeEvento(matchActivo.evento).visitante}
              </span>
              {escudoUrl(matchActivo.equipoVisitanteId, matchActivo.escudoVisitante) && (
                <img
                  src={escudoUrl(matchActivo.equipoVisitanteId, matchActivo.escudoVisitante)}
                  alt=""
                  className="w-8 h-8 shrink-0 object-contain"
                />
              )}
            </div>
            <div className="mt-2 flex justify-center">
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-gold border border-gold/40 rounded-full px-2.5 py-0.5">
                <Clock size={11} />
                Hoy {matchActivo.hora}
              </span>
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr] gap-4 items-start">
          <div className={`${paso === 0 ? "block" : "hidden"} lg:block`}>
            <PanelPartidos
              fecha={fecha}
              matchIdActivo={matchActivo?.id}
              onElegirPartido={elegirPartido}
              contarSelecciones={contarSeleccionesDelPartido}
              ligasFijadas={ligasFijadas}
              onAlternarLigaFijada={onAlternarLigaFijada}
            />
          </div>
          {matchActivo ? (
            <>
              <div className={`${paso === 1 ? "block" : "hidden"} lg:block`}>
                <PanelMercados
                  partido={matchActivo}
                  equipos={equiposDesdeEvento(matchActivo.evento)}
                  pendientes={pendientes}
                  onTogglePendiente={togglePendiente}
                  estaConfirmada={estaConfirmada}
                />
              </div>
              <div className={`${paso === 2 ? "block" : "hidden"} lg:block`}>
                <PanelConfirmacion
                  matchActivo={matchActivo}
                  equipos={equiposDesdeEvento(matchActivo.evento)}
                  pendientes={pendientes}
                  onQuitarPendiente={togglePendiente}
                  onConfirmar={confirmarSeleccion}
                  totalPartidos={bloques.length}
                />
              </div>
            </>
          ) : (
            <div
              className={`lg:col-span-2 ${
                paso !== 0 ? "block" : "hidden"
              } lg:block border border-dashed border-line rounded-lg p-6 text-center text-sm text-slate`}
            >
              Elige un partido de la lista de la izquierda.
            </div>
          )}
        </div>

        {/* Bug real: este aviso vivía en el flujo normal de la página,
            justo antes del hueco/ticket flotante — con el ticket abierto
            (fixed, por encima de todo) tapaba exactamente esa zona, así
            que un guardado que SÍ funcionaba (o SÍ fallaba) podía no verse
            nunca, como si el botón "no hiciera nada". Ahora es un aviso
            fijo arriba del todo (por encima incluso del ticket, z-[60]),
            visible sin depender de scroll ni de si el ticket sigue abierto. */}
        {avisoGuardado && (
          <div className="fixed inset-x-4 top-4 z-[60] flex justify-center">
            <button
              type="button"
              onClick={() => setAvisoGuardado(null)}
              className={`w-full max-w-lg text-left rounded-lg border p-4 text-sm shadow-lg ${
                avisoGuardado.error
                  ? "border-lose/40 bg-lose text-paper"
                  : "border-win/40 bg-win text-paper font-semibold"
              }`}
            >
              {avisoGuardado.error
                ? avisoGuardado.error
                : esEdicion
                ? "Cambios guardados correctamente."
                : `Guardada${avisoGuardado.ok === 1 ? "" : "s"} ${avisoGuardado.ok} ${
                    avisoGuardado.ok === 1 ? "apuesta" : "apuestas"
                  } correctamente.`}
              <span className="block text-xs opacity-75 mt-1 font-normal">Toca para cerrar</span>
            </button>
          </div>
        )}

        {/* Hueco extra en móvil para que el último mercado/partido de la
            lista no quede tapado por la pila de barra ámbar + ticket
            flotante (petición del prompt) — h-[250px] en vez de h-44
            porque el contenedor fijo ahora arranca en "bottom-24" (para no
            taparse con BarraInferiorMovil.jsx), no en "bottom-[22px]". */}
        {(pendientes.length > 0 || bloques.length > 0) && <div className="lg:hidden h-[250px]" />}

        {/* Contenedor fijo único para el ticket y, en móvil, la barra ámbar
            de "selecciones marcadas" (Fase 6) — apilados con flexbox
            (flex-col-reverse: el primer hijo del DOM queda abajo del todo)
            en vez de que cada uno calcule su posición con un número fijo.
            Antes la barra ámbar usaba "bottom-[104px]" adivinando la altura
            del ticket colapsado, y se solapaba con él en cuanto esa altura
            no cuadraba exactamente (bug real, visto en pantalla). Así se
            acomodan solos sin importar la altura real de cada uno.
            "bottom-24" en móvil (petición directa: se veía por encima de
            Inicio/Apuestas/Estadísticas/Más) es el mismo margen que ya usa
            App.jsx (pb-24) para dejar sitio a BarraInferiorMovil.jsx; en
            escritorio no hay barra inferior, así que "lg:bottom-[22px]"
            vuelve a pegarlo abajo del todo. */}
        {!esEdicion && (bloques.length > 0 || pendientes.length > 0) && (
          <div className="fixed inset-x-0 bottom-24 lg:bottom-[22px] z-50 flex flex-col-reverse items-center gap-2 px-4 pointer-events-none">
            {bloques.length > 0 && (
              <TicketFlotante
                bloques={bloques}
                tipoFondos={tipoFondos}
                comboCuota={comboCuota}
                comboStake={comboStake}
                comboStakeFreebet={comboStakeFreebet}
                onQuitarBloque={quitarBloque}
                onQuitarItem={quitarItemDeBloque}
                onCambiarCuotaBloque={cambiarCuotaBloque}
                onCambiarStakeBloque={cambiarStakeBloque}
                onCambiarStakeFreebetBloque={cambiarStakeFreebetBloque}
                onCambiarComboCuota={setComboCuota}
                onCambiarComboStake={setComboStake}
                onCambiarComboStakeFreebet={setComboStakeFreebet}
                onRellenarCantidad={rellenarCantidad}
                onGuardar={guardarApuesta}
                avisoBankroll={
                  superaBankroll
                    ? `El dinero real puesto supera lo disponible en ${casa} (${bankrollCasa.toFixed(2)}€).`
                    : null
                }
                avisoFreebet={
                  superaFreebets
                    ? `La freebet puesta supera el saldo disponible en ${casa} (${freebetsCasa.toFixed(2)}€).`
                    : null
                }
              />
            )}
            {pendientes.length > 0 && (
              <div className="lg:hidden w-full max-w-lg pointer-events-auto bg-gold text-feltDark rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-lg">
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold">
                    {pendientes.length}{" "}
                    {pendientes.length === 1 ? "selección marcada" : "selecciones marcadas"}
                  </span>
                  {matchActivo && (
                    <span className="block text-xs opacity-75 truncate">
                      {equiposDesdeEvento(matchActivo.evento).local} –{" "}
                      {equiposDesdeEvento(matchActivo.evento).visitante}
                    </span>
                  )}
                </span>
                <button type="button" onClick={() => setPaso(2)} className="text-sm font-semibold shrink-0">
                  Poner cuota ›
                </button>
              </div>
            )}
          </div>
        )}

        {/* Ticket de edición (petición directa): a propósito NO reutiliza
            TicketFlotante — ese está pensado para crear (un bloque suelto
            con cantidad puede acabar siendo una apuesta nueva aparte),
            mientras que aquí SIEMPRE es una sola apuesta ya existente, con
            un único importe (real/freebet) para toda ella, tenga uno o
            varios partidos. Mezclar los dos modelos en el mismo componente
            habría sido más lío que un ticket propio y sencillo. Fijo en
            pantalla (petición directa: se veía como un bloque más de la
            página y se perdía al desplazarse por Partidos/Mercados) —
            mismo "bottom-24 lg:bottom-[22px]" que el ticket de crear, para
            no taparse con la barra inferior en móvil. */}
        {esEdicion && (
          <div className="fixed inset-x-0 bottom-24 lg:bottom-[22px] z-50 flex flex-col-reverse items-center gap-2 px-4 pointer-events-none">
          <div className="w-full max-w-lg pointer-events-auto bg-surface border-2 border-gold rounded-2xl shadow-2xl overflow-hidden">
            {!ticketEdicionAbierto ? (
              <>
                <button
                  type="button"
                  onClick={() => setTicketEdicionAbierto(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                >
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-ink truncate">{tituloTicketEdicion}</span>
                    <span className="block text-xs text-slate truncate">{resumenTicketEdicion}</span>
                  </span>
                  <span className="font-mono text-lg text-gold shrink-0">{cuotaMostradaEdicion.toFixed(2)}</span>
                  <ChevronDown size={16} className="text-slate shrink-0" />
                </button>
                <div className="flex border-t border-line">
                  <button
                    type="button"
                    onClick={() => setTicketEdicionAbierto(true)}
                    className="flex-1 py-3 text-sm font-semibold text-gold"
                  >
                    Cantidad {stakeEdicion ? `${numero(stakeEdicion).toFixed(2)}€` : "—"}
                  </button>
                  <button
                    type="button"
                    onClick={guardarApuesta}
                    disabled={bloques.length === 0 || !(Number(stakeEdicion) > 0)}
                    className={`px-6 py-3 text-sm font-semibold transition-colors ${
                      bloques.length === 0 || !(Number(stakeEdicion) > 0)
                        ? "bg-paperDim text-slate"
                        : "bg-gold text-feltDark hover:bg-goldDark"
                    }`}
                  >
                    Guardar cambios
                  </button>
                </div>
              </>
            ) : (
              <>
            <div className="px-4 py-3 border-b border-line bg-paperDim flex items-center gap-2">
              <h3 className="flex-1 text-sm font-semibold text-ink">
                {bloques.length > 1 ? `Combinada de ${bloques.length} partidos` : "Partido"}
              </h3>
              <button
                type="button"
                onClick={() => setTicketEdicionAbierto(false)}
                aria-label="Colapsar ticket"
                className="text-slate hover:text-ink"
              >
                <ChevronDown size={16} className="rotate-180" />
              </button>
            </div>

            {bloques.length === 0 ? (
              <p className="p-4 text-sm text-slate text-center">
                Esta apuesta se ha quedado sin partidos — añade al menos uno de la lista de la
                izquierda para poder guardar.
              </p>
            ) : (
              <div className="max-h-[36vh] overflow-y-auto scrollbar-oculto divide-y divide-line">
                {bloques.map((b, bi) => {
                  const equipos = equiposDesdeEvento(b.partido.evento);
                  return (
                    <div key={bi} className="p-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => quitarBloque(bi)}
                          aria-label="Quitar partido"
                          className="text-slate hover:text-lose shrink-0"
                        >
                          <X size={14} />
                        </button>
                        <span className="flex-1 min-w-0 text-sm text-ink truncate">
                          {equipos.local} - {equipos.visitante}
                        </span>
                        <div className="flex flex-col items-center gap-0.5 shrink-0">
                          <span className="text-[9px] font-semibold text-slate uppercase tracking-wide">
                            Cuota
                          </span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={b.cuota}
                            onChange={(e) => cambiarCuotaBloque(bi, e.target.value)}
                            className="w-16 text-center bg-paperDim border-2 border-gold/40 focus:border-gold rounded px-1 py-1 font-mono font-bold text-sm text-gold outline-none transition-colors"
                          />
                        </div>
                      </div>
                      <ul className="mt-2 ml-6 space-y-1">
                        {b.items.map((it, ii) => (
                          <li key={ii} className="flex items-center justify-between gap-2 text-xs text-ink">
                            <span className="truncate">{it.label}</span>
                            <button
                              type="button"
                              onClick={() => quitarItemDeBloque(bi, ii)}
                              aria-label="Quitar selección"
                              className="text-slate hover:text-lose shrink-0"
                            >
                              <X size={11} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="p-3.5 border-t border-line bg-paperDim space-y-3">
              {bloques.length > 1 && (
                <div>
                  <label className="block text-xs text-slate mb-1">
                    Cuota total (vacío = se calcula sola con el producto de cada partido)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={comboCuota}
                    onChange={(e) => setComboCuota(e.target.value)}
                    placeholder={bloques.reduce((total, b) => total * numero(b.cuota), 1).toFixed(2)}
                    className="w-full sm:w-32 border border-line rounded-lg px-3 py-2 text-sm font-mono bg-surface"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate mb-1">
                    {tipoFondos === "mixta" ? "Real (€)" : "Cantidad (€)"}
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={stakeEdicion}
                    onChange={(e) => setStakeEdicion(e.target.value)}
                    className="w-full border border-line rounded-lg px-3 py-2 text-sm font-mono bg-surface"
                  />
                </div>
                {tipoFondos === "mixta" && (
                  <div>
                    <label className="block text-xs text-slate mb-1">Freebet (€)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={stakeFreebetEdicion}
                      onChange={(e) => setStakeFreebetEdicion(e.target.value)}
                      className="w-full border border-line rounded-lg px-3 py-2 text-sm font-mono bg-surface"
                    />
                  </div>
                )}
              </div>
              {superaBankroll && (
                <p className="text-xs text-lose">
                  El dinero real puesto supera lo disponible en {casa} ({bankrollCasa.toFixed(2)}€).
                </p>
              )}
              {superaFreebets && (
                <p className="text-xs text-lose">
                  La freebet puesta supera el saldo disponible en {casa} ({freebetsCasa.toFixed(2)}€).
                </p>
              )}
              <button
                type="button"
                onClick={guardarApuesta}
                disabled={bloques.length === 0 || !(Number(stakeEdicion) > 0)}
                className="w-full bg-gold text-feltDark py-2.5 rounded-lg text-sm font-semibold hover:bg-goldDark transition-colors disabled:opacity-50"
              >
                Guardar cambios
              </button>
            </div>
              </>
            )}
          </div>
          {/* Mismo aviso "Poner cuota ›" que ya tenía el modo crear (más
              abajo) — al editar también hace falta un atajo a la ventana
              de Confirmación tras marcar un mercado nuevo: en móvil, con
              la lista de Mercados scrolleada, la fila de pasos de arriba
              queda fuera de la vista y no había forma rápida de llegar
              hasta la casilla de la cuota (bug real, reportado por el
              usuario con capturas). */}
          {pendientes.length > 0 && (
            <div className="lg:hidden w-full max-w-lg pointer-events-auto bg-gold text-feltDark rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-lg">
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold">
                  {pendientes.length}{" "}
                  {pendientes.length === 1 ? "selección marcada" : "selecciones marcadas"}
                </span>
                {matchActivo && (
                  <span className="block text-xs opacity-75 truncate">
                    {equiposDesdeEvento(matchActivo.evento).local} –{" "}
                    {equiposDesdeEvento(matchActivo.evento).visitante}
                  </span>
                )}
              </span>
              <button type="button" onClick={() => setPaso(2)} className="text-sm font-semibold shrink-0">
                Poner cuota ›
              </button>
            </div>
          )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-surface border border-line rounded-xl overflow-hidden">
      <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">
          {esEdicion ? "Editar apuesta" : "Nueva apuesta"}
        </h2>
        <button
          type="button"
          onClick={onCancelar}
          className="shrink-0 flex items-center gap-1 text-xs font-semibold text-slate hover:text-lose hover:underline"
        >
          <X size={12} />
          Cancelar
        </button>
      </div>

      <div className="p-4 sm:p-5 border-b border-line">
        <p className="text-xs text-slate mb-2">¿Dónde la registramos?</p>
        {esEdicion && (
          <p className="text-xs text-slate mb-2">
            El bankroll de una apuesta ya creada no se puede cambiar desde aquí.
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          {[
            { valor: "apuestas", etiqueta: "Apuestas", resumen: resumenApuestas },
            { valor: "entretenimiento", etiqueta: "Entretenimiento", resumen: resumenEntretenimiento },
          ].map(({ valor, etiqueta, resumen }) => (
            <button
              key={valor}
              type="button"
              onClick={() => !esEdicion && setBankroll(valor)}
              disabled={esEdicion}
              className={`text-left rounded-lg border p-3 transition-colors ${
                bankroll === valor ? "border-gold bg-gold/10" : "border-line hover:border-gold/40"
              } ${esEdicion ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <span
                className={`text-sm font-semibold flex items-center gap-1.5 ${
                  bankroll === valor ? "text-gold" : "text-ink"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${bankroll === valor ? "bg-gold" : "bg-slate"}`}
                />
                {etiqueta}
              </span>
              <span className="block font-mono font-bold text-base text-ink mt-1.5">
                {resumen.saldo.toFixed(2)}€
              </span>
              <span className="block text-xs text-slate mt-0.5">
                {resumen.enJuego > 0
                  ? `${resumen.enJuego} ${resumen.enJuego === 1 ? "apuesta en juego" : "apuestas en juego"}`
                  : "Sin apuestas vivas"}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-5 border-b border-line">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate mb-1">Fecha</label>
            <SelectorFecha valor={fecha} onCambiar={setFecha} />
          </div>
          <div>
            <CampoCasa casas={casas} valor={casa} onCambiar={setCasa} />
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 border-b border-line">
        <label className="block text-xs text-slate mb-2">Tipo de fondos</label>
        <div className="flex gap-2">
          {[
            { valor: "real", etiqueta: "Real" },
            { valor: "freebet", etiqueta: "Freebet" },
            { valor: "mixta", etiqueta: "Mixta" },
          ].map(({ valor, etiqueta }) => (
            <button
              key={valor}
              type="button"
              onClick={() => setTipoFondos(valor)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                tipoFondos === valor
                  ? "bg-felt text-paper border-felt"
                  : "border-line text-slate hover:text-ink"
              }`}
            >
              {etiqueta}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate mt-2">Las cantidades se introducen en el ticket, al final.</p>
      </div>

      <button
        type="button"
        onClick={() => setExtrasAbiertas((a) => !a)}
        className="w-full flex items-center gap-2 px-4 sm:px-5 py-3 text-sm text-slate border-b border-line"
      >
        <ChevronDown
          size={14}
          className={`transition-transform ${extrasAbiertas ? "rotate-180" : ""}`}
        />
        Opciones adicionales
        {extrasActivas > 0 && (
          <span className="ml-auto font-mono text-xs text-slate">{extrasActivas}</span>
        )}
      </button>

      {extrasAbiertas && (
        <div className="p-4 sm:p-5 border-b border-line bg-paperDim space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate mb-1">Título (opcional)</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej: Winiela"
                className="w-full border border-line rounded-lg px-3 py-2 text-sm bg-surface"
              />
            </div>
            <div>
              <label className="block text-xs text-slate mb-1">Deporte</label>
              <select
                value={deporte}
                onChange={(e) => setDeporte(e.target.value)}
                className="w-full border border-line rounded-lg px-3 py-2 text-sm bg-surface text-ink"
              >
                {DEPORTES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAsegurada((a) => !a)}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium text-center transition-colors ${
                asegurada
                  ? "bg-gold text-feltDark font-semibold border border-gold shadow-sm"
                  : "border-2 border-line bg-surface text-slate hover:text-ink hover:border-gold/40"
              }`}
            >
              {asegurada && <Check size={14} />}
              Apuesta asegurada
            </button>
            <button
              type="button"
              onClick={() => setConAumento((a) => !a)}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium text-center transition-colors ${
                conAumento
                  ? "bg-gold text-feltDark font-semibold border border-gold shadow-sm"
                  : "border-2 border-line bg-surface text-slate hover:text-ink hover:border-gold/40"
              }`}
            >
              {conAumento && <Check size={14} />}
              Aumento de cuota
            </button>
          </div>

          {asegurada && (
            <div>
              <label className="block text-xs text-slate mb-1">Importe del freebet (€)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={seguroImporte}
                onChange={(e) => setSeguroImporte(e.target.value)}
                className="w-full sm:max-w-xs border border-line rounded-lg px-3 py-2 text-sm font-mono bg-surface"
              />
            </div>
          )}

          {conAumento && (
            <div>
              <label className="block text-xs text-slate mb-1">% de aumento</label>
              <input
                type="number"
                step="1"
                min="1"
                max="200"
                value={aumentoPct}
                onChange={(e) => setAumentoPct(e.target.value)}
                className="w-full sm:max-w-xs border border-line rounded-lg px-3 py-2 text-sm font-mono bg-surface"
              />
            </div>
          )}
        </div>
      )}

      <div className="p-4 sm:p-5">
        <button
          type="button"
          onClick={confirmar}
          disabled={!puedeConfirmar}
          className="w-full sm:w-auto bg-gold text-feltDark px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-goldDark transition-colors disabled:opacity-50"
        >
          {esEdicion ? "Confirmar cambios" : "Confirmar y añadir partidos"}
        </button>
        <p className="text-xs text-slate mt-2">
          {esEdicion
            ? "Los partidos ya añadidos no se pierden al cambiar estos datos."
            : "Podrás editar estos datos después sin perder las selecciones."}
        </p>
      </div>
    </div>
  );
}
