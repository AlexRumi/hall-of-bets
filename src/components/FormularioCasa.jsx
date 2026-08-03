import { useState } from "react";
import { PlusCircle, Image } from "lucide-react";

export default function FormularioCasa({ onAgregar }) {
  const [nombre, setNombre] = useState("");
  const [logo, setLogo] = useState(null);
  const [nombreArchivo, setNombreArchivo] = useState("");

  function manejarLogo(e) {
    const archivo = e.target.files[0];
    if (!archivo) {
      setLogo(null);
      setNombreArchivo("");
      return;
    }

    setNombreArchivo(archivo.name);
    // Convertimos la imagen a base64 para poder guardarla junto al resto de
    // datos en localStorage (no hay backend ni almacenamiento de archivos).
    const lector = new FileReader();
    lector.onload = () => setLogo(lector.result);
    lector.readAsDataURL(archivo);
  }

  function manejarEnvio(e) {
    e.preventDefault();
    if (!nombre.trim()) return;

    onAgregar({ nombre: nombre.trim(), logo });

    setNombre("");
    setLogo(null);
    setNombreArchivo("");
    e.target.reset();
  }

  return (
    <form
      onSubmit={manejarEnvio}
      className="bg-surface border border-line rounded-xl p-5 sm:p-6 space-y-4"
    >
      <h2 className="font-display text-lg font-semibold text-ink">
        Nueva casa de apuestas
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate mb-1">Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Bet365"
            required
            className="w-full border border-line rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-slate mb-1">
            Logo (opcional)
          </label>
          <label className="flex items-center gap-2 border border-line rounded-lg px-3 py-2 text-sm text-slate cursor-pointer hover:text-ink">
            <Image size={16} className="shrink-0" />
            <span className="truncate">
              {nombreArchivo || "Elegir imagen…"}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={manejarLogo}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <button
        type="submit"
        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-felt text-paper px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-feltDark transition-colors"
      >
        <PlusCircle size={16} />
        Añadir casa
      </button>
    </form>
  );
}
