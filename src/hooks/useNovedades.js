import { useState } from "react";
import { NOVEDADES } from "../data/novedades";

// Mismo patrón que useTrofeos.js ("trofeos-vistos"): qué novedades ya se
// han visto se queda en localStorage de CADA DISPOSITIVO, no se
// sincroniza — un "ya lo he leído" no aporta nada al verlo desde otro
// aparato, a diferencia de las ligas favoritas (ver useAjustes.js), que sí
// tiene sentido llevarlas encima a todos lados.
const CLAVE_ALMACENAMIENTO = "hall-of-bets:novedades-vistas";

function cargarVistas() {
  try {
    const guardado = localStorage.getItem(CLAVE_ALMACENAMIENTO);
    return guardado ? JSON.parse(guardado) : [];
  } catch {
    return [];
  }
}

export function useNovedades() {
  const [vistas, setVistas] = useState(() => new Set(cargarVistas()));
  const noVistas = NOVEDADES.filter((n) => !vistas.has(n.id)).length;

  // Se llama al abrir la sección "Novedades" — marca TODAS como vistas de
  // golpe (no hace falta ir una a una, es solo un aviso de "hay algo
  // nuevo", no una bandeja de mensajes).
  function marcarTodoVisto() {
    const todas = new Set(NOVEDADES.map((n) => n.id));
    setVistas(todas);
    try {
      localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify([...todas]));
    } catch {
      // Sin acceso a localStorage (privado/bloqueado): no pasa nada, el
      // aviso se repetirá la próxima vez, pero la app sigue funcionando.
    }
  }

  return { novedades: NOVEDADES, noVistas, marcarTodoVisto };
}
