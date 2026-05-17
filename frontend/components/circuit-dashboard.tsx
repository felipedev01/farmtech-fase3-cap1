"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, RefreshCw, Router, SatelliteDish } from "lucide-react";
import { fetchHealth, fetchLatestReading, type ApiStatus } from "@/lib/api";
import type { SensorReading } from "@/lib/api";
import { ReadingSummary } from "@/components/reading-summary";
import { StatusPill } from "@/components/status-pill";

const POLL_INTERVAL_MS = 30000;

export function CircuitDashboard() {
  const wokwiEmbedUrl = process.env.NEXT_PUBLIC_WOKWI_EMBED_URL ?? "";
  const wokwiEmbedVersion = process.env.NEXT_PUBLIC_WOKWI_EMBED_VERSION ?? "";
  const [latest, setLatest] = useState<SensorReading | null>(null);
  const [status, setStatus] = useState<ApiStatus>("loading");
  const [statusLabel, setStatusLabel] = useState("Conectando");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [embedRefreshNonce, setEmbedRefreshNonce] = useState(0);

  const openWokwiUrl = useMemo(() => {
    if (!wokwiEmbedUrl) {
      return "";
    }

    return wokwiEmbedUrl.replace("/embed", "");
  }, [wokwiEmbedUrl]);

  const iframeSrc = useMemo(() => {
    if (!wokwiEmbedUrl) {
      return "";
    }

    const cacheKey = [wokwiEmbedVersion, embedRefreshNonce]
      .filter((value) => String(value).length > 0)
      .join("-");

    if (!cacheKey) {
      return wokwiEmbedUrl;
    }

    const separator = wokwiEmbedUrl.includes("?") ? "&" : "?";
    return `${wokwiEmbedUrl}${separator}v=${encodeURIComponent(cacheKey)}`;
  }, [embedRefreshNonce, wokwiEmbedUrl, wokwiEmbedVersion]);

  const loadStatus = useCallback(async () => {
    setIsRefreshing(true);

    try {
      const [health, readings] = await Promise.all([
        fetchHealth(),
        fetchLatestReading().catch(() => null),
      ]);

      setLatest(readings);
      setStatus(health.ok ? "ok" : "error");
      setStatusLabel(health.ok ? `API ${health.label}` : "API indisponível");
    } catch {
      setStatus("error");
      setStatusLabel("API indisponível");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadStatus();
    }, 0);
    const interval = window.setInterval(() => {
      void loadStatus();
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [loadStatus]);

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Wokwi + API</p>
          <h1>Circuito de irrigação inteligente</h1>
          <p className="page-description">
            Tela para validar a simulação de irrigação do ESP32 no Wokwi e acompanhar a
            última leitura recebida pela API.
          </p>
        </div>
        <div className="toolbar">
          <StatusPill status={status} label={statusLabel} />
          <button className="button primary" onClick={() => void loadStatus()} disabled={isRefreshing}>
            <RefreshCw size={17} aria-hidden="true" />
            Atualizar
          </button>
          {wokwiEmbedUrl ? (
            <button className="button" onClick={() => setEmbedRefreshNonce((value) => value + 1)}>
              <RefreshCw size={17} aria-hidden="true" />
              Recarregar Wokwi
            </button>
          ) : null}
          {openWokwiUrl ? (
            <a className="button" href={openWokwiUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={17} aria-hidden="true" />
              Abrir no Wokwi
            </a>
          ) : null}
        </div>
      </header>

      <div className="grid circuit-grid">
        <section className="panel table-panel" aria-label="Simulação Wokwi">
          {iframeSrc ? (
            <iframe
              key={iframeSrc}
              className="embed-frame"
              title="Simulação Wokwi do circuito de irrigação"
              src={iframeSrc}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
            />
          ) : (
            <div className="embed-empty">
              <div>
                <Router size={38} aria-hidden="true" />
                <p>
                  Configure NEXT_PUBLIC_WOKWI_EMBED_URL para embutir o circuito Wokwi nesta tela.
                </p>
              </div>
            </div>
          )}
        </section>

        <aside className="side-stack">
          <section className="panel side-panel">
            <h2 className="table-title">Status da integração</h2>
            <div className="reading-list">
              <div className="reading-row">
                <span>API</span>
                <strong>{statusLabel}</strong>
              </div>
              <div className="reading-row">
                <span>Wokwi</span>
                <strong>{wokwiEmbedUrl ? "Configurado" : "Sem URL"}</strong>
              </div>
              <div className="reading-row">
                <span>Versão embed</span>
                <strong>{wokwiEmbedVersion || "Padrão"}</strong>
              </div>
              <div className="reading-row">
                <span>Polling</span>
                <strong>{POLL_INTERVAL_MS / 1000}s</strong>
              </div>
            </div>
          </section>

          <section className="panel side-panel">
            <h2 className="table-title">
              <SatelliteDish size={18} aria-hidden="true" /> Última leitura
            </h2>
            <ReadingSummary reading={latest} />
          </section>
        </aside>
      </div>
    </section>
  );
}
