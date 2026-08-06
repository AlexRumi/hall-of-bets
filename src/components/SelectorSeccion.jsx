import { Home, Wallet, Gamepad2 } from "lucide-react";

const SECCIONES = [
  { id: "inicio", etiqueta: "Inicio", Icono: Home },
  { id: "apuestas", etiqueta: "Apuestas", Icono: Wallet },
  { id: "entretenimiento", etiqueta: "Entretenimiento", Icono: Gamepad2 },
];

export default function SelectorSeccion({ activa, onCambiar }) {
  return (
    <div className="flex flex-wrap justify-center gap-2 bg-paperDim border border-line rounded-full p-1 w-fit mx-auto">
      {SECCIONES.map(({ id, etiqueta, Icono }) => (
        <button
          key={id}
          type="button"
          onClick={() => onCambiar(id)}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            activa === id ? "bg-felt text-paper" : "text-slate hover:text-ink"
          }`}
        >
          <Icono size={15} />
          {etiqueta}
        </button>
      ))}
    </div>
  );
}
