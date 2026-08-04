/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        felt: "#0F3D2E",
        feltDark: "#0A2A20",
        paper: "#F7F4EA",
        fondo: "#F7F4EA",
        surface: "#FFFFFF",
        paperDim: "#EDE8D9",
        ink: "#1C1C1C",
        line: "#D9D2BC",
        slate: "#6B6357",
        // Acentos con opacidad (bg-gold/10, bg-win/10...): "R G B" para que
        // Tailwind pueda aplicarles transparencia.
        gold: "rgb(184 147 77 / <alpha-value>)",
        goldDark: "#7C6434",
        win: "rgb(30 142 90 / <alpha-value>)",
        lose: "rgb(192 57 43 / <alpha-value>)",
        pending: "rgb(184 147 77 / <alpha-value>)",
        void: "rgb(139 132 120 / <alpha-value>)",
        // Niveles de trofeo (el nivel "oro" reutiliza el dorado de acento de arriba).
        bronce: "rgb(181 101 29 / <alpha-value>)",
        plata: "rgb(152 162 172 / <alpha-value>)",
        platino: "rgb(110 140 160 / <alpha-value>)",
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
