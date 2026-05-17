from __future__ import annotations

import argparse
from pathlib import Path

import oracledb

from app.core.config import Settings

BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = BASE_DIR / ".env"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Valida a conexao minima com Oracle usando SELECT 1 FROM dual.",
    )
    parser.add_argument("--host", help="Sobrescreve ORACLE_HOST.")
    parser.add_argument("--port", type=int, help="Sobrescreve ORACLE_PORT.")
    parser.add_argument("--service", help="Sobrescreve ORACLE_SERVICE.")
    parser.add_argument("--user", help="Sobrescreve ORACLE_USER.")
    parser.add_argument("--password", help="Sobrescreve ORACLE_PASSWORD.")
    return parser.parse_args()


def load_settings() -> Settings:
    if ENV_FILE.exists():
        return Settings(_env_file=ENV_FILE)
    return Settings()


def build_connection_params(args: argparse.Namespace, settings: Settings) -> tuple[str, int, str, str, str]:
    host = args.host or settings.oracle_host
    port = args.port or settings.oracle_port
    service = args.service or settings.oracle_service
    user = args.user or settings.oracle_user
    password = args.password or settings.oracle_password
    return host, port, service, user, password


def main() -> int:
    args = parse_args()

    try:
        settings = load_settings()
        host, port, service, user, password = build_connection_params(args, settings)
    except Exception as exc:
        print(f"[ERRO] Nao foi possivel carregar as configuracoes Oracle: {exc}")
        print(
            "[DICA] Preencha backend/.env a partir de config/backend.env.example "
            "ou informe --host/--port/--service/--user/--password."
        )
        return 1

    dsn = f"{host}:{port}/{service}"

    connection: oracledb.Connection | None = None
    try:
        connection = oracledb.connect(user=user, password=password, dsn=dsn)
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1 FROM dual")
            result = cursor.fetchone()

        if result is None or result[0] != 1:
            print(f"[ERRO] SELECT 1 FROM dual retornou um resultado inesperado: {result}")
            return 1

        print(f"[OK] Conexao Oracle validada em {dsn} com o usuario {user}.")
        return 0
    except oracledb.DatabaseError as exc:
        print(f"[ERRO] Falha ao conectar ao Oracle em {dsn} com o usuario {user}.")
        print(f"[DETALHE] {exc}")
        return 1
    finally:
        if connection is not None:
            connection.close()
            print("[INFO] Conexao encerrada.")


if __name__ == "__main__":
    raise SystemExit(main())
