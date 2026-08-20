export default function FiltrosApuestas({
  casas,
  filtroCasa,
  onCambiarCasa,
  filtroFondos,
  onCambiarFondos,
  verArchivadas,
  onCambiarVerArchivadas,
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {casas.length > 0 && (
        <select
          value={filtroCasa}
          onChange={(e) => onCambiarCasa(e.target.value)}
          className="border border-line rounded-lg px-3 py-1.5 text-sm bg-surface text-ink"
        >
          <option value="todas">Todas las casas</option>
          {casas.map((casa) => (
            <option key={casa.nombre} value={casa.nombre}>
              {casa.nombre}
            </option>
          ))}
        </select>
      )}

      <select
        value={filtroFondos}
        onChange={(e) => onCambiarFondos(e.target.value)}
        className="border border-line rounded-lg px-3 py-1.5 text-sm bg-surface text-ink"
      >
        <option value="todas">Todos los fondos</option>
        <option value="real">Real</option>
        <option value="freebet">Freebet</option>
        <option value="mixta">Mixta</option>
      </select>

      <label className="flex items-center gap-1.5 text-sm text-slate cursor-pointer">
        <input
          type="checkbox"
          checked={verArchivadas}
          onChange={(e) => onCambiarVerArchivadas(e.target.checked)}
          className="accent-gold"
        />
        Ver también archivado
      </label>
    </div>
  );
}
