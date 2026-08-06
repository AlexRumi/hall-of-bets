import { GraduationCap } from "lucide-react";

// Placeholder: la fase 20 del guion rellena esto con contenido educativo
// (Stake, ROI, Yield, Bankroll, Cuota, etc.).
export default function Academia() {
  return (
    <div className="bg-surface border border-line rounded-xl p-10 text-center space-y-2">
      <GraduationCap size={32} className="text-gold mx-auto" />
      <p className="font-display text-lg font-semibold text-ink">Academia</p>
      <p className="text-sm text-slate">Próximamente.</p>
    </div>
  );
}
