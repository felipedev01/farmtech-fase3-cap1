from __future__ import annotations

from typing import Any

from app.core.errors import AppError
from app.repositories.oracle_repository import OracleRepository
from app.schemas.sensor_reading import SensorReadingCreate


class OracleService:
    def __init__(self, repository: OracleRepository) -> None:
        self.repository = repository

    def list_tables(self) -> list[dict[str, Any]]:
        return self.repository.list_tables()

    def create_sensor_reading(self, payload: SensorReadingCreate) -> dict[str, Any]:
        return self.repository.create_sensor_reading(payload.model_dump())

    def list_sensor_readings(
        self,
        *,
        limit: int,
        offset: int,
        device_id: str | None = None,
        cultura: str | None = None,
    ) -> list[dict[str, Any]]:
        return self.repository.list_sensor_readings(
            limit=limit,
            offset=offset,
            device_id=device_id,
            cultura=cultura,
        )

    def get_latest_sensor_reading(self, device_id: str | None = None) -> dict[str, Any]:
        reading = self.repository.get_latest_sensor_reading(device_id=device_id)
        if reading is None:
            raise AppError("Nenhuma leitura de sensor encontrada.", status_code=404)
        return reading

    def summarize_sensor_readings(
        self,
        *,
        device_id: str | None = None,
        cultura: str | None = None,
    ) -> dict[str, Any]:
        return self.repository.summarize_sensor_readings(
            device_id=device_id,
            cultura=cultura,
        )
