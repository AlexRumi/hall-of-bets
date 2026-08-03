export default function FiltrosApuestas({
  casas,
  filtroCasa,
  onCambiarCasa,
  filtroFondos,
  onCambiarFondos,
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {casas.length > 0 && (
        <select
          value={filtroCasa}
          onChange={(e) => onCambiarCasa(e.target.value)}
          className="border border-line rounded-lg px-3 py-1.5 text-sm bg-white text-ink"
        >
          <option value="todas">Todas las casas</option>
          {casas.map((casa) => (
            <option key={casa} value={casa}>
              {casa}
            </option>
          ))}
        </select>
      )}

      <select
        value={filtroFondos}
        onChange={(e) => onCambiarFondos(e.target.value)}
        className="border border-line rounded-lg px-3 py-1.5 text-sm bg-white text-ink"
      >
        <option value="todas">Todos los fondos</option>
        <option value="real">Real</option>
        <option value="freebet">Freebet</option>
      </select>
    </div>
  );
}
