import { calcularInformeMensual } from "../utils/apuestas";
import GraficoBarraDivergente from "./GraficoBarraDivergente";

function formatearMes(claveMes) {
  const [anio, mes] = claveMes.split("-").map(Number);
  const texto = new Date(anio, mes - 1, 1).toLocaleDateString("es-ES", {
    month: "short",
    year: "2-digit",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default function GraficoBeneficioMensual({ apuestas, oscuro }) {
  const datos = calcularInformeMensual(apuestas)
    .slice(0, 12)
    .reverse() // de más antiguo a más reciente, para leer el gráfico de izquierda a derecha
    .map((mes) => ({ etiqueta: formatearMes(mes.mes), valor: mes.beneficio }));

  return (
    <GraficoBarraDivergente
      titulo="Beneficio mensual"
      datos={datos}
      oscuro={oscuro}
      mensajeVacio="Todavía no hay apuestas resueltas para graficar por mes."
    />
  );
}
