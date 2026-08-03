/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        felt: "#0F3D2E",
        feltDark: "#0A2A20",
        paper: "#F7F4EA",
        paperDim: "#EDE8D9",
        ink: "#1C1C1C",
        slate: "#6B6357",
        gold: "#B8934D",
        line: "#D9D2BC",
        win: "#1E8E5A",
        lose: "#C0392B",
        pending: "#B8934D",
        void: "#8B8478",
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
