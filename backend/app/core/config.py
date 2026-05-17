from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "Farm Tech Solutions API"
    app_version: str = "1.0.0"
    oracle_user: str = Field(..., alias="ORACLE_USER")
    oracle_password: str = Field(..., alias="ORACLE_PASSWORD")
    oracle_host: str = Field(..., alias="ORACLE_HOST")
    oracle_port: int = Field(1521, alias="ORACLE_PORT")
    oracle_service: str = Field(..., alias="ORACLE_SERVICE")
    frontend_origins: str = Field(
        "http://localhost:3000",
        alias="FRONTEND_ORIGINS",
    )

    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def oracle_dsn(self) -> str:
        return f"{self.oracle_host}:{self.oracle_port}/{self.oracle_service}"

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.frontend_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()
