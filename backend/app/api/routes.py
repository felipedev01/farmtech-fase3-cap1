import csv
from io import StringIO

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response

from app.repositories.oracle_repository import OracleRepository
from app.schemas.oracle import OracleTableRead
from app.schemas.sensor_reading import (
    SensorReadingCreate,
    SensorReadingRead,
    SensorReadingSummary,
)
from app.services.oracle_service import OracleService

router = APIRouter()


def get_service() -> OracleService:
    return OracleService(OracleRepository())


@router.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/oracle/tables", response_model=list[OracleTableRead])
def list_oracle_tables(service: OracleService = Depends(get_service)):
    return service.list_tables()


@router.post("/sensor-readings", response_model=SensorReadingRead, status_code=201)
def create_sensor_reading(
    payload: SensorReadingCreate,
    service: OracleService = Depends(get_service),
):
    return service.create_sensor_reading(payload)


@router.get("/sensor-readings", response_model=list[SensorReadingRead])
def list_sensor_readings(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    device_id: str | None = None,
    cultura: str | None = None,
    export: str | None = Query(None, pattern="^csv$"),
    service: OracleService = Depends(get_service),
):
    readings = service.list_sensor_readings(
        limit=limit,
        offset=offset,
        device_id=device_id,
        cultura=cultura,
    )

    if export == "csv":
        return _readings_csv_response(readings)

    return readings


@router.get("/sensor-readings/latest", response_model=SensorReadingRead)
def get_latest_sensor_reading(
    device_id: str | None = None,
    service: OracleService = Depends(get_service),
):
    return service.get_latest_sensor_reading(device_id=device_id)


@router.get("/sensor-readings/summary", response_model=SensorReadingSummary)
def summarize_sensor_readings(
    device_id: str | None = None,
    cultura: str | None = None,
    service: OracleService = Depends(get_service),
):
    return service.summarize_sensor_readings(device_id=device_id, cultura=cultura)


def _readings_csv_response(readings: list[dict]) -> Response:
    output = StringIO()
    fieldnames = [
        "created_at",
        "device_id",
        "cultura",
        "umidade_percent",
        "temperatura_c",
        "ph",
        "n_presente",
        "p_presente",
        "k_presente",
        "limiar_umidade_percent",
        "bomba_ligada",
    ]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(readings)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sensor-readings.csv"},
    )
