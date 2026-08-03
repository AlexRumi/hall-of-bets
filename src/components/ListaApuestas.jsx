import ApuestaItem from "./ApuestaItem";

export default function ListaApuestas({ apuestas, onMarcarResultado, onBorrar }) {
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
          onMarcarResultado={onMarcarResultado}
          onBorrar={onBorrar}
        />
      ))}
    </div>
  );
}
