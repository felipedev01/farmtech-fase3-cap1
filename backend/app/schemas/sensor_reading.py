from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SensorReadingBase(BaseModel):
    device_id: str = Field(..., min_length=1, max_length=80)
    cultura: str = Field(..., min_length=1, max_length=80)
    umidade_percent: float = Field(..., ge=0, le=100)
    temperatura_c: float = Field(..., ge=-30, le=80)
    ph: float = Field(..., ge=0, le=14)
    n_presente: bool
    p_presente: bool
    k_presente: bool
    limiar_umidade_percent: float = Field(..., ge=0, le=100)
    bomba_ligada: bool


class SensorReadingCreate(SensorReadingBase):
    created_at: datetime | None = None


class SensorReadingRead(SensorReadingBase):
    model_config = ConfigDict(from_attributes=True)

    created_at: datetime


class SensorReadingSummary(BaseModel):
    total_readings: int
    avg_umidade_percent: float | None = None
    min_umidade_percent: float | None = None
    max_umidade_percent: float | None = None
    avg_temperatura_c: float | None = None
    min_temperatura_c: float | None = None
    max_temperatura_c: float | None = None
    avg_ph: float | None = None
    min_ph: float | None = None
    max_ph: float | None = None
    bomba_ligada_count: int
    latest_created_at: datetime | None = None
