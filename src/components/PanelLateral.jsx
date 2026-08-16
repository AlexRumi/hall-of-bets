import { useEffect, useRef, useState } from "react";

// Panel lateral de escritorio (desliza desde la derecha): mecanismo
// reutilizable, extraído del panel de detalle de apuesta que ya existía
// en ListaApuestas.jsx (mismo backdrop + transición) para no duplicarlo
// una segunda vez con el panel de "Añadir apuesta" (App.jsx). "abierto"
// controla el montaje; el propio componente arranca fuera de pantalla y
// se desliza a su sitio un frame después de montarse (si apareciera ya
// en su posición final, no habría nada que animar). Solo escritorio —
// en móvil no se monta nada (mismo criterio que el resto de paneles de
// este rediseño).
export default function PanelLateral({ abierto, onCerrar, children, anchoMax = "max-w-xl" }) {
  const [listo, setListo] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!abierto) {
      setListo(false);
      return;
    }
    // Empieza siempre arriba del todo (defensivo, por si algo interno
    // dejara el panel scrolleado al abrirse).
    if (panelRef.current) panelRef.current.scrollTop = 0;
    const id = requestAnimationFrame(() => setListo(true));
    return () => cancelAnimationFrame(id);
  }, [abierto]);

  if (!abierto) return null;

  return (
    // z-[70]: por encima de la cabecera (z-[60] en App.jsx — a propósito
    // ahí, para poder seguir usando modo oscuro/cerrar sesión con un
    // modal CENTRADO abierto detrás) — pero un panel a pantalla completa
    // como este necesita justo lo contrario: taparla entera mientras está
    // abierto, si no la cabecera le comía la parte de arriba (bug real,
    // detectado por el usuario).
    <div
      className="hidden md:flex fixed inset-0 bg-black/50 z-[70] justify-end"
      onClick={onCerrar}
    >
      <div
        ref={panelRef}
        className={`w-full ${anchoMax} h-full bg-surface border-l border-line overflow-y-auto scrollbar-oculto transition-transform duration-200 ease-out ${
          listo ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
