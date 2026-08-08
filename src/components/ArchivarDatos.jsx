import { useState } from "react";
import { Archive, ArchiveRestore, Download } from "lucide-react";
import { filtrarPorRango } from "../utils/apuestas";
import { exportarRango } from "../utils/copiaSeguridad";
import ConfirmDialog from "./ConfirmDialog";

// Fase C: archivado por rango de fechas. No borra nada — solo oculta esas
// apuestas/movimientos de las vistas normales (Apuestas, Entretenimiento,
// Estadísticas, Informe), que ganan un "Ver también archivado". El dinero
// real (Casas de apuestas) y los trofeos siguen contando estas filas igual.
// El mismo panel sirve para desarchivar (mismo rango, mismo botón, con el
// interruptor Archivar/Desarchivar), para que quede totalmente reversible.
export default function ArchivarDatos({
  apuestas,
  movimientos,
  onArchivarApuestas,
  onArchivarMovimientos,
  onCopiaRealizada,
}) {
  const [modo, setModo] = useState("archivar");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [exportando, setExportando] = useState(false);

  const rangoListo = desde && hasta;
  const apuestasRango = rangoListo ? filtrarPorRango(apuestas, desde, hasta) : [];
  const movimientosRango = rangoListo ? filtrarPorRango(movimientos, desde, hasta) : [];
  // Al archivar solo cuenta lo que todavía no está archivado; al
  // desarchivar, solo lo que ya lo está — así el recuento coincide con lo
  // que la acción va a cambiar de verdad.
  const desarchivando = modo === "desarchivar";
  const apuestasAfectadas = apuestasRango.filter((a) => a.archivado === desarchivando);
  const movimientosAfectados = movimientosRango.filter((m) => m.archivado === desarchivando);
  const totalAfectado = apuestasAfectadas.length + movimientosAfectados.length;

  async function manejarExportar() {
    setExportando(true);
    try {
      await exportarRango(desde, hasta);
      onCopiaRealizada();
    } finally {
      setExportando(false);
    }
  }

  function confirmarAccion() {
    onArchivarApuestas(desde, hasta, modo === "archivar");
    onArchivarMovimientos(desde, hasta, modo === "archivar");
    setConfirmando(false);
  }

  return (
    <div className="bg-surface border border-line rounded-xl p-5 sm:p-6 space-y-4">
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">Archivar datos</h2>
        <p className="text-sm text-slate mt-1">
          Marca las apuestas y movimientos de un rango de fechas como
          archivados: dejan de verse en Apuestas, Entretenimiento,
          Estadísticas e Informe (con la opción de volver a verlos cuando
          quieras). No se borra nada, y no afecta al dinero de cada casa ni
          a los trofeos ya conseguidos.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setModo("archivar")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            modo === "archivar"
              ? "bg-felt text-paper border-felt"
              : "border-line text-slate hover:text-ink"
          }`}
        >
          Archivar
        </button>
        <button
          type="button"
          onClick={() => setModo("desarchivar")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            modo === "desarchivar"
              ? "bg-felt text-paper border-felt"
              : "border-line text-slate hover:text-ink"
          }`}
        >
          Desarchivar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate mb-1">Desde</label>
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm font-mono bg-surface text-ink"
          />
        </div>
        <div>
          <label className="block text-xs text-slate mb-1">Hasta</label>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="w-full border border-line rounded-lg px-3 py-2 text-sm font-mono bg-surface text-ink"
          />
        </div>
      </div>

      {rangoListo && (
        <p className="text-sm text-slate">
          {totalAfectado === 0
            ? `No hay nada que ${desarchivando ? "desarchivar" : "archivar"} en ese rango.`
            : `${apuestasAfectadas.length} apuestas y ${movimientosAfectados.length} movimientos a ${
                desarchivando ? "desarchivar" : "archivar"
              }.`}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={manejarExportar}
          disabled={!rangoListo || exportando}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-line text-ink hover:bg-paperDim transition-colors disabled:opacity-50"
        >
          <Download size={16} />
          {exportando ? "Exportando…" : "Exportar JSON de este rango"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          disabled={!rangoListo || totalAfectado === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-felt text-paper hover:bg-feltDark transition-colors disabled:opacity-50"
        >
          {desarchivando ? <ArchiveRestore size={16} /> : <Archive size={16} />}
          {desarchivando ? "Desarchivar" : "Archivar"}
        </button>
      </div>

      <ConfirmDialog
        abierto={confirmando}
        titulo={desarchivando ? "Desarchivar datos" : "Archivar datos"}
        mensaje={`Vas a ${desarchivando ? "desarchivar" : "archivar"} ${apuestasAfectadas.length} apuestas y ${movimientosAfectados.length} movimientos entre ${desde} y ${hasta}.${
          desarchivando ? "" : " No se borra nada — puedes desarchivarlo cuando quieras desde aquí mismo."
        }`}
        textoConfirmar={desarchivando ? "Desarchivar" : "Archivar"}
        onConfirmar={confirmarAccion}
        onCancelar={() => setConfirmando(false)}
      />
    </div>
  );
}
