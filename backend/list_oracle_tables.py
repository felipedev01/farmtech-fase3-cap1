from __future__ import annotations

from pathlib import Path

import oracledb

from app.core.config import Settings

BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = BASE_DIR / ".env"


def load_settings() -> Settings:
    if ENV_FILE.exists():
        return Settings(_env_file=ENV_FILE)
    return Settings()


def quote_identifier(identifier: str) -> str:
    return '"' + identifier.replace('"', '""') + '"'


def main() -> int:
    try:
        settings = load_settings()
    except Exception as exc:
        print(f"[ERRO] Nao foi possivel carregar as configuracoes Oracle: {exc}")
        return 1

    dsn = settings.oracle_dsn

    try:
        with oracledb.connect(
            user=settings.oracle_user,
            password=settings.oracle_password,
            dsn=dsn,
        ) as connection:
            with connection.cursor() as cursor:
                print(f"Conectado ao Oracle em {dsn}")
                print(f"Schema atual: {settings.oracle_user}\n")

                cursor.execute(
                    """
                    SELECT table_name
                    FROM user_tables
                    ORDER BY table_name
                    """
                )
                tables = [row[0] for row in cursor.fetchall()]

                if not tables:
                    print("Nenhuma tabela encontrada no schema atual.")
                    return 0

                for table_name in tables:
                    cursor.execute(f"SELECT COUNT(*) FROM {quote_identifier(table_name)}")
                    total_rows = cursor.fetchone()[0]

                    print(f"Tabela: {table_name}")
                    print(f"Total de registros: {total_rows}")
                    print("Colunas:")

                    cursor.execute(
                        """
                        SELECT column_name, data_type, data_length, nullable
                        FROM user_tab_columns
                        WHERE table_name = :table_name
                        ORDER BY column_id
                        """,
                        {"table_name": table_name},
                    )
                    for column_name, data_type, data_length, nullable in cursor.fetchall():
                        required = "obrigatoria" if nullable == "N" else "opcional"
                        print(f"  - {column_name}: {data_type}({data_length}), {required}")
                    print()

        return 0
    except oracledb.DatabaseError as exc:
        print(f"[ERRO] Falha ao listar tabelas do Oracle em {dsn}.")
        print(f"[DETALHE] {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
