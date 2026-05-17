"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Droplets,
  FlaskConical,
  Leaf,
  Power,
  RefreshCw,
  Sprout,
  Thermometer,
} from "lucide-react";
import { fetchHealth, fetchReadings, type ApiStatus, type SensorReading } from "@/lib/api";
import { MetricCard } from "@/components/metric-card";
import { ReadingSummary, formatDate, formatPump } from "@/components/reading-summary";
import { ReadingsTable } from "@/components/readings-table";
import { StatusPill } from "@/components/status-pill";

const POLL_INTERVAL_MS = 30000;

function formatNumber(value: number | null, suffix = "") {
  if (value === null) {
    return "--";
  }

  return `${Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)}${suffix}`;
}

function formatNpk(reading: SensorReading | null) {
  if (!reading) {
    return "--";
  }

  return `${formatNumber(reading.nitrogenio)} / ${formatNumber(reading.fosforo)} / ${formatNumber(
    reading.potassio,
  )}`;
}

export function DataDashboard() {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [selectedCulture, setSelectedCulture] = useState("");
  const [status, setStatus] = useState<ApiStatus>("loading");
  const [statusLabel, setStatusLabel] = useState("Conectando");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const [health, nextReadings] = await Promise.all([fetchHealth(), fetchReadings()]);
      setReadings(nextReadings);
      setStatus(health.ok ? "ok" : "error");
      setStatusLabel(health.ok ? `API ${health.label}` : "API indisponível");
      setError(null);
      setLastUpdated(new Date().toISOString());
    } catch {
      setStatus("error");
      setStatusLabel("API indisponível");
      setError(
        "Não foi possível carregar as leituras. Verifique a API e NEXT_PUBLIC_API_BASE_URL.",
      );
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadData();
    }, 0);
    const interval = window.setInterval(() => {
      void loadData();
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [loadData]);

  const cultures = useMemo(
    () => Array.from(new Set(readings.map((reading) => reading.cultura))).sort(),
    [readings],
  );

  const filteredReadings = useMemo(() => {
    if (!selectedCulture) {
      return readings;
    }

    return readings.filter((reading) => reading.cultura === selectedCulture);
  }, [readings, selectedCulture]);

  const latest = filteredReadings[0] ?? null;

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Oracle + sensores</p>
          <h1>Leituras do circuito de irrigação</h1>
          <p className="page-description">
            Painel operacional para acompanhar cultura, solo, nutrientes e acionamento da bomba
            a partir dos registros gravados no Oracle.
          </p>
        </div>
        <div className="toolbar">
          <StatusPill status={status} label={statusLabel} />
          <select
            className="select"
            aria-label="Filtrar por cultura"
            value={selectedCulture}
            onChange={(event) => setSelectedCulture(event.target.value)}
          >
            <option value="">Todas as culturas</option>
            {cultures.map((culture) => (
              <option key={culture} value={culture}>
                {culture}
              </option>
            ))}
          </select>
          <button className="button primary" onClick={() => void loadData()} disabled={isRefreshing}>
            <RefreshCw size={17} aria-hidden="true" />
            Atualizar
          </button>
        </div>
      </header>

      <div className="grid metric-grid">
        <MetricCard
          icon={Activity}
          label="Última leitura"
          value={formatDate(latest?.timestamp ?? null)}
          note={lastUpdated ? `Atualizado ${formatDate(lastUpdated)}` : "Aguardando API"}
        />
        <MetricCard
          icon={Leaf}
          label="Total no histórico"
          value={String(filteredReadings.length)}
          note={selectedCulture || "Todas as culturas"}
        />
        <MetricCard icon={Sprout} label="Cultura" value={latest?.cultura ?? "--"} />
        <MetricCard
          icon={Droplets}
          label="Umidade do solo"
          value={formatNumber(latest?.umidadeSolo ?? null, "%")}
        />
        <MetricCard
          icon={Thermometer}
          label="Temperatura"
          value={formatNumber(latest?.temperatura ?? null, " C")}
        />
        <MetricCard icon={FlaskConical} label="pH" value={formatNumber(latest?.ph ?? null)} />
        <MetricCard icon={FlaskConical} label="NPK" value={formatNpk(latest)} />
        <MetricCard icon={Power} label="Bomba" value={formatPump(latest?.bombaLigada ?? null)} />
      </div>

      <div className="grid circuit-grid">
        <section className="panel table-panel">
          <div className="table-header">
            <h2 className="table-title">Histórico de leituras</h2>
            <StatusPill status={isRefreshing ? "loading" : status} label={isRefreshing ? "Sincronizando" : "Pronto"} />
          </div>
          <ReadingsTable readings={filteredReadings} error={error} />
        </section>

        <aside className="panel side-panel">
          <h2 className="table-title">Resumo da última leitura</h2>
          <ReadingSummary reading={latest} />
        </aside>
      </div>
    </section>
  );
}
