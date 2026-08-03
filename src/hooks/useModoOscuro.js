import { useEffect, useState } from "react";

const CLAVE_ALMACENAMIENTO = "hall-of-bets:modo-oscuro";

function obtenerPreferenciaInicial() {
  try {
    const guardado = localStorage.getItem(CLAVE_ALMACENAMIENTO);
    if (guardado !== null) return guardado === "true";
  } catch {
    // localStorage no disponible: seguimos con la preferencia del sistema.
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function useModoOscuro() {
  const [oscuro, setOscuro] = useState(obtenerPreferenciaInicial);

  // La clase "dark" en <html> es lo que activa las variables oscuras de index.css.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", oscuro);
    localStorage.setItem(CLAVE_ALMACENAMIENTO, String(oscuro));
  }, [oscuro]);

  return { oscuro, alternar: () => setOscuro((actual) => !actual) };
}
