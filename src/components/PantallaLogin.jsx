import { useState } from "react";
import { Ticket, LogIn } from "lucide-react";

export default function PantallaLogin({ onIniciarSesion }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(e) {
    e.preventDefault();
    setEnviando(true);
    setError("");

    const errorLogin = await onIniciarSesion(email, password);

    if (errorLogin) {
      setError("Email o contraseña incorrectos.");
      setEnviando(false);
    }
    // Si no hay error, el cambio de sesión se detecta solo y esta pantalla desaparece.
  }

  return (
    <div className="min-h-screen bg-fondo flex flex-col">
      <div className="bg-felt px-5 sm:px-8 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Ticket size={20} className="text-gold" />
          <span className="uppercase tracking-[0.2em] text-xs font-medium text-gold">
            Cuaderno de apuestas
          </span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-paper">
          Hall of Bets
        </h1>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <form
          onSubmit={manejarEnvio}
          className="bg-surface border border-line rounded-xl p-6 w-full max-w-sm space-y-4"
        >
          <h2 className="font-display text-lg font-semibold text-ink">
            Iniciar sesión
          </h2>

          <div>
            <label className="block text-xs text-slate mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full border border-line rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-slate mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-line rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-lose">{error}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="w-full flex items-center justify-center gap-2 bg-felt text-paper px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-feltDark transition-colors disabled:opacity-60"
          >
            <LogIn size={16} />
            {enviando ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
