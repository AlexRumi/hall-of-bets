import ApuestaItem from "./ApuestaItem";

export default function ListaApuestas({
  apuestas,
  casas,
  movimientos,
  todasApuestas,
  onMarcarResultado,
  onBorrar,
  onEditar,
}) {
  if (apuestas.length === 0) {
    return (
      <p className="text-center text-sm text-slate py-10">
        Todavía no hay apuestas registradas.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {apuestas.map((apuesta) => (
        <ApuestaItem
          key={apuesta.id}
          apuesta={apuesta}
          casas={casas}
          movimientos={movimientos}
          todasApuestas={todasApuestas}
          onMarcarResultado={onMarcarResultado}
          onBorrar={onBorrar}
          onEditar={onEditar}
        />
      ))}
    </div>
  );
}
