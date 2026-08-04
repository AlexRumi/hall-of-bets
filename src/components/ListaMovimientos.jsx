import MovimientoItem from "./MovimientoItem";

export default function ListaMovimientos({ movimientos, casas, onBorrar }) {
  if (movimientos.length === 0) {
    return (
      <p className="text-center text-sm text-slate py-10">
        Todavía no hay movimientos registrados.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {movimientos.map((movimiento) => (
        <MovimientoItem
          key={movimiento.id}
          movimiento={movimiento}
          casas={casas}
          onBorrar={onBorrar}
        />
      ))}
    </div>
  );
}
