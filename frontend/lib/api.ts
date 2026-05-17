export type ApiStatus = "loading" | "ok" | "error";

export type HealthResult = {
  ok: boolean;
  label: string;
  detail?: string;
};

export type SensorReading = {
  id: string;
  timestamp: string | null;
  cultura: string;
  umidadeSolo: number | null;
  temperatura: number | null;
  ph: number | null;
  nitrogenio: number | null;
  fosforo: number | null;
  potassio: number | null;
  bombaLigada: boolean | null;
};

const READINGS_ENDPOINT = "/sensor-readings";
const LATEST_READING_ENDPOINT = "/sensor-readings/latest";

type RawRecord = Record<string, unknown>;

function getString(record: RawRecord, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value);
    }
  }

  return fallback;
}

function getNumber(record: RawRecord, keys: string[]): number | null {
  for (const key of keys) {
    const value = record[key];
    if (value === undefined || value === null || value === "") {
      continue;
    }

    if (typeof value === "boolean") {
      return value ? 1 : 0;
    }

    const parsed = Number(String(value).replace(",", "."));
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function getBoolean(record: RawRecord, keys: string[]): boolean | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      return value === 1;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (["1", "true", "sim", "on", "ligada", "ligado"].includes(normalized)) {
        return true;
      }
      if (["0", "false", "nao", "off", "desligada", "desligado"].includes(normalized)) {
        return false;
      }
    }
  }

  return null;
}

function toArray(payload: unknown): RawRecord[] {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is RawRecord => typeof item === "object" && item !== null);
  }

  if (typeof payload === "object" && payload !== null) {
    const record = payload as RawRecord;
    for (const key of ["leituras", "readings", "items", "data", "results"]) {
      const value = record[key];
      if (Array.isArray(value)) {
        return value.filter((item): item is RawRecord => typeof item === "object" && item !== null);
      }
    }
  }

  return [];
}

function normalizeReading(record: RawRecord, index: number): SensorReading {
  const timestamp = getString(
    record,
    ["timestamp", "created_at", "data_hora", "data_leitura", "dt_leitura", "horario"],
    "",
  );

  return {
    id: getString(record, ["id", "leitura_id", "codigo", "rowid"], String(index + 1)),
    timestamp: timestamp || null,
    cultura: getString(record, ["cultura", "crop", "tipo_cultura", "nome_cultura"], "Sem cultura"),
    umidadeSolo: getNumber(record, ["umidade_percent", "umidade_solo", "umidade", "soil_moisture"]),
    temperatura: getNumber(record, ["temperatura", "temperature", "temperatura_c"]),
    ph: getNumber(record, ["ph", "ph_solo", "solo_ph"]),
    nitrogenio: getNumber(record, ["nitrogenio", "n_presente", "n", "nitrogen"]),
    fosforo: getNumber(record, ["fosforo", "p_presente", "p", "phosphorus"]),
    potassio: getNumber(record, ["potassio", "k_presente", "k", "potassium"]),
    bombaLigada: getBoolean(record, ["bomba_ligada", "bomba", "pump_on", "irrigacao_ativa"]),
  };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  const [pathname, query = ""] = path.split("?");
  const proxyPath = `/api/backend/${pathname.replace(/^\//, "")}${query ? `?${query}` : ""}`;

  try {
    const response = await fetch(proxyPath, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const payload = (await response.json()) as {
      __proxyData?: T;
      __proxyError?: boolean;
      detail?: string;
      status?: number;
    };

    if (payload.__proxyError) {
      throw new Error(`${payload.status ?? "erro"} ${payload.detail ?? "Falha na API"}`);
    }

    return payload.__proxyData as T;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function fetchHealth(): Promise<HealthResult> {
  const candidates = ["/health/db", "/health"];
  const errors: string[] = [];

  for (const path of candidates) {
    try {
      const payload = await apiFetch<RawRecord>(path);
      const status = getString(payload, ["status"], "ok");
      const database = getString(payload, ["database"], "");
      return {
        ok: true,
        label: database ? `${status} / ${database}` : status,
      };
    } catch (error) {
      errors.push(`${path}: ${error instanceof Error ? error.message : "erro desconhecido"}`);
    }
  }

  return {
    ok: false,
    label: "indisponível",
    detail: errors.join(" | "),
  };
}

export async function fetchReadings(cultura?: string): Promise<SensorReading[]> {
  const params = new URLSearchParams();
  if (cultura) {
    params.set("cultura", cultura);
  }

  const query = params.toString();
  const path = query ? `${READINGS_ENDPOINT}?${query}` : READINGS_ENDPOINT;
  const payload = await apiFetch<unknown>(path);

  return toArray(payload).map(normalizeReading).sort(compareReadingsDesc);
}

export async function fetchLatestReading(): Promise<SensorReading | null> {
  try {
    const payload = await apiFetch<unknown>(LATEST_READING_ENDPOINT);
    if (Array.isArray(payload)) {
      return toArray(payload).map(normalizeReading).sort(compareReadingsDesc)[0] ?? null;
    }

    if (typeof payload === "object" && payload !== null) {
      return normalizeReading(payload as RawRecord, 0);
    }
  } catch {
    const readings = await fetchReadings();
    return readings[0] ?? null;
  }

  return null;
}

export function compareReadingsDesc(a: SensorReading, b: SensorReading) {
  const first = a.timestamp ? Date.parse(a.timestamp) : 0;
  const second = b.timestamp ? Date.parse(b.timestamp) : 0;

  return second - first;
}
