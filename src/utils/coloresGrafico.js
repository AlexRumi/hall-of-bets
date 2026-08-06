// Recharts pinta con SVG y necesita colores reales (no puede leer variables
// CSS ni clases de Tailwind), así que aquí se repiten los mismos valores que
// ya existen en src/index.css, para que las gráficas también respeten el
// modo oscuro.
const CLARO = {
  linea: "#D9D2BC",
  texto: "#6B6357",
  gold: "#B8934D",
  win: "#1E8E5A",
  lose: "#C0392B",
  pending: "#B8934D",
  void: "#8B8478",
};

const OSCURO = {
  linea: "#332D22",
  texto: "#A89C87",
  gold: "#D8B378",
  win: "#34C77E",
  lose: "#E1685A",
  pending: "#D8B378",
  void: "#9C9284",
};

export function coloresGrafico(oscuro) {
  return oscuro ? OSCURO : CLARO;
}
