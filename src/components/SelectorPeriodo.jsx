const PERIODOS = [
  { id: "todo", etiqueta: "Todo" },
  { id: "hoy", etiqueta: "Hoy" },
  { id: "semana", etiqueta: "Semana" },
  { id: "mes", etiqueta: "Mes" },
  { id: "anio", etiqueta: "Año" },
];

export default function SelectorPeriodo({ activo, onCambiar }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PERIODOS.map(({ id, etiqueta }) => (
        <button
          key={id}
          type="button"
          onClick={() => onCambiar(id)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            activo === id
              ? "bg-felt text-paper border-felt"
              : "border-line text-slate hover:text-ink"
          }`}
        >
          {etiqueta}
        </button>
      ))}
    </div>
  );
}
