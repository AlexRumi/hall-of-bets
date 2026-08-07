import { useState } from "react";
import { Target, Pencil, Trash2, Check } from "lucide-react";
import { calcularProgresoObjetivo } from "../utils/objetivos";

const TIPOS = [
  { id: "beneficio", etiqueta: "Beneficio" },
  { id: "yield", etiqueta: "Yield" },
  { id: "num_apuestas", etiqueta: "Nº apuestas" },
  { id: "acierto", etiqueta: "% Acierto" },
];

const PERIODOS = [
  { id: "semana", etiqueta: "Semana" },
  { id: "mes", etiqueta: "Mes" },
  { id: "anio", etiqueta: "Año" },
];

// Un objetivo activo por bankroll, con barra de progreso calculada contra
// el periodo actual (ver utils/objetivos.js). Mismo lenguaje visual que la
// barra de progreso de un trofeo en SalaTrofeos.jsx.
export default function ObjetivoPersonal({ categoria, apuestasDelBankroll, objetivo, onGuardar, onBorrar }) {
  const [editando, setEditando] = useState(false);
  const [tipo, setTipo] = useState(objetivo?.tipo ?? "beneficio");
  const [periodo, setPeriodo] = useState(objetivo?.periodo ?? "mes");
  const [valor, setValor] = useState(objetivo?.valorObjetivo ?? "");

  function manejarGuardar(e) {
    e.preventDefault();
    const numero = Number(valor);
    if (!numero || numero <= 0) return;
    onGuardar({ categoria, tipo, periodo, valorObjetivo: numero });
    setEditando(false);
  }

  function abrirEdicion() {
    setTipo(objetivo?.tipo ?? "beneficio");
    setPeriodo(objetivo?.periodo ?? "mes");
    setValor(objetivo?.valorObjetivo ?? "");
    setEditando(true);
  }

  if (editando) {
    return (
      <form
        onSubmit={manejarGuardar}
        className="bg-surface border border-line rounded-xl p-4 space-y-3"
      >
        <p className="flex items-center gap-2 text-sm font-medium text-ink">
          <Target size={16} className="text-gold" />
          {objetivo ? "Editar objetivo" : "Definir objetivo"}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="w-full border border-line rounded-lg px-2 py-1.5 text-sm bg-surface text-ink"
          >
            {TIPOS.map(({ id, etiqueta }) => (
              <option key={id} value={id}>
                {etiqueta}
              </option>
            ))}
          </select>
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="w-full border border-line rounded-lg px-2 py-1.5 text-sm bg-surface text-ink"
          >
            {PERIODOS.map(({ id, etiqueta }) => (
              <option key={id} value={id}>
                {etiqueta}
              </option>
            ))}
          </select>
        </div>
        <input
          type="number"
          min="0"
          step="0.01"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="Valor objetivo"
          required
          className="w-full border border-line rounded-lg px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex items-center gap-1.5 bg-felt text-paper px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-feltDark transition-colors"
          >
            <Check size={14} />
            Guardar
          </button>
          <button
            type="button"
            onClick={() => setEditando(false)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate hover:text-ink transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  if (!objetivo) {
    return (
      <button
        type="button"
        onClick={abrirEdicion}
        className="flex items-center gap-2 border border-dashed border-line rounded-lg px-4 py-2 text-sm text-slate hover:text-gold hover:border-gold/40 transition-colors w-fit"
      >
        <Target size={16} />
        Definir objetivo
      </button>
    );
  }

  const progreso = calcularProgresoObjetivo(objetivo, apuestasDelBankroll);

  return (
    <div className="bg-surface border border-line rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-medium text-ink">
          <Target size={16} className={progreso.cumplido ? "text-win" : "text-gold"} />
          {TIPOS.find((t) => t.id === objetivo.tipo)?.etiqueta}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={abrirEdicion}
            aria-label="Editar objetivo"
            className="p-1 rounded-full text-slate hover:text-ink hover:bg-paperDim transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={() => onBorrar(categoria)}
            aria-label="Borrar objetivo"
            className="p-1 rounded-full text-slate hover:text-lose hover:bg-paperDim transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="h-1.5 rounded-full bg-paperDim overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${progreso.cumplido ? "bg-win" : "bg-gold"}`}
          style={{ width: `${progreso.pct}%` }}
        />
      </div>
      <p className="text-xs font-mono text-slate">{progreso.texto}</p>
    </div>
  );
}
