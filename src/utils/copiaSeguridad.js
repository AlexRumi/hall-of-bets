// Todos los datos de la app viven solo en localStorage (ver CLAUDE.md): si se
// borra el historial del navegador o se cambia de dispositivo, se pierden sin
// posibilidad de recuperarlos. Este archivo agrupa esas claves para poder
// descargarlas como copia de seguridad y volver a cargarlas después.
const CLAVES = [
  "hall-of-bets:apuestas",
  "hall-of-bets:casas",
  "hall-of-bets:promociones",
  "hall-of-bets:movimientos",
  "hall-of-bets:trofeos-vistos",
];

// Descarga un archivo .json con todo lo guardado en localStorage.
export function exportarDatos() {
  const datos = {};
  CLAVES.forEach((clave) => {
    const guardado = localStorage.getItem(clave);
    if (guardado !== null) datos[clave] = JSON.parse(guardado);
  });

  const contenido = JSON.stringify(
    { version: 1, fecha: new Date().toISOString(), datos },
    null,
    2
  );
  const blob = new Blob([contenido], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `hall-of-bets-copia-${new Date().toISOString().slice(0, 10)}.json`;
  enlace.click();
  URL.revokeObjectURL(url);
}

// Lee un archivo de copia de seguridad y sustituye los datos actuales en
// localStorage por los del archivo. Quien la llame debe recargar la página
// después, para que la app vuelva a leer todo desde localStorage.
export function importarDatos(file) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => {
      try {
        const contenido = JSON.parse(lector.result);
        if (!contenido || typeof contenido.datos !== "object") {
          throw new Error(
            "El archivo no tiene el formato de una copia de Hall of Bets."
          );
        }
        CLAVES.forEach((clave) => {
          if (clave in contenido.datos) {
            localStorage.setItem(clave, JSON.stringify(contenido.datos[clave]));
          }
        });
        resolve();
      } catch {
        reject(
          new Error(
            "No se pudo leer el archivo. Comprueba que es una copia de seguridad exportada desde aquí."
          )
        );
      }
    };
    lector.onerror = () => reject(new Error("No se pudo leer el archivo."));
    lector.readAsText(file);
  });
}
