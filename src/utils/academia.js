// Catálogo de conceptos de la sección Academia. Datos puros (sin lógica):
// cada uno se muestra tal cual en Academia.jsx. Las fórmulas de ROI y
// Yield están escritas para que coincidan exactamente con cómo las calcula
// esta app (ver utils/apuestas.js y utils/movimientos.js) — si cambia una
// fórmula ahí, hay que actualizar el texto aquí también.
//
// Orden: de lo más básico a lo más avanzado dentro de cada categoría (mismo
// patrón que CATEGORIAS de utils/trofeos.js — un id por categoría, y
// Academia.jsx agrupa por ahí en vez de mostrar la lista plana de antes).
export const CATEGORIAS_ACADEMIA = [
  { id: "fundamentos", etiqueta: "Fundamentos" },
  { id: "rendimiento", etiqueta: "Rendimiento y evaluación" },
  { id: "resultados-especiales", etiqueta: "Resultados especiales" },
  { id: "bonos", etiqueta: "Bonos, promociones y matched betting" },
];

export const CONCEPTOS = [
  {
    id: "stake",
    categoria: "fundamentos",
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
    id: "bankroll",
    categoria: "fundamentos",
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
    categoria: "fundamentos",
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
    id: "probabilidad-implicita",
    categoria: "fundamentos",
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
    id: "apuesta-simple",
    categoria: "fundamentos",
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
    categoria: "fundamentos",
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
  {
    id: "roi",
    categoria: "rendimiento",
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
    categoria: "rendimiento",
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
    id: "win-rate",
    categoria: "rendimiento",
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
    categoria: "rendimiento",
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
    id: "cash-out",
    categoria: "resultados-especiales",
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
    categoria: "resultados-especiales",
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
    id: "bono",
    categoria: "bonos",
    nombre: "Bono / Freebet",
    definicion:
      "Dinero de regalo que da una casa de apuestas — normalmente solo se puede usar para apostar (freebet), no retirar directamente — a cambio de un depósito, una promoción, o como compensación.",
    explicacion:
      "Es una apuesta \"gratis\": el dinero del bono no es tuyo hasta que lo juegas y ganas. En Hall of Bets, el depósito con bono, la apuesta asegurada perdida, y el formulario \"Otro bono\" (para el resto de casos: un bono de cumpleaños, una compensación de soporte, un bono suelto de la casa...) suman todos directamente al saldo de freebet de la casa en cuanto los registras (ver Casas de apuestas) — no hace falta ningún paso más.",
    formula:
      "Si ganas con freebet: beneficio = Stake × (Cuota − 1), igual que con dinero real. Si pierdes con freebet: 0€ perdidos de verdad, porque el stake nunca fue tuyo.",
    ejemplo:
      "Bet365 te da un bono de bienvenida de 20€. Apuestas esos 20€ (fondos Freebet) a una cuota de 3,00: si ganas, tu beneficio real es 20 × (3,00 − 1) = 40€ (el stake del freebet no se recupera, solo la ganancia); si pierdes, no pierdes nada de tu bolsillo.",
    interpretacion:
      "Un freebet nunca vale su importe completo en efectivo, solo la ganancia potencial si aciertas — por eso conviene jugarlo a cuotas altas, cuanto más alta la cuota, más cerca está de valer su importe nominal.",
    erroresFrecuentes:
      "Usar un freebet en la apuesta \"de siempre\" a cuota baja desaprovecha casi todo su valor: con una cuota de 1,20, un freebet de 20€ solo vale 4€ de beneficio potencial.",
  },
  {
    id: "apuesta-asegurada",
    categoria: "bonos",
    nombre: "Apuesta asegurada (seguro)",
    definicion:
      "Promoción en la que la casa te devuelve el stake (normalmente en forma de freebet) si tu apuesta pierde.",
    explicacion:
      "Es un \"colchón\": arriesgas tu dinero real como siempre, pero si fallas, no lo pierdes del todo — recuperas parte o todo como freebet.",
    formula:
      "Si pierdes: freebet recibido = importe asegurado. Pérdida neta real = Stake − Importe asegurado.",
    ejemplo:
      "Apuestas 20€ a cuota 2,20 con un seguro de 10€ en freebet si pierdes. Si falla la apuesta, tu pérdida real de dinero es solo 20 − 10 = 10€ (los otros 10€ vuelven como freebet, que puedes volver a jugar).",
    interpretacion:
      "En Hall of Bets, marcar \"Apuesta asegurada\" con un importe y luego marcar el resultado como \"Perdida\" acredita ese importe al saldo de freebet de la casa automáticamente — no hace falta añadirlo a mano.",
    erroresFrecuentes:
      "Olvidar rellenar el importe del seguro al crear la apuesta: si se te olvida, el freebet no se añade solo al marcarla como perdida, y hay que registrarlo a mano en \"Otro bono\".",
  },
  {
    id: "aumento-cuota",
    categoria: "bonos",
    nombre: "Aumento de cuota (odds boost)",
    definicion:
      "Promoción que añade un porcentaje extra sobre la ganancia neta de una apuesta si aciertas, sin cambiar la cuota que ves.",
    explicacion:
      "La cuota mostrada no cambia, pero si ganas, la casa te paga un % de más sobre el beneficio — no sobre el retorno total (stake + ganancia).",
    formula: "Beneficio con aumento = [Stake × (Cuota − 1)] × (1 + % aumento / 100)",
    ejemplo:
      "Cuota 4,00, stake 5€, aumento del 30%. Beneficio base = 5 × (4,00 − 1) = 15€. Con el 30% de aumento: 15 × 1,30 = 19,50€ (no 20€ × 1,30).",
    interpretacion:
      "El % se aplica siempre sobre la ganancia neta, nunca sobre el stake ni sobre el retorno total — un error fácil de cometer al calcularlo a mano.",
    erroresFrecuentes:
      "Calcular el aumento sobre el retorno total en vez de sobre la ganancia neta da un resultado más alto de lo que realmente paga la casa.",
  },
  {
    id: "promociones",
    categoria: "bonos",
    nombre: "Promociones de casas de apuestas",
    definicion:
      "Ofertas que lanzan las casas de apuestas para atraer o fidelizar clientes: bonos de bienvenida, apuestas aseguradas, aumentos de cuota, apuestas gratis por depósito, etc.",
    explicacion:
      "Son la forma que tienen las casas de competir entre ellas — y también la materia prima del matched betting: cada promo bien aprovechada es valor extra que no depende de acertar el resultado.",
    formula:
      "No tiene una fórmula propia: cada promo se registra con la herramienta que le corresponde en el formulario de apuesta — \"Apuesta asegurada\" (seguro), \"Aumento de cuota\" (boost), el campo \"Bono\" al hacer un ingreso (bono de depósito), o \"Otro bono\" en Casas de apuestas para el resto.",
    ejemplo:
      "\"Apuesta 10€ y llévate un bono de 30€\" es un bono de depósito (se registra en el ingreso). \"Si pierde tu primera apuesta, te la devolvemos\" es una apuesta asegurada. \"Cuota mejorada al 5,00 en el Real Madrid\" es un aumento de cuota.",
    interpretacion:
      "Esta app no tiene una sección propia de \"Promociones\" (se eliminó a propósito): cada promo se registra como una apuesta normal con la casilla o el campo que le corresponde, y afecta al beneficio y al saldo de freebet solos.",
    erroresFrecuentes:
      "Registrar una promo como una apuesta suelta sin usar ninguna de las herramientas del formulario (seguro, aumento, bono) hace que su valor no se refleje bien en las estadísticas.",
  },
  {
    id: "matched-betting",
    categoria: "bonos",
    nombre: "Matched Betting",
    definicion:
      "Técnica que combina una apuesta a favor en una casa de apuestas (\"back\") con una apuesta en contra en una casa de intercambio o exchange (\"lay\", p.ej. Betfair Exchange), para cubrir todos los resultados posibles de un evento.",
    explicacion:
      "En vez de apostar \"a ciegas\" a un resultado, apuestas también en su contra: así, pase lo que pase, el resultado combinado de las dos apuestas es prácticamente el mismo. Se usa sobre todo para extraer el valor de bonos y promociones de las casas de apuestas (también llamadas \"bookers\" o \"bookies\" en la jerga) sin depender de acertar nada.",
    formula:
      "Con dinero real (apuesta de calificación): Importe lay = (Cuota back × Importe back) / (Cuota lay − Comisión del exchange). Con un freebet (el stake no se devuelve): Importe lay = (Importe freebet × (Cuota back − 1)) / (Cuota lay − Comisión). Riesgo asumido en el exchange = Importe lay × (Cuota lay − 1).",
    ejemplo:
      "Bet365 ofrece \"apuesta 20€ y recibe 10€ en freebet si pierdes\". Apuestas 20€ a que gana un equipo a cuota 2,00, y a la vez apuestas en contra (\"lay\") unos 20,20€ en Betfair Exchange a cuota 2,00 con un 5% de comisión: pase lo que pase, ganas o pierdes casi lo mismo en las dos apuestas (la pequeña diferencia es el \"coste\" de activar el freebet). Si pierde la apuesta real, recibes los 10€ en freebet, que puedes \"cubrir\" de la misma forma para sacar unos 7-8€ limpios sin arriesgar nada.",
    interpretacion:
      "Bien hecho, el matched betting da un beneficio pequeño pero casi garantizado por cada promoción: no depende de acertar resultados, sino de cubrir matemáticamente todos los posibles. La apuesta de calificación (con dinero real) suele tener un coste pequeño (1-3% del stake); de un freebet se suele poder sacar entre un 70% y un 80% de su valor en dinero real, según la cuota y la comisión usadas.",
    erroresFrecuentes:
      "Olvidar la comisión del exchange al calcular el importe lay (el resultado deja de estar bien cubierto), o tardar en confirmar las dos apuestas mientras las cuotas cambian — el \"cuadre\" se rompe si el mercado se mueve entre una apuesta y la otra.",
  },
];
