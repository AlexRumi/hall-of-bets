import { Award, Medal, Trophy, Crown, Lock } from "lucide-react";

const ICONO_TIER = { bronce: Award, plata: Medal, oro: Trophy, platino: Crown };
const ETIQUETA_TIER = { bronce: "Bronce", plata: "Plata", oro: "Oro", platino: "Platino" };

// Tres estados bien diferenciados: conseguido (dorado y resaltado), visible
// pero pendiente (neutral) y secreto/bloqueado (fondo más oscuro para que
// se note que está bloqueado).
function estilosFila(trofeo, esSecreto) {
  if (trofeo.conseguido) return "border-2 border-gold bg-gold/10 shadow-sm";
  if (esSecreto) return "border border-line bg-paperDim";
  return "border border-line bg-surface";
}

export default function SalaTrofeos({ trofeos }) {
  const conseguidos = trofeos.filter((t) => t.conseguido).length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate text-center">
        {conseguidos} de {trofeos.length} trofeos conseguidos
      </p>

      <div className="space-y-2">
        {trofeos.map((trofeo) => {
          const Icono = ICONO_TIER[trofeo.tier];
          const esSecreto = trofeo.oculto && !trofeo.conseguido;

          return (
            <div
              key={trofeo.id}
              className={`flex items-center gap-3 rounded-xl p-3 sm:p-4 ${estilosFila(
                trofeo,
                esSecreto
              )}`}
            >
              <div className="shrink-0">
                {esSecreto ? (
                  <Lock size={20} className="text-slate" />
                ) : (
                  <Icono
                    size={20}
                    className={trofeo.conseguido ? "text-gold" : "text-slate"}
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm ${
                    trofeo.conseguido
                      ? "font-semibold text-ink"
                      : "font-medium text-slate"
                  }`}
                >
                  {esSecreto ? "???" : trofeo.nombre}
                </p>
                <p className="text-xs text-slate">
                  {esSecreto ? "Trofeo secreto" : trofeo.descripcion}
                </p>
              </div>

              <span
                className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                  trofeo.conseguido
                    ? "bg-gold/20 text-gold"
                    : "border border-slate/30 text-slate"
                }`}
              >
                {ETIQUETA_TIER[trofeo.tier]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
