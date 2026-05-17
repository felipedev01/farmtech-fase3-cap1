import type { SensorReading } from "@/lib/api";

function formatValue(value: number | null, suffix = "") {
  if (value === null) {
    return "--";
  }

  return `${Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)}${suffix}`;
}

export function formatDate(value: string | null) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function formatPump(value: boolean | null) {
  if (value === null) {
    return "--";
  }

  return value ? "Ligada" : "Desligada";
}

export function ReadingSummary({ reading }: { reading: SensorReading | null }) {
  if (!reading) {
    return <p className="empty-state">Nenhuma leitura retornada pela API.</p>;
  }

  return (
    <div className="reading-list">
      <div className="reading-row">
        <span>Horário</span>
        <strong>{formatDate(reading.timestamp)}</strong>
      </div>
      <div className="reading-row">
        <span>Cultura</span>
        <strong>{reading.cultura}</strong>
      </div>
      <div className="reading-row">
        <span>Umidade</span>
        <strong>{formatValue(reading.umidadeSolo, "%")}</strong>
      </div>
      <div className="reading-row">
        <span>Temperatura</span>
        <strong>{formatValue(reading.temperatura, " C")}</strong>
      </div>
      <div className="reading-row">
        <span>pH</span>
        <strong>{formatValue(reading.ph)}</strong>
      </div>
      <div className="reading-row">
        <span>NPK</span>
        <strong>
          {formatValue(reading.nitrogenio)} / {formatValue(reading.fosforo)} /{" "}
          {formatValue(reading.potassio)}
        </strong>
      </div>
      <div className="reading-row">
        <span>Bomba</span>
        <strong>{formatPump(reading.bombaLigada)}</strong>
      </div>
    </div>
  );
}
