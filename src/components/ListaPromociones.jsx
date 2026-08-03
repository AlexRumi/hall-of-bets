import PromocionItem from "./PromocionItem";

export default function ListaPromociones({ promociones, casas, onResolver, onBorrar }) {
  if (promociones.length === 0) {
    return (
      <p className="text-center text-sm text-slate py-10">
        Todavía no hay promociones registradas.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {promociones.map((promocion) => (
        <PromocionItem
          key={promocion.id}
          promocion={promocion}
          casas={casas}
          onResolver={onResolver}
          onBorrar={onBorrar}
        />
      ))}
    </div>
  );
}
