import { calcularBeneficio } from "./apuestas";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DIAS_SEMANA = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado",
];

function fechaLocal(fechaStr) {
  const [anio, mes, dia] = fechaStr.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

function etiquetaMes(claveMes) {
  const [anio, mes] = claveMes.split("-").map(Number);
  return `${MESES[mes - 1]} ${anio}`;
}

function etiquetaDia(fechaStr) {
  const fecha = fechaLocal(fechaStr);
  return `${DIAS_SEMANA[fecha.getDay()]} ${fecha.getDate()}`;
}

// Agrupa por mes y, dentro, por día, con el beneficio sumado en cada
// nivel. Las apuestas ya llegan ordenadas de más reciente a más antigua
// (ver PantallaInicio.jsx), así que un Map (conserva el orden de
// inserción) basta para que meses y días salgan en ese mismo orden, sin
// tener que ordenar nada a mano.
export function agruparPorMesYDia(apuestas) {
  const meses = new Map();
  for (const apuesta of apuestas) {
    const claveMes = apuesta.fecha.slice(0, 7);
    if (!meses.has(claveMes)) meses.set(claveMes, new Map());
    const dias = meses.get(claveMes);
    if (!dias.has(apuesta.fecha)) dias.set(apuesta.fecha, []);
    dias.get(apuesta.fecha).push(apuesta);
  }

  return [...meses.entries()].map(([claveMes, dias]) => {
    const diasArray = [...dias.entries()].map(([fecha, apuestasDia]) => ({
      fecha,
      etiqueta: etiquetaDia(fecha),
      beneficio: apuestasDia.reduce((suma, a) => suma + calcularBeneficio(a), 0),
      apuestas: apuestasDia,
    }));

    return {
      clave: claveMes,
      etiqueta: etiquetaMes(claveMes),
      beneficio: diasArray.reduce((suma, d) => suma + d.beneficio, 0),
      dias: diasArray,
    };
  });
}
