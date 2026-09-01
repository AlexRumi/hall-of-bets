import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

function formatearFecha(fechaStr) {
  const [anio, mes, dia] = fechaStr.split("-").map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  const texto = fecha.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Lo que ha ido cambiando en la app, contado sin tecnicismos (a
// diferencia de CHANGELOG.md, que es el porqué técnico de cada decisión,
// pensado para retomar el trabajo, no para leerlo con una apuesta en la
// mano). Al abrir esta sección se marcan todas como vistas de golpe (ver
// useNovedades.js) — de ahí que el número en rojo de la barra desaparezca
// nada más entrar.
export default function Novedades({ novedades, onVisto }) {
  useEffect(() => {
    onVisto();
  }, [onVisto]);

  // Foto ampliada (petición directa): tocar cualquier captura la abre a
  // pantalla completa; tocar fuera o la X la cierra.
  const [imagenAmpliada, setImagenAmpliada] = useState(null);

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-line rounded-xl p-5 sm:p-6 text-center space-y-2">
        <Bell size={28} className="text-gold mx-auto" />
        <p className="font-display text-lg font-semibold text-ink">Novedades</p>
        <p className="text-sm text-slate">Lo último que ha cambiado en Hall of Bets.</p>
      </div>

      <div className="space-y-3">
        {novedades.map((n) => (
          <div key={n.id} className="bg-surface border border-line rounded-xl p-4 sm:p-5 space-y-1.5">
            <p className="text-xs font-semibold text-slate uppercase tracking-wide">
              {formatearFecha(n.fecha)}
            </p>
            <p className="font-display text-base font-semibold text-ink">{n.titulo}</p>
            <p className="text-sm text-slate leading-relaxed">{n.descripcion}</p>
            {/* Móvil: tira horizontal con su propio scroll (poco ancho,
                no cabrían 2 por fila sin verse diminutas). Escritorio: en
                vez de deslizar, se reparten de 2 en 2 y centradas — si son
                impares, la última ocupa las dos columnas y queda centrada
                sola en su fila (petición directa). */}
            {n.imagenes?.length > 0 && (
              <>
                <div className="sm:hidden mt-2 flex gap-2 overflow-x-auto scrollbar-oculto -mx-1 px-1">
                  {n.imagenes.map((src) => (
                    <img
                      key={src}
                      src={src}
                      alt={n.titulo}
                      onClick={() => setImagenAmpliada(src)}
                      className="h-56 w-auto shrink-0 rounded-lg border border-line object-contain bg-paperDim cursor-zoom-in"
                    />
                  ))}
                </div>
                <div className="hidden sm:grid mt-2 grid-cols-2 gap-3 justify-items-center">
                  {n.imagenes.map((src, i) => {
                    const esUltimoImpar = n.imagenes.length % 2 === 1 && i === n.imagenes.length - 1;
                    return (
                      <img
                        key={src}
                        src={src}
                        alt={n.titulo}
                        onClick={() => setImagenAmpliada(src)}
                        className={`h-64 w-auto rounded-lg border border-line object-contain bg-paperDim cursor-zoom-in transition-opacity hover:opacity-90 ${
                          esUltimoImpar ? "col-span-2" : ""
                        }`}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {imagenAmpliada && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 sm:p-8 z-50"
          onClick={() => setImagenAmpliada(null)}
        >
          <button
            type="button"
            onClick={() => setImagenAmpliada(null)}
            aria-label="Cerrar"
            className="absolute top-4 right-4 text-paper/80 hover:text-paper"
          >
            <X size={28} />
          </button>
          <img
            src={imagenAmpliada}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full rounded-lg border border-line/40 cursor-zoom-out"
          />
        </div>
      )}
    </div>
  );
}
