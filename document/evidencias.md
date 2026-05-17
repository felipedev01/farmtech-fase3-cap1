# Evidencias da Entrega

Este arquivo organiza os prints e registros esperados para fechar a entrega do Cap 1.

## Prints obrigatorios do Oracle

Salvar em `assets/evidencias/oracle/`:

- `01-conexao-oracle.png`: conexao criada no Oracle SQL Developer.
- `02-tabela-criada.png`: tabela `FARMTECH_SENSOR_READINGS` visivel no schema.
- `03-importacao-ou-insert.png`: carga inicial da base da Fase 2 ou insert de validacao.
- `04-select-todos-registros.png`: resultado de `SELECT * FROM FARMTECH_SENSOR_READINGS`.
- `05-consulta-resumo-cultura.png`: consulta de resumo por cultura.

## Prints do Wokwi

Salvar em `assets/evidencias/wokwi/`:

- `01-circuito-wokwi.png`: circuito ESP32 com sensores e botoes.
- `02-serial-monitor-http.png`: Serial Monitor com WiFi conectado, payload e status HTTP.

## Prints do frontend

Salvar em `assets/evidencias/frontend/`:

- `01-tela-circuito.png`: frontend exibindo o Wokwi embutido.
- `02-tela-dados.png`: dashboard/listagem com leituras vindas da API e Oracle.

## Consultas SQL usadas

Usar o arquivo:

```text
document/sql/farmtech_sensor_readings.sql
```

As consultas minimas para o relatorio sao:

```sql
SELECT *
FROM FARMTECH_SENSOR_READINGS
ORDER BY created_at DESC;
```

```sql
SELECT
    cultura,
    COUNT(*) AS total_leituras,
    ROUND(AVG(umidade_percent), 2) AS umidade_media,
    ROUND(AVG(temperatura_c), 2) AS temperatura_media,
    ROUND(AVG(ph), 2) AS ph_medio,
    SUM(bomba_ligada) AS acionamentos_bomba
FROM FARMTECH_SENSOR_READINGS
GROUP BY cultura
ORDER BY cultura;
```

## Roteiro do video nao listado

Tempo maximo: 5 minutos.

1. Mostrar rapidamente a estrutura do repositorio.
2. Abrir o README e explicar a arquitetura Wokwi -> API -> Oracle -> frontend.
3. Mostrar o Wokwi rodando e acionar sensores/botoes.
4. Mostrar o Serial Monitor com status HTTP.
5. Mostrar a consulta no Oracle SQL Developer.
6. Mostrar o frontend listando a leitura gravada.
7. Encerrar informando que o video esta como nao listado no YouTube.

## Link do video

Preencher antes da entrega:

```text
https://www.youtube.com/watch?v=
```
