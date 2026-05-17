from __future__ import annotations

import argparse
from pathlib import Path

import oracledb

from app.core.config import Settings

BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = BASE_DIR / ".env"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Executa um arquivo SQL Oracle usando as credenciais de backend/.env.",
    )
    parser.add_argument("sql_file", help="Caminho do arquivo SQL a ser executado.")
    return parser.parse_args()


def load_settings() -> Settings:
    if ENV_FILE.exists():
        return Settings(_env_file=ENV_FILE)
    return Settings()


def is_plsql_start(stripped_line: str) -> bool:
    upper = stripped_line.upper()
    return upper.startswith(
        (
            "BEGIN",
            "DECLARE",
            "CREATE OR REPLACE FUNCTION",
            "CREATE OR REPLACE PROCEDURE",
            "CREATE OR REPLACE PACKAGE",
            "CREATE OR REPLACE TRIGGER",
            "CREATE OR REPLACE TYPE",
        )
    )


def iter_statements(script: str) -> list[str]:
    statements: list[str] = []
    current: list[str] = []
    plsql_block = False

    for raw_line in script.splitlines():
        line = raw_line.rstrip()
        stripped = line.strip()

        if not stripped and not current:
            continue

        if not current and is_plsql_start(stripped):
            plsql_block = True

        if stripped == "/" and plsql_block:
            statement = "\n".join(current).strip()
            if statement:
                statements.append(statement)
            current = []
            plsql_block = False
            continue

        current.append(line)

        if not plsql_block and stripped.endswith(";"):
            statement = "\n".join(current).strip()
            if statement.endswith(";"):
                statement = statement[:-1].rstrip()
            if statement:
                statements.append(statement)
            current = []

    trailing = "\n".join(current).strip()
    if trailing:
        statements.append(trailing[:-1].rstrip() if trailing.endswith(";") else trailing)

    return statements


def main() -> int:
    args = parse_args()
    sql_path = Path(args.sql_file).resolve()

    if not sql_path.exists():
        print(f"[ERRO] Arquivo SQL nao encontrado: {sql_path}")
        return 1

    try:
        settings = load_settings()
    except Exception as exc:
        print(f"[ERRO] Nao foi possivel carregar backend/.env: {exc}")
        return 1

    statements = iter_statements(sql_path.read_text(encoding="utf-8"))
    if not statements:
        print(f"[ERRO] Nenhum comando SQL foi identificado em {sql_path}.")
        return 1

    dsn = settings.oracle_dsn
    connection: oracledb.Connection | None = None

    try:
        connection = oracledb.connect(
            user=settings.oracle_user,
            password=settings.oracle_password,
            dsn=dsn,
        )
        with connection.cursor() as cursor:
            for index, statement in enumerate(statements, start=1):
                cursor.execute(statement)
                print(f"[OK] Comando {index}/{len(statements)} executado.")

        connection.commit()
        print(f"[OK] Arquivo SQL executado com sucesso: {sql_path}")
        return 0
    except oracledb.DatabaseError as exc:
        if connection is not None:
            connection.rollback()
        print(f"[ERRO] Falha ao executar {sql_path}: {exc}")
        return 1
    finally:
        if connection is not None:
            connection.close()
            print("[INFO] Conexao encerrada.")


if __name__ == "__main__":
    raise SystemExit(main())
