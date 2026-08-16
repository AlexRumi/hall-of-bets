import { Award, Medal, Trophy, Crown, Lock } from "lucide-react";
import { CATEGORIAS } from "../utils/trofeos";

const TIERS = ["bronce", "plata", "oro", "platino"];
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

function FilaTrofeo({ trofeo }) {
  const Icono = ICONO_TIER[trofeo.tier];
  const esSecreto = trofeo.oculto && !trofeo.conseguido;
  const estado = trofeo.conseguido ? "conseguido" : "pendiente";

  return (
    <div
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
            trofeo.conseguido ? "font-semibold text-ink" : "font-medium text-slate"
          }`}
        >
          {esSecreto ? "Desafío sorpresa" : trofeo.nombre}
        </p>
        <p className="text-xs text-slate">
          {esSecreto
            ? "Sigue registrando apuestas y usando la app: se desbloqueará solo."
            : trofeo.descripcion}
        </p>

        {trofeo.progreso && !trofeo.conseguido && (
          <div className="mt-1.5 max-w-xs">
            <div className="h-1.5 rounded-full bg-paperDim overflow-hidden">
              <div
                className="h-full bg-gold/60 rounded-full transition-all"
                style={{ width: `${trofeo.progreso.pct}%` }}
              />
            </div>
            <p className="text-[10px] font-mono text-slate mt-0.5">
              {trofeo.progreso.texto}
            </p>
          </div>
        )}
      </div>

      <span
        className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
          esSecreto ? "border border-void/40 text-void" : BADGE_COLOR[trofeo.tier][estado]
        }`}
      >
        {esSecreto ? "???" : ETIQUETA_TIER[trofeo.tier]}
      </span>
    </div>
  );
}

export default function SalaTrofeos({ trofeos }) {
  const conseguidos = trofeos.filter((t) => t.conseguido).length;
  const pctTotal = trofeos.length
    ? Math.round((conseguidos / trofeos.length) * 100)
    : 0;

  const resumenTiers = TIERS.map((tier) => {
    const deEseTier = trofeos.filter((t) => t.tier === tier);
    return {
      tier,
      conseguidos: deEseTier.filter((t) => t.conseguido).length,
      total: deEseTier.length,
    };
  });

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-line rounded-xl p-5 space-y-3">
        <div className="text-center">
          <p className="text-sm text-slate">
            {conseguidos} de {trofeos.length} trofeos conseguidos
          </p>
          <p className="font-mono text-3xl font-bold text-gold">{pctTotal}%</p>
        </div>

        <div className="h-2 rounded-full bg-paperDim overflow-hidden">
          <div
            className="h-full bg-gold rounded-full transition-all"
            style={{ width: `${pctTotal}%` }}
          />
        </div>

        <div className="flex items-center justify-center gap-4 pt-3 border-t border-line flex-wrap">
          {resumenTiers.map(({ tier, conseguidos, total }) => {
            const Icono = ICONO_TIER[tier];
            return (
              <div key={tier} className="flex items-center gap-1.5">
                <Icono
                  size={15}
                  className={
                    conseguidos > 0 ? ICONO_COLOR[tier].conseguido : ICONO_COLOR[tier].pendiente
                  }
                />
                <span className="font-mono text-xs text-slate">
                  {conseguidos}/{total}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {CATEGORIAS.map(({ id, etiqueta }) => {
        const trofeosCategoria = trofeos.filter((t) => t.categoria === id);
        if (trofeosCategoria.length === 0) return null;

        return (
          <div key={id} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate px-1">
              {etiqueta}
            </h3>
            {/* Dos columnas desde "lg:" (rediseño de escritorio ancho): cada
                fila ya se compone bien a cualquier ancho (icono + texto +
                pastilla), así que no hace falta rediseñarlas — sueltas, una
                debajo de otra a todo el ancho de la página, se veían
                clavadas con mucho hueco vacío a la derecha. En móvil, una
                columna como siempre. */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {trofeosCategoria.map((trofeo) => (
                <FilaTrofeo key={trofeo.id} trofeo={trofeo} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
