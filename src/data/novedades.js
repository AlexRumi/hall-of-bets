// Lista de "qué hay de nuevo en la app", pensada para leerse sin
// conocimientos técnicos (la usa cualquiera con cuenta, no solo quien la
// programa) — no es lo mismo que CHANGELOG.md, que es el porqué técnico
// de cada decisión. Se arranca desde el rediseño del ticket de apuesta
// (petición directa: no tiene sentido meter aquí meses de historial que
// el usuario ya conoce de usar la app tal cual está hoy) — a partir de
// ahora, cada cambio que merezca la pena contar se añade arriba del todo
// (más reciente primero). El "id" no cambia nunca aunque se retoque el
// texto, porque es lo que identifica qué ya se ha visto (useNovedades.js).
// "imagenes" (opcional, array): capturas de pantalla que van una detrás de
// otra en una tira horizontal (ver Novedades.jsx) — viven en public/novedades/.
export const NOVEDADES = [
  {
    id: "partido-a-mano",
    fecha: "2026-09-02",
    titulo: "Registrar apuestas aunque falle el buscador de partidos",
    descripcion:
      "Si alguna vez el buscador de partidos no puede cargar la agenda real (un fallo temporal del proveedor de datos), ahora aparece un aviso claro y una pastilla \"PRUEBA\" en la lista de ejemplo, para que no se confunda con partidos de verdad. Con \"escribir el partido a mano\" puedes seguir registrando la apuesta igualmente (equipo local, visitante, país, competición y hora) — eso sí, los mercados de \"Jugador\" quedan bloqueados con un candado (sin plantilla real que ofrecer), pero \"Otro mercado\" sigue disponible para escribir cualquier apuesta de jugador también a mano.",
  },
  {
    id: "ticket-marcado-por-mercado",
    fecha: "2026-09-02",
    titulo: "El ticket de apuesta, mercado a mercado",
    descripcion:
      "Al abrir el detalle de una apuesta, cada mercado suelto de un mismo partido (por ejemplo \"Gana el Madrid\" y \"Marca Mbappé\") se marca por separado, en vez de tener que marcar todo el partido de golpe. En las combinadas, cada partido se ve como una fila cerrada con una tira de cuadraditos de colores (uno por mercado, verde/rojo/gris según esté ganado, perdido o anulado) — la despliegas para ver y marcar sus mercados.",
    imagenes: ["/novedades/ticket-simple.png", "/novedades/ticket-combinada.png"],
  },
  {
    id: "ajustar-ganancia",
    fecha: "2026-09-02",
    titulo: "Ajustar ganancia",
    descripcion:
      "Si una casa (Bet365, sobre todo) te paga un poco más de lo calculado por sus redondeos internos, ahora hay un botón \"Ajustar ganancia\" junto a Modificar/Eliminar para poner el total real que te ingresó, sin tener que inventarte un aumento de cuota que no existió.",
    imagenes: ["/novedades/ajustar-ganancia.png"],
  },
  {
    id: "nueva-apuesta-v3",
    fecha: "2026-09-01",
    titulo: "Formulario de apuesta nuevo",
    descripcion:
      "Crear (o modificar) una apuesta pasa por un asistente de 5 pasos: el formulario (bankroll, fecha, casa, tipo de fondos), elegir el partido de verdad de una lista, elegir el mercado (con más de 80 tipos distintos: goles, córners, jugador...), poner la cuota tal cual la casa, y por último la cantidad, con la ganancia potencial ya calculada. Ya no hace falta escribir el evento ni el mercado a mano.",
    imagenes: [
      "/novedades/formulario.png",
      "/novedades/buscador-ligas.png",
      "/novedades/mercados.png",
      "/novedades/cuota.png",
      "/novedades/cantidad.png",
    ],
  },
  {
    id: "buscador-partidos-ampliado",
    fecha: "2026-08-31",
    titulo: "Más ligas, banderas y escudos de verdad",
    descripcion:
      "El buscador de partidos cubre ahora muchas más competiciones (Escocia, Grecia, Polonia, Croacia, Japón, Corea del Sur, Arabia Saudí, Australia, Colombia, Chile, Uruguay, entre otras), separadas en \"Competiciones favoritas\" (las que marques con la estrellita, sincronizadas entre tus dispositivos) y \"Otras competiciones\". Los partidos y el ticket de tu apuesta muestran ya el escudo real de cada equipo en vez de un icono genérico.",
    imagenes: ["/novedades/buscador-ligas.png"],
  },
];
