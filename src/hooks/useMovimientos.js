import { useEffect, useState } from "react";

const CLAVE_ALMACENAMIENTO = "hall-of-bets:movimientos";

function cargarMovimientos() {
  try {
    const guardado = localStorage.getItem(CLAVE_ALMACENAMIENTO);
    return guardado ? JSON.parse(guardado) : [];
  } catch {
    return [];
  }
}

export function useMovimientos() {
  const [movimientos, setMovimientos] = useState(cargarMovimientos);

  useEffect(() => {
    localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(movimientos));
  }, [movimientos]);

  function agregarMovimiento({ fecha, casa, tipo, cantidad }) {
    const nuevo = {
      id: crypto.randomUUID(),
      fecha,
      casa,
      tipo,
      cantidad: Number(cantidad),
    };
    setMovimientos((actuales) => [nuevo, ...actuales]);
  }

  function borrarMovimiento(id) {
    setMovimientos((actuales) => actuales.filter((m) => m.id !== id));
  }

  function borrarTodosMovimientos() {
    setMovimientos([]);
  }

  return {
    movimientos,
    agregarMovimiento,
    borrarMovimiento,
    borrarTodosMovimientos,
  };
}
