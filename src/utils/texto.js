// Quita acentos para comparar texto sin distinguir "atletico" de "Atlético"
// — usado por cualquier buscador de texto libre de la app (BuscadorEvento.jsx,
// ListaApuestas.jsx) para que escribir sin tildes también encuentre resultados.
export function normalizarTexto(texto) {
  return (texto ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}
