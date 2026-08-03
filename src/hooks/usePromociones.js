import { useEffect, useState } from "react";

const CLAVE_ALMACENAMIENTO = "hall-of-bets:promociones";

// Las promociones guardadas antes de añadir el campo "casa" no lo tienen.
function migrarPromocion(promocion) {
  return promocion.casa ? promocion : { ...promocion, casa: "Sin especificar" };
}

function cargarPromociones() {
  try {
    const guardado = localStorage.getItem(CLAVE_ALMACENAMIENTO);
    return guardado ? JSON.parse(guardado).map(migrarPromocion) : [];
  } catch {
    return [];
  }
}

export function usePromociones() {
  const [promociones, setPromociones] = useState(cargarPromociones);

  useEffect(() => {
    localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(promociones));
  }, [promociones]);

  function agregarPromocion({ fecha, casa, tipo, valor }) {
    const nueva = {
      id: crypto.randomUUID(),
      fecha,
      casa,
      tipo,
      valor: Number(valor),
      estado: "pendiente",
      beneficioNeto: null,
    };
    setPromociones((actuales) => [nueva, ...actuales]);
  }

  // El beneficio neto no se puede calcular solo (cada promoción funciona
  // distinto), así que lo introduce el usuario al resolverla.
  function resolverPromocion(id, estado, beneficioNeto) {
    setPromociones((actuales) =>
      actuales.map((promocion) =>
        promocion.id === id
          ? { ...promocion, estado, beneficioNeto: Number(beneficioNeto) }
          : promocion
      )
    );
  }

  function borrarPromocion(id) {
    setPromociones((actuales) =>
      actuales.filter((promocion) => promocion.id !== id)
    );
  }

  function borrarTodasPromociones() {
    setPromociones([]);
  }

  return {
    promociones,
    agregarPromocion,
    resolverPromocion,
    borrarPromocion,
    borrarTodasPromociones,
  };
}
