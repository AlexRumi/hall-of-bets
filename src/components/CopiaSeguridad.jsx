import { useRef, useState } from "react";
import { Download, Upload, AlertTriangle } from "lucide-react";
import { exportarDatos, importarDatos } from "../utils/copiaSeguridad";
import ConfirmDialog from "./ConfirmDialog";

export default function CopiaSeguridad() {
  const inputRef = useRef(null);
  const [archivoPendiente, setArchivoPendiente] = useState(null);
  const [error, setError] = useState("");

  function manejarSeleccion(e) {
    const file = e.target.files[0];
    e.target.value = ""; // para poder volver a elegir el mismo archivo si hace falta
    if (file) {
      setError("");
      setArchivoPendiente(file);
    }
  }

  async function confirmarImportacion() {
    try {
      await importarDatos(archivoPendiente);
      window.location.reload();
    } catch (err) {
      setError(err.message);
      setArchivoPendiente(null);
    }
  }

  return (
    <div className="bg-surface border border-line rounded-xl p-5 sm:p-6 space-y-4">
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">
          Copia de seguridad
        </h2>
        <p className="text-sm text-slate mt-1">
          Todos los datos se guardan solo en este navegador. Descarga una
          copia de vez en cuando para no perderlos si borras el historial o
          cambias de móvil u ordenador.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={exportarDatos}
          className="flex items-center gap-2 bg-felt text-paper px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-feltDark transition-colors"
        >
          <Download size={16} />
          Exportar copia (JSON)
        </button>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border border-line text-ink hover:bg-paperDim transition-colors"
        >
          <Upload size={16} />
          Importar copia
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json"
          onChange={manejarSeleccion}
          className="hidden"
        />
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-sm text-lose">
          <AlertTriangle size={14} />
          {error}
        </p>
      )}

      <ConfirmDialog
        abierto={archivoPendiente !== null}
        titulo="Importar copia de seguridad"
        mensaje="Esto sustituye todos los datos actuales (apuestas, casas, promociones, movimientos y trofeos) por los del archivo. Esta acción no se puede deshacer."
        textoConfirmar="Importar y sobrescribir"
        onConfirmar={confirmarImportacion}
        onCancelar={() => setArchivoPendiente(null)}
      />
    </div>
  );
}
