import { useEffect, useRef, useState } from "react";
import TicketApuesta from "./TicketApuesta";

// Carga el SDK de Telegram Web App una sola vez (solo lo necesita esta
// página, no tiene sentido cargarlo para el resto de la app) y resuelve la
// promesa en cuanto window.Telegram.WebApp existe.
function cargarTelegramWebApp() {
  return new Promise((resolve, reject) => {
    if (window.Telegram?.WebApp) {
      resolve(window.Telegram.WebApp);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.onload = () => resolve(window.Telegram?.WebApp ?? null);
    script.onerror = () => reject(new Error("No se pudo cargar el SDK de Telegram"));
    document.head.appendChild(script);
  });
}

async function llamarApi(metodo, cuerpo, idApuesta, initData) {
  const opciones =
    metodo === "GET"
      ? { headers: { "X-Telegram-Init-Data": initData } }
      : {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...cuerpo, initData, id: idApuesta }),
        };
  const url = metodo === "GET" ? `/api/telegram-apuesta?id=${idApuesta}` : "/api/telegram-apuesta";
  const respuesta = await fetch(url, opciones);
  const datos = await respuesta.json();
  if (!respuesta.ok) throw new Error(datos.error ?? "Error de red");
  return datos.apuesta;
}

// Página de la Mini App de Telegram (ruta /telegram/apuesta/:id, montada a
// mano en src/main.jsx — la app no tiene router de URLs). Reemplaza los
// botones planos del bot como forma de resolver una apuesta, con el mismo
// diseño de ticket que la maqueta de referencia (betslip-demo.html). Toda
// la lectura/escritura pasa por api/telegram-apuesta.js (service role +
// api/_lib/apuestasResueltas.js, igual que el bot de botones) porque esta
// página no tiene una sesión de Supabase real — el initData del SDK de
// Telegram es la única prueba de identidad, verificada en el servidor.
export default function TelegramMiniApp({ apuestaId }) {
  const [webApp, setWebApp] = useState(null);
  const [apuesta, setApuesta] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [cashOutAbierto, setCashOutAbierto] = useState(false);
  const [importeCashOut, setImporteCashOut] = useState("");
  const initDataRef = useRef(null);

  useEffect(() => {
    let vivo = true;

    cargarTelegramWebApp()
      .then((tg) => {
        if (!vivo || !tg) return;
        tg.ready();
        tg.expand();
        initDataRef.current = tg.initData;
        setWebApp(tg);
        return llamarApi("GET", null, apuestaId, tg.initData);
      })
      .then((data) => {
        if (vivo && data) setApuesta(data);
      })
      .catch((e) => {
        if (vivo) setError(e.message);
      })
      .finally(() => {
        if (vivo) setCargando(false);
      });

    return () => {
      vivo = false;
    };
  }, [apuestaId]);

  async function marcarPick(indice, resultado) {
    try {
      const actualizada = await llamarApi(
        "POST",
        { accion: "pick", indice, resultado },
        apuestaId,
        initDataRef.current
      );
      setApuesta(actualizada);
    } catch (e) {
      webApp?.showAlert?.(e.message) ?? alert(e.message);
    }
  }

  async function confirmarCashOut() {
    try {
      const actualizada = await llamarApi(
        "POST",
        { accion: "cashout", importe: importeCashOut },
        apuestaId,
        initDataRef.current
      );
      setApuesta(actualizada);
      setCashOutAbierto(false);
      setImporteCashOut("");
    } catch (e) {
      webApp?.showAlert?.(e.message) ?? alert(e.message);
    }
  }

  // El MainButton de Telegram es la acción principal fija abajo del todo —
  // se registra el manejador UNA sola vez (leyendo el estado actual por una
  // ref) para no ir acumulando listeners en cada re-render.
  const accionBotonRef = useRef(() => {});
  accionBotonRef.current = () => {
    if (!cashOutAbierto) {
      setCashOutAbierto(true);
      return;
    }
    if (Number(importeCashOut) >= 0) confirmarCashOut();
  };

  useEffect(() => {
    if (!webApp) return;
    const manejador = () => accionBotonRef.current();
    webApp.MainButton.onClick(manejador);
    return () => webApp.MainButton.offClick(manejador);
  }, [webApp]);

  useEffect(() => {
    if (!webApp || !apuesta) return;
    if (apuesta.resultado !== "pendiente") {
      webApp.MainButton.hide();
      return;
    }
    if (!cashOutAbierto) {
      webApp.MainButton.setText("💰 Cash Out");
      webApp.MainButton.enable();
    } else {
      const importeValido = importeCashOut !== "" && Number(importeCashOut) >= 0;
      webApp.MainButton.setText(
        importeValido ? `Confirmar Cash Out · ${Number(importeCashOut).toFixed(2)}€` : "Escribe el importe"
      );
      importeValido ? webApp.MainButton.enable() : webApp.MainButton.disable();
    }
    webApp.MainButton.show();
  }, [webApp, apuesta, cashOutAbierto, importeCashOut]);

  if (cargando) {
    return (
      <div className="hob-mini-app">
        <p style={{ color: "#f3efe3" }}>Cargando…</p>
      </div>
    );
  }

  if (error || !apuesta) {
    return (
      <div className="hob-mini-app">
        <p style={{ color: "#f3efe3" }}>{error ?? "Apuesta no encontrada."}</p>
      </div>
    );
  }

  return (
    <div className="hob-mini-app">
      <TicketApuesta
        apuesta={apuesta}
        onMarcarPick={marcarPick}
        cashOutAbierto={cashOutAbierto}
        importeCashOut={importeCashOut}
        onCambiarImporteCashOut={setImporteCashOut}
      />
    </div>
  );
}
