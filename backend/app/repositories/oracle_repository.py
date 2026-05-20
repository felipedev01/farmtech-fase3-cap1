from __future__ import annotations

from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

import oracledb

from app.db.oracle import get_connection

SAO_PAULO_TZ = ZoneInfo("America/Sao_Paulo")


def _rows_to_dicts(cursor: oracledb.Cursor, rows: list[tuple[Any, ...]]) -> list[dict[str, Any]]:
    columns = [column[0].lower() for column in cursor.description or []]
    return [dict(zip(columns, row, strict=False)) for row in rows]


def _quote_identifier(identifier: str) -> str:
    return '"' + identifier.replace('"', '""') + '"'


class OracleRepository:
    def list_tables(self) -> list[dict[str, Any]]:
        with get_connection() as connection, connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT table_name
                FROM user_tables
                ORDER BY table_name
                """
            )
            tables = _rows_to_dicts(cursor, cursor.fetchall())

            result: list[dict[str, Any]] = []
            for table in tables:
                table_name = str(table["table_name"])
                cursor.execute(f"SELECT COUNT(*) FROM {_quote_identifier(table_name)}")
                rows = cursor.fetchone()[0]
                result.append({"table_name": table_name, "rows": int(rows)})

            return result

    def create_sensor_reading(self, data: dict[str, Any]) -> dict[str, Any]:
        created_at = data.get("created_at") or datetime.now(SAO_PAULO_TZ).replace(tzinfo=None)
        params = {
            **data,
            "created_at": created_at,
            "n_presente": int(data["n_presente"]),
            "p_presente": int(data["p_presente"]),
            "k_presente": int(data["k_presente"]),
            "bomba_ligada": int(data["bomba_ligada"]),
        }

        with get_connection() as connection, connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO farmtech_sensor_readings (
                    created_at,
                    device_id,
                    cultura,
                    umidade_percent,
                    temperatura_c,
                    ph,
                    n_presente,
                    p_presente,
                    k_presente,
                    limiar_umidade_percent,
                    bomba_ligada
                )
                VALUES (
                    :created_at,
                    :device_id,
                    :cultura,
                    :umidade_percent,
                    :temperatura_c,
                    :ph,
                    :n_presente,
                    :p_presente,
                    :k_presente,
                    :limiar_umidade_percent,
                    :bomba_ligada
                )
                """,
                params,
            )
            connection.commit()

        return self._normalize_sensor_reading(params)

    def list_sensor_readings(
        self,
        *,
        limit: int,
        offset: int,
        device_id: str | None = None,
        cultura: str | None = None,
    ) -> list[dict[str, Any]]:
        limit = max(1, min(int(limit), 500))
        offset = max(0, int(offset))
        params: dict[str, Any] = {}
        filters: list[str] = []

        if device_id:
            filters.append("device_id = :device_id")
            params["device_id"] = device_id

        if cultura:
            filters.append("LOWER(cultura) = LOWER(:cultura)")
            params["cultura"] = cultura

        where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

        with get_connection() as connection, connection.cursor() as cursor:
            cursor.execute(
                f"""
                SELECT
                    created_at,
                    device_id,
                    cultura,
                    umidade_percent,
                    temperatura_c,
                    ph,
                    n_presente,
                    p_presente,
                    k_presente,
                    limiar_umidade_percent,
                    bomba_ligada
                FROM farmtech_sensor_readings
                {where_clause}
                ORDER BY created_at DESC
                OFFSET {offset} ROWS FETCH NEXT {limit} ROWS ONLY
                """,
                params,
            )
            rows = _rows_to_dicts(cursor, cursor.fetchall())

        return [self._normalize_sensor_reading(row) for row in rows]

    def get_latest_sensor_reading(self, device_id: str | None = None) -> dict[str, Any] | None:
        params: dict[str, Any] = {}
        where_clause = ""

        if device_id:
            where_clause = "WHERE device_id = :device_id"
            params["device_id"] = device_id

        with get_connection() as connection, connection.cursor() as cursor:
            cursor.execute(
                f"""
                SELECT
                    created_at,
                    device_id,
                    cultura,
                    umidade_percent,
                    temperatura_c,
                    ph,
                    n_presente,
                    p_presente,
                    k_presente,
                    limiar_umidade_percent,
                    bomba_ligada
                FROM farmtech_sensor_readings
                {where_clause}
                ORDER BY created_at DESC
                FETCH FIRST 1 ROW ONLY
                """,
                params,
            )
            row = cursor.fetchone()
            if row is None:
                return None
            rows = _rows_to_dicts(cursor, [row])

        return self._normalize_sensor_reading(rows[0])

    def summarize_sensor_readings(
        self,
        *,
        device_id: str | None = None,
        cultura: str | None = None,
    ) -> dict[str, Any]:
        params: dict[str, Any] = {}
        filters: list[str] = []

        if device_id:
            filters.append("device_id = :device_id")
            params["device_id"] = device_id

        if cultura:
            filters.append("LOWER(cultura) = LOWER(:cultura)")
            params["cultura"] = cultura

        where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

        with get_connection() as connection, connection.cursor() as cursor:
            cursor.execute(
                f"""
                SELECT
                    COUNT(*) AS total_readings,
                    AVG(umidade_percent) AS avg_umidade_percent,
                    MIN(umidade_percent) AS min_umidade_percent,
                    MAX(umidade_percent) AS max_umidade_percent,
                    AVG(temperatura_c) AS avg_temperatura_c,
                    MIN(temperatura_c) AS min_temperatura_c,
                    MAX(temperatura_c) AS max_temperatura_c,
                    AVG(ph) AS avg_ph,
                    MIN(ph) AS min_ph,
                    MAX(ph) AS max_ph,
                    SUM(CASE WHEN bomba_ligada = 1 THEN 1 ELSE 0 END) AS bomba_ligada_count,
                    MAX(created_at) AS latest_created_at
                FROM farmtech_sensor_readings
                {where_clause}
                """,
                params,
            )
            rows = _rows_to_dicts(cursor, cursor.fetchall())

        summary = rows[0] if rows else {}
        summary["total_readings"] = int(summary.get("total_readings") or 0)
        summary["bomba_ligada_count"] = int(summary.get("bomba_ligada_count") or 0)
        return summary

    def _normalize_sensor_reading(self, row: dict[str, Any]) -> dict[str, Any]:
        normalized = dict(row)
        for field in ("n_presente", "p_presente", "k_presente", "bomba_ligada"):
            normalized[field] = bool(normalized[field])
        return normalized
