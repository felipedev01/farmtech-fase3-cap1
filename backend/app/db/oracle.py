from contextlib import contextmanager
from typing import Generator

import oracledb

from app.core.config import Settings

_pool: oracledb.ConnectionPool | None = None


def init_pool(settings: Settings) -> None:
    global _pool
    if _pool is not None:
        return

    _pool = oracledb.create_pool(
        user=settings.oracle_user,
        password=settings.oracle_password,
        dsn=settings.oracle_dsn,
        min=1,
        max=5,
        increment=1,
    )


def close_pool() -> None:
    global _pool
    if _pool is not None:
        _pool.close(force=True)
        _pool = None


@contextmanager
def get_connection() -> Generator[oracledb.Connection, None, None]:
    if _pool is None:
        raise RuntimeError("Oracle connection pool has not been initialized.")

    connection = _pool.acquire()
    try:
        yield connection
    finally:
        _pool.release(connection)


def ping() -> bool:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1 FROM dual")
            cursor.fetchone()
    return True
