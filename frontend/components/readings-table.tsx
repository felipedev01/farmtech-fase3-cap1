import type { SensorReading } from "@/lib/api";
import { formatDate, formatPump } from "@/components/reading-summary";

function formatNumber(value: number | null, suffix = "") {
  if (value === null) {
    return "--";
  }

  return `${Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)}${suffix}`;
}

export function ReadingsTable({
  readings,
  error,
}: {
  readings: SensorReading[];
  error: string | null;
}) {
  if (error) {
    return <div className="error-state">{error}</div>;
  }

  if (readings.length === 0) {
    return <div className="empty-state">Nenhum registro encontrado para o filtro atual.</div>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Horário</th>
            <th>Cultura</th>
            <th>Umidade</th>
            <th>Temperatura</th>
            <th>pH</th>
            <th>N</th>
            <th>P</th>
            <th>K</th>
            <th>Bomba</th>
          </tr>
        </thead>
        <tbody>
          {readings.map((reading) => (
            <tr key={`${reading.id}-${reading.timestamp ?? "sem-data"}`}>
              <td>{formatDate(reading.timestamp)}</td>
              <td>{reading.cultura}</td>
              <td>{formatNumber(reading.umidadeSolo, "%")}</td>
              <td>{formatNumber(reading.temperatura, " C")}</td>
              <td>{formatNumber(reading.ph)}</td>
              <td>{formatNumber(reading.nitrogenio)}</td>
              <td>{formatNumber(reading.fosforo)}</td>
              <td>{formatNumber(reading.potassio)}</td>
              <td>{formatPump(reading.bombaLigada)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
