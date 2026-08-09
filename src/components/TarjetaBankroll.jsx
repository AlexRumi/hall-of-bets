// Total grande arriba (dinero real + freebets) y su desglose de dos
// columnas debajo. Se extrajo de ListadoCasas.jsx (donde nació, para
// "Bankroll total" y su desglose por bankroll) para poder reutilizarla
// también arriba de Apuestas/Entretenimiento — mismo formato en los dos
// sitios, así cada tarjeta "cuadra" por sí sola en vez de un número suelto
// sin su desglose al lado.
export default function TarjetaBankroll({ etiqueta, dineroReal, freebets, grande = false }) {
  return (
    <div className="bg-surface border border-line rounded-xl p-5 sm:p-6 text-center space-y-4">
      <div>
        <p className="text-xs text-slate">{etiqueta}</p>
        <p className={`font-mono font-bold text-goldDark ${grande ? "text-3xl" : "text-2xl"}`}>
          {(dineroReal + freebets).toFixed(2)}€
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-line">
        <div>
          <p className="text-xs text-slate">Dinero real</p>
          <p className="font-mono text-lg font-semibold text-ink">{dineroReal.toFixed(2)}€</p>
        </div>
        <div>
          <p className="text-xs text-slate">Freebets</p>
          <p className="font-mono text-lg font-semibold text-gold">{freebets.toFixed(2)}€</p>
        </div>
      </div>
    </div>
  );
}
