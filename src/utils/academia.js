// Catálogo de conceptos de la sección Academia. Datos puros (sin lógica):
// cada uno se muestra tal cual en Academia.jsx. Las fórmulas de ROI y
// Yield están escritas para que coincidan exactamente con cómo las calcula
// esta app (ver utils/apuestas.js y utils/movimientos.js) — si cambia una
// fórmula ahí, hay que actualizar el texto aquí también.
export const CONCEPTOS = [
  {
    id: "stake",
    nombre: "Stake",
    definicion: "La cantidad de dinero que apuestas en una jugada concreta.",
    explicacion:
      "Es simplemente cuánto dinero pones en juego. Si apuestas 20€ a que gana un equipo, tu stake es 20€.",
    formula: "Beneficio si ganas = Stake × (Cuota − 1)",
    ejemplo:
      "Apuestas 20€ a una cuota de 2,10. Si ganas, tu beneficio es 20 × (2,10 − 1) = 22€ (y además recuperas los 20€ del stake).",
    interpretacion:
      "Cuanto mayor es el stake, mayor el riesgo y mayor el beneficio potencial. Muchos apostadores usan un stake fijo o un porcentaje del bankroll para controlar el riesgo, en vez de decidirlo a ojo cada vez.",
    erroresFrecuentes:
      "Subir el stake para \"recuperar\" pérdidas anteriores (perseguir pérdidas) es una de las formas más rápidas de arruinar un bankroll.",
  },
  {
    id: "roi",
    nombre: "ROI (retorno de la inversión)",
    definicion:
      "El beneficio obtenido en relación al dinero que has ingresado en tus casas de apuestas.",
    explicacion:
      "Mide qué tan rentable es el dinero que te has gastado de tu bolsillo, no cada apuesta suelta.",
    formula: "ROI (%) = (Beneficio / Ingresos) × 100",
    ejemplo:
      "Has ingresado 200€ en total en tus casas de apuestas, y llevas 46€ de beneficio acumulado. ROI = (46 / 200) × 100 = 23%.",
    interpretacion:
      "En esta app, el ROI se calcula sobre el dinero que has depositado (ver Casas de apuestas), no sobre el dinero apostado — para eso está el Yield, que es distinto.",
    erroresFrecuentes:
      "Confundir ROI con Yield: se parecen, pero no son lo mismo. Un ROI alto con pocos ingresos puede ser engañoso si todavía no has retirado nada.",
  },
  {
    id: "yield",
    nombre: "Yield",
    definicion:
      "El beneficio que obtienes en relación al dinero total que has apostado (staked), no al que has depositado.",
    explicacion:
      "Es la métrica más usada entre apostadores para saber si \"se les da bien\" apostar, porque compara el beneficio con el volumen realmente jugado.",
    formula: "Yield (%) = (Beneficio / Stake total apostado) × 100",
    ejemplo:
      "Has apostado un total de 500€ repartidos en varias apuestas, y tu beneficio acumulado es 35€. Yield = (35 / 500) × 100 = 7%.",
    interpretacion:
      "Un yield del 5-10% mantenido a largo plazo ya se considera muy bueno entre apostadores serios — no hace falta un yield enorme para que compense.",
    erroresFrecuentes:
      "Un yield alto en pocas apuestas no significa nada de forma fiable: hace falta un volumen razonable (cientos de apuestas) para que el dato tenga sentido.",
  },
  {
    id: "bankroll",
    nombre: "Bankroll",
    definicion: "El dinero total, real, que tienes disponible para apostar en un momento dado.",
    explicacion:
      "Es tu \"capital de apuestas\" ahora mismo: cuánto tienes de verdad, no cuánto has ganado o perdido en abstracto.",
    formula: "Bankroll = Ingresos − Retiradas + Beneficio acumulado",
    ejemplo:
      "Has ingresado 300€ en total, retirado 50€, y llevas 80€ de beneficio. Bankroll = 300 − 50 + 80 = 330€.",
    interpretacion:
      "El bankroll de apuestas debería ser siempre dinero que puedes permitirte perder — no dinero reservado para otras cosas.",
    erroresFrecuentes:
      "Mezclar el bankroll de apuestas con dinero que necesitas para gastos normales es el error más peligroso de gestión de bankroll.",
  },
  {
    id: "cuota",
    nombre: "Cuota",
    definicion:
      "El número que indica cuánto te paga la casa de apuestas si aciertas, y que también refleja la probabilidad implícita de que ocurra.",
    explicacion:
      "A mayor cuota, menor probabilidad estimada por la casa de que pase — pero mayor pago si aciertas.",
    formula:
      "Ganancia si aciertas = Stake × (Cuota − 1). Cuota total de una combinada = producto de las cuotas de cada selección.",
    ejemplo:
      "Cuota 2,50 con un stake de 10€: si ganas, tu beneficio es 10 × (2,50 − 1) = 15€ (más los 10€ del stake que recuperas).",
    interpretacion:
      "Una cuota de 1,50 implica una apuesta que la casa considera más probable que una de cuota 5,00 — pero ninguna cuota, por baja que sea, es una garantía.",
    erroresFrecuentes:
      "Pensar que \"cuota baja = apuesta segura\". Las cuotas bajas también fallan, y repetidas muchas veces pueden acabar en pérdidas si la selección no acierta tanto como parecía.",
  },
  {
    id: "win-rate",
    nombre: "Win Rate (% de acierto)",
    definicion:
      "El porcentaje de tus apuestas decididas (ganadas o perdidas, sin contar pendientes ni nulas) que has acertado.",
    explicacion: "Cuántas veces ganas de cada 100 apuestas, en términos simples.",
    formula: "Win Rate (%) = (Apuestas ganadas / Apuestas decididas) × 100",
    ejemplo: "De 40 apuestas decididas, has ganado 18. Win Rate = (18 / 40) × 100 = 45%.",
    interpretacion:
      "Un win rate alto no siempre significa beneficio: depende mucho de a qué cuotas ganas. Se puede tener un 70% de acierto y perder dinero (con cuotas muy bajas), igual que un 30% y ganar (con cuotas altas jugadas con criterio).",
    erroresFrecuentes:
      "Obsesionarse con el win rate en vez de con el beneficio o el yield reales es uno de los errores más comunes al empezar.",
  },
  {
    id: "ev",
    nombre: "EV (valor esperado)",
    definicion:
      "Lo que, en promedio, ganarías o perderías si repitieras la misma apuesta muchísimas veces, según tu propia estimación de probabilidad.",
    explicacion:
      "Compara lo que tú crees que puede pasar con lo que dice la cuota, y calcula si esa diferencia juega a tu favor.",
    formula:
      "EV = (Probabilidad estimada de acierto × Ganancia si aciertas) − (Probabilidad estimada de fallo × Stake)",
    ejemplo:
      "Crees que un equipo tiene un 45% de probabilidad real de ganar, y la cuota ofrecida es 2,50 con un stake de 10€. EV = (0,45 × 15€) − (0,55 × 10€) = 6,75€ − 5,50€ = +1,25€. Esa apuesta tiene valor esperado positivo, aunque puedas perderla igualmente esta vez.",
    interpretacion:
      "Una apuesta de EV positivo no garantiza ganar esa vez concreta — solo dice que, repetida muchas veces, tendería a dar beneficio a largo plazo.",
    erroresFrecuentes:
      "Confundir \"gané esta apuesta\" con \"fue una buena apuesta\" (o al revés). El resultado de una sola jugada no valida ni invalida si tenía EV positivo.",
  },
  {
    id: "probabilidad-implicita",
    nombre: "Probabilidad implícita",
    definicion:
      "La probabilidad de que ocurra un resultado, calculada a partir de la cuota que ofrece la casa.",
    explicacion: "Es la forma de traducir una cuota a un porcentaje de probabilidad.",
    formula: "Probabilidad implícita (%) = (1 / Cuota) × 100",
    ejemplo:
      "Una cuota de 2,00 implica una probabilidad de (1 / 2,00) × 100 = 50%. Una cuota de 4,00 implica (1 / 4,00) × 100 = 25%.",
    interpretacion:
      "Comparar tu propia estimación de probabilidad con la probabilidad implícita de la cuota es la base de las apuestas \"de valor\": si crees que la probabilidad real es mayor que la implícita, la apuesta tiene valor (EV positivo).",
    erroresFrecuentes:
      "Sumar las probabilidades implícitas de todos los resultados de un mercado suele dar más del 100% — esa diferencia es el margen de la casa, no un error de cálculo.",
  },
  {
    id: "cash-out",
    nombre: "Cash Out",
    definicion:
      "Opción que ofrecen algunas casas para cerrar una apuesta antes de que termine el evento, asegurando una ganancia parcial o reduciendo una pérdida.",
    explicacion: "Es \"vender\" tu apuesta a la casa antes de que acabe el partido o evento.",
    formula:
      "No tiene una fórmula fija: el importe lo calcula la casa en tiempo real, normalmente algo peor que el valor justo matemático de la apuesta en ese momento.",
    ejemplo:
      "Apuestas 10€ a cuota 3,00 a que un equipo gana. Va ganando al descanso, y la casa te ofrece un Cash Out de 18€ (en vez de esperar a los 30€ que ganarías si se cumple el resultado final).",
    interpretacion:
      "Es una herramienta de gestión de riesgo útil para asegurar beneficio o cortar pérdidas, pero casi siempre tiene un coste frente a dejar correr la apuesta hasta el final.",
    erroresFrecuentes:
      "Usar el Cash Out por nervios en casi todas las apuestas suele reducir el beneficio a largo plazo — conviene reservarlo para situaciones concretas.",
  },
  {
    id: "void",
    nombre: "Void (apuesta nula)",
    definicion:
      "Una apuesta que se anula — no cuenta como ganada ni perdida — normalmente porque el evento no se pudo completar o una condición del mercado no se cumplió.",
    explicacion:
      "Por ejemplo, un jugador se retira lesionado antes de empezar: la casa anula esa apuesta.",
    formula: "Beneficio de una apuesta nula = 0€ (se devuelve el stake íntegro).",
    ejemplo:
      "Apuestas a que un tenista gana un partido, pero se retira lesionado antes de empezar — la casa anula la apuesta y te devuelve el stake.",
    interpretacion:
      "En Hall of Bets, las apuestas marcadas como \"Nula\" no cuentan ni en el beneficio ni en el yield ni en el % de acierto.",
    erroresFrecuentes:
      "Esta app no gestiona resultados por selección dentro de una combinada — si una sola pata se anula, el ajuste más fiel es cambiar su cuota a 1,00 antes de marcar el resultado final de la combinada, para que el beneficio calculado refleje lo que realmente cobrarías.",
  },
  {
    id: "apuesta-simple",
    nombre: "Apuesta simple",
    definicion: "Una apuesta con una única selección o pronóstico.",
    explicacion:
      "Es la forma más sencilla de apostar: un solo pronóstico, que se gana o se pierde por sí solo.",
    formula: "Beneficio = Stake × (Cuota − 1) si ganas; −Stake si pierdes (0€ si era freebet).",
    ejemplo:
      "Apuestas 15€ a que un equipo gana, a cuota 1,80. Si acierta, ganas 15 × (1,80 − 1) = 12€ de beneficio.",
    interpretacion:
      "Ofrece más control que una combinada: cada pronóstico se juega y se resuelve por separado, sin que un fallo arrastre a los demás.",
    erroresFrecuentes:
      "Ninguno específico de la apuesta simple en sí — los errores habituales (perseguir pérdidas, apostar sin criterio) aplican igual aquí que en cualquier otro tipo.",
  },
  {
    id: "apuesta-combinada",
    nombre: "Apuesta combinada",
    definicion:
      "Una apuesta con varias selecciones a la vez, donde todas deben acertarse para ganar la apuesta completa.",
    explicacion:
      "Juntas varios pronósticos en una sola apuesta: la cuota sube mucho, pero también el riesgo.",
    formula:
      "Cuota total = producto de las cuotas de cada selección. Si falla una sola selección, se pierde la apuesta completa.",
    ejemplo:
      "Combinas 3 selecciones a cuotas 1,50, 1,80 y 2,00. Cuota total = 1,50 × 1,80 × 2,00 = 5,40. Con un stake de 10€, si aciertas las tres, ganas 10 × (5,40 − 1) = 44€ de beneficio.",
    interpretacion:
      "Cuantas más selecciones añades, menor es la probabilidad real de acertarlas todas, aunque la cuota total parezca muy atractiva.",
    erroresFrecuentes:
      "Añadir selecciones \"de relleno\" con cuotas muy bajas solo para inflar la cuota total reduce mucho la probabilidad de acierto sin aportar apenas valor.",
  },
];
