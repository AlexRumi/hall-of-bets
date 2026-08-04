import { Award, Medal, Trophy, Crown, Lock } from "lucide-react";

const ICONO_TIER = { bronce: Award, plata: Medal, oro: Trophy, platino: Crown };
const ETIQUETA_TIER = { bronce: "Bronce", plata: "Plata", oro: "Oro", platino: "Platino" };

// Clases literales (no interpoladas) para que Tailwind las detecte al compilar.
const ICONO_COLOR = {
  bronce: { conseguido: "text-bronce", pendiente: "text-bronce/50" },
  plata: { conseguido: "text-plata", pendiente: "text-plata/50" },
  oro: { conseguido: "text-gold", pendiente: "text-gold/50" },
  platino: { conseguido: "text-platino", pendiente: "text-platino/50" },
};

const BADGE_COLOR = {
  bronce: {
    conseguido: "bg-bronce/20 text-bronce",
    pendiente: "border border-bronce/40 text-bronce",
  },
  plata: {
    conseguido: "bg-plata/20 text-plata",
    pendiente: "border border-plata/40 text-plata",
  },
  oro: {
    conseguido: "bg-gold/20 text-gold",
    pendiente: "border border-gold/40 text-gold",
  },
  platino: {
    conseguido: "bg-platino/20 text-platino",
    pendiente: "border border-platino/40 text-platino",
  },
};

// Tres estados bien diferenciados: conseguido (dorado y resaltado), visible
// pero pendiente (neutral) y secreto/bloqueado (tono "void" aparte, para no
// delatar con qué color de nivel se corresponde antes de desbloquearlo).
function estilosFila(trofeo, esSecreto) {
  if (trofeo.conseguido) return "border-2 border-gold bg-gold/10 shadow-sm";
  if (esSecreto) return "border border-dashed border-void/40 bg-paperDim";
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
          const estado = trofeo.conseguido ? "conseguido" : "pendiente";

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
                  <Lock size={20} className="text-void" />
                ) : (
                  <Icono size={20} className={ICONO_COLOR[trofeo.tier][estado]} />
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
                  esSecreto
                    ? "border border-void/40 text-void"
                    : BADGE_COLOR[trofeo.tier][estado]
                }`}
              >
                {esSecreto ? "???" : ETIQUETA_TIER[trofeo.tier]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
