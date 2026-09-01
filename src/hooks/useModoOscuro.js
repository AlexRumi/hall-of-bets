import { useEffect } from "react";

// Petición directa: se quita el selector claro/oscuro (icono de escritorio
// y opción del menú "Más" en móvil) — se queda fijo en oscuro, que es el
// que prefiere el usuario. "oscuro" se sigue devolviendo (siempre true)
// porque varios componentes de gráficas (recharts necesita colores hex,
// no puede leer las variables CSS) todavía lo reciben como prop para elegir
// su paleta — así no hace falta tocarlos.
export function useModoOscuro() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return { oscuro: true };
}
