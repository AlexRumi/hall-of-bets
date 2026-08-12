import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import TelegramMiniApp from "./components/TelegramMiniApp.jsx";
import "./index.css";

// Sin router de verdad (no hay react-router-dom en el proyecto): una única
// ruta especial para la Mini App de Telegram (ver
// src/components/TelegramMiniApp.jsx), resuelta a mano por la URL — el
// resto de la app sigue sin usar la barra de direcciones para nada.
const idApuestaMiniApp = window.location.pathname.match(/^\/telegram\/apuesta\/([^/]+)$/)?.[1];

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {idApuestaMiniApp ? <TelegramMiniApp apuestaId={idApuestaMiniApp} /> : <App />}
  </React.StrictMode>
);
