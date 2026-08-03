import { useEffect, useRef, useState } from "react";
import { evaluarTrofeos } from "../utils/trofeos";

const CLAVE_ALMACENAMIENTO = "hall-of-bets:trofeos-vistos";

function cargarVistos() {
  try {
    const guardado = localStorage.getItem(CLAVE_ALMACENAMIENTO);
    return guardado ? JSON.parse(guardado) : null;
  } catch {
    return null;
  }
}

export function useTrofeos(apuestas, promociones) {
  const trofeos = evaluarTrofeos(apuestas, promociones);
  const idsConseguidos = trofeos.filter((t) => t.conseguido).map((t) => t.id);
  const [notificacion, setNotificacion] = useState(null);

  // La primera vez que se usa esto no hay nada guardado todavía: damos por
  // "ya vistos" los trofeos que ya tuvieras conseguidos, para no disparar de
  // golpe una notificación por cada logro que ya tenías de antes.
  const vistos = useRef(new Set(cargarVistos() ?? idsConseguidos));

  useEffect(() => {
    const nuevos = idsConseguidos.filter((id) => !vistos.current.has(id));
    if (nuevos.length === 0) return;

    nuevos.forEach((id) => vistos.current.add(id));
    localStorage.setItem(
      CLAVE_ALMACENAMIENTO,
      JSON.stringify([...vistos.current])
    );
    setNotificacion(trofeos.find((t) => t.id === nuevos[0]));
    // Comparamos la lista de IDs conseguidos como texto para que el efecto
    // solo se dispare cuando cambia de verdad, no en cada render (el array
    // "trofeos" es uno nuevo cada vez que se llama a este hook).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsConseguidos.join(",")]);

  return {
    trofeos,
    notificacion,
    cerrarNotificacion: () => setNotificacion(null),
  };
}
