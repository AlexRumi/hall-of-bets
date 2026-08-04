import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// No hay registro público: el único usuario se crea a mano desde el panel de
// Supabase (Authentication > Users). La sesión, una vez iniciada, se guarda
// sola y persiste entre recargas (la gestiona supabase-js).
export function useAuth() {
  const [sesion, setSesion] = useState(undefined); // undefined = comprobando todavía

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSesion(data.session));

    const { data: suscripcion } = supabase.auth.onAuthStateChange(
      (_evento, sesionActual) => setSesion(sesionActual)
    );

    return () => suscripcion.subscription.unsubscribe();
  }, []);

  async function iniciarSesion(email, password) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return error;
  }

  function cerrarSesion() {
    return supabase.auth.signOut();
  }

  return {
    sesion,
    comprobandoSesion: sesion === undefined,
    iniciarSesion,
    cerrarSesion,
  };
}
