import { useRef, useState } from "react";
import { Download, Upload, AlertTriangle, CloudUpload, Clock } from "lucide-react";
import {
  exportarDatos,
  importarDatos,
  hayDatosLocalesSinMigrar,
  migrarLocalStorageASupabase,
} from "../utils/copiaSeguridad";
import ConfirmDialog from "./ConfirmDialog";

const MS_POR_DIA = 24 * 60 * 60 * 1000;

// Fase D: siempre se ve cuándo fue la última copia (sincronizado entre
// dispositivos vía Supabase, ver useAjustes.js — no localStorage, que solo
// se ve en este aparato). Si nunca se ha exportado, la referencia es la
// fecha de alta de la cuenta. Pasados 7 días, el texto pasa a aviso (dorado)
// — no bloquea nada, solo recuerda.
export default function CopiaSeguridad({ userId, fechaAltaCuenta, ultimaCopia, onCopiaRealizada }) {
  const inputRef = useRef(null);
  const [archivoPendiente, setArchivoPendiente] = useState(null);
  const [confirmandoMigracion, setConfirmandoMigracion] = useState(false);
  const [migrando, setMigrando] = useState(false);
  const [migrado, setMigrado] = useState(false);
  const [error, setError] = useState("");

  const referencia = ultimaCopia ?? fechaAltaCuenta;
  const diasSinCopia = referencia
    ? Math.floor((Date.now() - new Date(referencia).getTime()) / MS_POR_DIA)
    : 0;
  const avisoVisible = diasSinCopia > 7;
  const textoEstado = ultimaCopia
    ? diasSinCopia === 0
      ? "Última copia de seguridad realizada hoy."
      : `Última copia de seguridad realizada hace ${diasSinCopia} día${diasSinCopia === 1 ? "" : "s"}.`
    : "Todavía no se ha hecho ninguna copia de seguridad.";

  async function manejarExportar() {
    await exportarDatos();
    onCopiaRealizada();
  }

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
      await importarDatos(archivoPendiente, userId);
      window.location.reload();
    } catch (err) {
      setError(err.message);
      setArchivoPendiente(null);
    }
  }

  async function confirmarMigracion() {
    setMigrando(true);
    try {
      await migrarLocalStorageASupabase(userId);
      setMigrado(true);
    } catch {
      setError(
        "No se pudieron subir los datos. Comprueba tu conexión e inténtalo de nuevo."
      );
    } finally {
      setMigrando(false);
      setConfirmandoMigracion(false);
    }
  }

  return (
    <div className="space-y-4">
      {hayDatosLocalesSinMigrar() && !migrado && (
        <div className="bg-gold/10 border border-gold/30 rounded-xl p-5 sm:p-6 space-y-3">
          <h2 className="font-display text-lg font-semibold text-ink">
            Subir tu historial a la nube
          </h2>
          <p className="text-sm text-slate">
            Este navegador tiene apuestas guardadas de antes de activar la
            sincronización. Súbelas una vez para no perderlas y verlas
            también desde tus otros dispositivos.
          </p>
          <button
            type="button"
            onClick={() => setConfirmandoMigracion(true)}
            disabled={migrando}
            className="flex items-center gap-2 bg-felt text-paper px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-feltDark transition-colors disabled:opacity-60"
          >
            <CloudUpload size={16} />
            {migrando ? "Subiendo…" : "Subir mi historial a la nube"}
          </button>
        </div>
      )}

      <div className="bg-surface border border-line rounded-xl p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">
            Copia de seguridad
          </h2>
          <p className="text-sm text-slate mt-1">
            Tus datos se guardan en la nube (Supabase), pero conviene
            descargar una copia de vez en cuando por si acaso.
          </p>
        </div>

        <p
          className={`flex items-center gap-1.5 text-sm rounded-lg px-3 py-2 ${
            avisoVisible ? "text-gold bg-gold/10 border border-gold/30" : "text-slate"
          }`}
        >
          <Clock size={14} className="shrink-0" />
          {textoEstado}
          {avisoVisible && " Conviene hacer una nueva."}
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={manejarExportar}
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
      </div>

      <ConfirmDialog
        abierto={archivoPendiente !== null}
        titulo="Importar copia de seguridad"
        mensaje="Esto sustituye todos los datos actuales (apuestas, casas y movimientos) por los del archivo. Esta acción no se puede deshacer."
        textoConfirmar="Importar y sobrescribir"
        onConfirmar={confirmarImportacion}
        onCancelar={() => setArchivoPendiente(null)}
      />

      <ConfirmDialog
        abierto={confirmandoMigracion}
        titulo="Subir historial a la nube"
        mensaje="Se van a subir a Supabase las apuestas, casas y movimientos guardados en este navegador. Hazlo solo una vez para no duplicar datos."
        textoConfirmar="Subir"
        onConfirmar={confirmarMigracion}
        onCancelar={() => setConfirmandoMigracion(false)}
      />
    </div>
  );
}
