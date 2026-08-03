import { Flame } from "lucide-react";

export default function RachaActual({ racha }) {
  if (racha === 0) return null;

  return (
    <div className="flex items-center gap-2 bg-gold/10 border border-gold/30 text-gold rounded-lg px-4 py-2 w-fit">
      <Flame size={16} />
      <span className="text-sm font-medium">
        Racha actual: {racha} {racha === 1 ? "victoria" : "victorias"} seguidas
      </span>
    </div>
  );
}
