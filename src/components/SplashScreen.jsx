import { useEffect, useState } from "react";

// Pantalla de carga a pantalla completa al abrir la app. "visible" lo
// controla App.jsx: se queda montada mientras haya que mostrarla, y sigue
// un momento más tras dejar de ser visible para que se vea el fundido antes
// de desaparecer del todo (si no, el fundido no llegaría a verse).
export default function SplashScreen({ visible }) {
  const [montado, setMontado] = useState(true);

  useEffect(() => {
    if (visible) return;
    const temporizador = setTimeout(() => setMontado(false), 500);
    return () => clearTimeout(temporizador);
  }, [visible]);

  if (!montado) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      style={{ backgroundColor: "#0A2A20" }}
    >
      <img
        src="/splash-badge.png"
        alt="Hall of Bets"
        className="w-40 h-40 sm:w-52 sm:h-52"
      />
    </div>
  );
}
