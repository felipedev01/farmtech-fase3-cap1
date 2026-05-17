from pydantic import BaseModel, ConfigDict


class OracleTableRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    table_name: str
    rows: int
