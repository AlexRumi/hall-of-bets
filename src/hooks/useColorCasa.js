import { useEffect, useState } from "react";
import { colorDesdeNombre, extraerColorDominante } from "../utils/colorCasa";

// Caché a nivel de módulo (no por componente): el color de una casa se
// calcula una sola vez aunque haya muchas apuestas suyas en pantalla.
const cache = new Map();

// Color "de firma" de una casa: si tiene logo, su color medio (sacado del
// propio logo, en cuanto carga); si no, un color fijo a partir del nombre.
// Así cada casa se ve siempre con el mismo color en toda la app.
export function useColorCasa(casa) {
  const [color, setColor] = useState(
    () => cache.get(casa?.nombre) ?? colorDesdeNombre(casa?.nombre ?? "")
  );

  useEffect(() => {
    if (!casa?.nombre) return;

    if (cache.has(casa.nombre)) {
      setColor(cache.get(casa.nombre));
      return;
    }

    if (!casa.logo) {
      const propio = colorDesdeNombre(casa.nombre);
      cache.set(casa.nombre, propio);
      setColor(propio);
      return;
    }

    let vivo = true;
    extraerColorDominante(casa.logo).then((extraido) => {
      const final = extraido ?? colorDesdeNombre(casa.nombre);
      cache.set(casa.nombre, final);
      if (vivo) setColor(final);
    });
    return () => {
      vivo = false;
    };
  }, [casa?.nombre, casa?.logo]);

  return color;
}
