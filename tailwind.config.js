/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // felt/feltDark/paper son el "cromo" fijo de la cabecera y botones
        // (verde fieltro + texto crema): no cambian entre modo claro/oscuro.
        felt: "#0F3D2E",
        feltDark: "#0A2A20",
        paper: "#F7F4EA",
        // El resto son variables CSS (ver src/index.css): su valor cambia
        // según haya o no la clase "dark" en <html>.
        fondo: "var(--color-fondo)",
        surface: "var(--color-surface)",
        paperDim: "var(--color-paper-dim)",
        ink: "var(--color-ink)",
        line: "var(--color-line)",
        slate: "rgb(var(--color-slate) / <alpha-value>)",
        gold: "rgb(var(--color-gold) / <alpha-value>)",
        win: "rgb(var(--color-win) / <alpha-value>)",
        lose: "rgb(var(--color-lose) / <alpha-value>)",
        pending: "rgb(var(--color-pending) / <alpha-value>)",
        void: "rgb(var(--color-void) / <alpha-value>)",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        mono: ["IBM Plex Mono", "monospace"],
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
