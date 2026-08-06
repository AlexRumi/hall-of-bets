import { useEffect } from "react";
import { Award, Medal, Trophy } from "lucide-react";

const ICONO_TIER = { bronce: Award, plata: Medal, oro: Trophy };

export default function NotificacionTrofeo({ trofeo, onCerrar }) {
  useEffect(() => {
    if (!trofeo) return;
    const temporizador = setTimeout(onCerrar, 4000);
    return () => clearTimeout(temporizador);
  }, [trofeo, onCerrar]);

  if (!trofeo) return null;
  const Icono = ICONO_TIER[trofeo.tier];

  return (
    <button
      type="button"
      onClick={onCerrar}
      className="fixed bottom-20 md:bottom-6 left-1/2 z-50 flex items-center gap-3 bg-felt text-paper border border-gold rounded-xl px-4 py-3 shadow-lg"
      style={{ animation: "trofeo-entrada 0.25s ease-out forwards" }}
    >
      <Icono size={22} className="text-gold shrink-0" />
      <div className="text-left">
        <p className="text-xs uppercase tracking-wide text-gold">
          Trofeo conseguido
        </p>
        <p className="text-sm font-medium">{trofeo.nombre}</p>
      </div>
    </button>
  );
}
