export default function ConfirmDialog({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = "Borrar",
  onConfirmar,
  onCancelar,
}) {
  if (!abierto) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface border border-line rounded-xl p-6 max-w-sm w-full space-y-4">
        <h3 className="font-display text-lg font-semibold text-ink">{titulo}</h3>
        <p className="text-sm text-slate">{mensaje}</p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancelar}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-line text-slate hover:text-ink transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-lose text-paper hover:opacity-90 transition-opacity"
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
