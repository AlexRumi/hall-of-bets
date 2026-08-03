import {
  Wallet,
  Gamepad2,
  Gift,
  Trophy,
  Landmark,
  CalendarDays,
  PieChart,
} from "lucide-react";

const FILAS = [
  [
    { id: "apuestas", etiqueta: "Apuestas", Icono: Wallet },
    { id: "entretenimiento", etiqueta: "Entretenimiento", Icono: Gamepad2 },
    { id: "promociones", etiqueta: "Promociones", Icono: Gift },
  ],
  [
    { id: "informe", etiqueta: "Informe", Icono: CalendarDays },
    { id: "desglose", etiqueta: "Desglose", Icono: PieChart },
    { id: "casas", etiqueta: "Casas de apuestas", Icono: Landmark },
    { id: "trofeos", etiqueta: "Trofeos", Icono: Trophy },
  ],
];

export default function SelectorSeccion({ activa, onCambiar }) {
  return (
    <div className="flex flex-col items-center gap-2">
      {FILAS.map((fila, indice) => (
        <div
          key={indice}
          className="flex flex-wrap justify-center gap-2 bg-paperDim border border-line rounded-full p-1"
        >
          {fila.map(({ id, etiqueta, Icono }) => (
            <button
              key={id}
              type="button"
              onClick={() => onCambiar(id)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activa === id
                  ? "bg-felt text-paper"
                  : "text-slate hover:text-ink"
              }`}
            >
              <Icono size={15} />
              {etiqueta}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
