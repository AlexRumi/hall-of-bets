import { useEffect, useState } from "react";

const CLAVE_ALMACENAMIENTO = "hall-of-bets:casas";

// Las casas guardadas antes de tener logo eran solo el nombre en texto.
function migrarCasa(casa) {
  return typeof casa === "string" ? { nombre: casa, logo: null } : casa;
}

function cargarCasas() {
  try {
    const guardado = localStorage.getItem(CLAVE_ALMACENAMIENTO);
    return guardado ? JSON.parse(guardado).map(migrarCasa) : [];
  } catch {
    return [];
  }
}

export function useCasas() {
  const [casas, setCasas] = useState(cargarCasas);

  useEffect(() => {
    localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(casas));
  }, [casas]);

  // "logo" es opcional: una imagen en base64, o null si no se ha subido ninguna.
  function agregarCasa({ nombre, logo = null }) {
    const limpio = nombre.trim();
    if (!limpio) return;

    setCasas((actuales) =>
      actuales.some((casa) => casa.nombre.toLowerCase() === limpio.toLowerCase())
        ? actuales
        : [...actuales, { nombre: limpio, logo }]
    );
  }

  // Borrar una casa del registro no toca las apuestas/promociones ya
  // guardadas (su campo "casa" es solo texto); si se vuelve a añadir con el
  // mismo nombre, esas apuestas antiguas recuperan el logo automáticamente.
  function borrarCasa(nombre) {
    setCasas((actuales) => actuales.filter((casa) => casa.nombre !== nombre));
  }

  // Siempre en orden alfabético, así que cualquier casa nueva que se añada
  // en el futuro aparece sola en su sitio, sin tener que tocar nada más.
  const casasOrdenadas = [...casas].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es")
  );

  return { casas: casasOrdenadas, agregarCasa, borrarCasa };
}
