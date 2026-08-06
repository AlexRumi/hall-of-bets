import { supabase } from "../lib/supabaseClient";

const TABLAS = ["apuestas", "casas", "movimientos"];

// Claves antiguas de localStorage, de antes de mover los datos a Supabase.
// Se usan solo para poder subir una vez el historial que ya hubiera en este
// navegador; la app ya no lee de aquí para nada más.
const CLAVES_LOCALSTORAGE = {
  apuestas: "hall-of-bets:apuestas",
  casas: "hall-of-bets:casas",
  movimientos: "hall-of-bets:movimientos",
};

function leerLocalStorage(clave) {
  try {
    const guardado = localStorage.getItem(clave);
    return guardado ? JSON.parse(guardado) : [];
  } catch {
    return [];
  }
}

// Hay datos de antes de tener Supabase en este navegador que todavía no se
// han subido a la nube.
export function hayDatosLocalesSinMigrar() {
  return TABLAS.some(
    (tabla) => leerLocalStorage(CLAVES_LOCALSTORAGE[tabla]).length > 0
  );
}

// Sube de una vez el historial que ya hubiera en este navegador (de antes de
// tener sincronización) a las tablas de Supabase del usuario que ha iniciado
// sesión. Si algo falla a mitad no se borra nada de localStorage, para poder
// reintentarlo sin haber perdido el original.
export async function migrarLocalStorageASupabase(userId) {
  const apuestas = leerLocalStorage(CLAVES_LOCALSTORAGE.apuestas);
  if (apuestas.length > 0) {
    const { error } = await supabase.from("apuestas").insert(
      apuestas.map((a) => ({
        user_id: userId,
        fecha: a.fecha,
        casa: a.casa,
        stake: Number(a.stake),
        tipo_fondos: a.tipoFondos,
        categoria: a.categoria,
        resultado: a.resultado,
        selecciones: a.selecciones,
      }))
    );
    if (error) throw error;
  }

  const casas = leerLocalStorage(CLAVES_LOCALSTORAGE.casas);
  if (casas.length > 0) {
    const { error } = await supabase
      .from("casas")
      .insert(casas.map((c) => ({ user_id: userId, nombre: c.nombre, logo: c.logo })));
    if (error) throw error;
  }

  const movimientos = leerLocalStorage(CLAVES_LOCALSTORAGE.movimientos);
  if (movimientos.length > 0) {
    const { error } = await supabase.from("movimientos").insert(
      movimientos.map((m) => ({
        user_id: userId,
        fecha: m.fecha,
        casa: m.casa,
        tipo: m.tipo,
        cantidad: Number(m.cantidad),
      }))
    );
    if (error) throw error;
  }

  // Todo subido sin errores: borramos las claves antiguas para que el aviso
  // de migración no vuelva a salir ni se puedan duplicar datos si se repite.
  Object.values(CLAVES_LOCALSTORAGE).forEach((clave) => localStorage.removeItem(clave));
}

// Descarga una copia de seguridad en .json con todo lo que hay en Supabase
// (gracias a RLS, cada usuario solo puede leer sus propias filas).
export async function exportarDatos() {
  const resultados = await Promise.all(
    TABLAS.map((tabla) => supabase.from(tabla).select("*"))
  );

  const datos = {};
  TABLAS.forEach((tabla, i) => {
    datos[tabla] = resultados[i].data ?? [];
  });

  const contenido = JSON.stringify(
    { version: 2, fecha: new Date().toISOString(), datos },
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

function filasDe(datos, tabla) {
  return datos[tabla] ?? datos[CLAVES_LOCALSTORAGE[tabla]] ?? [];
}

// Lee un archivo de copia de seguridad y sustituye los datos actuales en
// Supabase por los del archivo (se borra cada tabla antes de volver a
// rellenarla, para no acabar con datos duplicados).
export function importarDatos(file, userId) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = async () => {
      try {
        const contenido = JSON.parse(lector.result);
        if (!contenido || typeof contenido.datos !== "object") {
          throw new Error("formato");
        }

        for (const tabla of TABLAS) {
          await supabase.from(tabla).delete().eq("user_id", userId);
          const filas = filasDe(contenido.datos, tabla).map(
            ({ id, creado_en, ...resto }) => ({ ...resto, user_id: userId })
          );
          if (filas.length > 0) {
            await supabase.from(tabla).insert(filas);
          }
        }
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
