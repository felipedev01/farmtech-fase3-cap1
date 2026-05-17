# FarmTech Solutions - Fase 3 Cap 1

Entrega "Circuito de Irrigação Inteligente", organizada como projeto GitHub com simulação Wokwi, API Python, banco Oracle e frontend de visualização.

## Confirmado pelo enunciado

A entrega obrigatória do Cap 1 confirma:

- uso de banco de dados Oracle;
- relatório com os passos seguidos;
- prints de tela das consultas realizadas;
- uso do arquivo da Fase 2 como base para importação;
- repositório GitHub organizado;
- `README.md` documentando o projeto, com prints do banco;
- códigos C/C++ ou Python usados;
- vídeo de até 5 minutos no YouTube como "não listado".

## Arquitetura

```text
Wokwi ESP32
  -> POST /sensor-readings
  -> API FastAPI pública
  -> Oracle FIAP: FARMTECH_SENSOR_READINGS
  -> frontend Vercel: circuito e dados
```

Fluxo esperado:

1. O ESP32 simulado conecta no WiFi `Wokwi-GUEST`.
2. O firmware lê DHT22, LDR, pH simulado, botões N/P/K, cultura e bomba.
3. O Wokwi envia JSON para a API pública em `POST /sensor-readings`.
4. A API grava os dados no Oracle.
5. O frontend consulta a API e exibe as leituras gravadas.

## Estrutura

```text
backend/                     API FastAPI e scripts Oracle
config/                      exemplos de variáveis locais
frontend/                    app Next.js com telas de circuito e dados
wokwi/                       sketch.ino e diagram.json do ESP32
document/sql/                SQL de criação e consultas Oracle
document/evidencias.md       roteiro de prints e vídeo
assets/evidencias/           pasta para prints da entrega
```

## Wokwi

Arquivos principais:

- `wokwi/sketch.ino`
- `wokwi/diagram.json`
- `wokwi/README.md`

No `wokwi/sketch.ino`, ajustar a URL da API:

```cpp
const char *API_BASE_URL = "https://sua-api-publica.onrender.com";
```

Para teste local a partir do Wokwi:

```cpp
const char *API_BASE_URL = "http://host.wokwi.internal:8000";
```

O firmware envia o payload para:

```text
POST /sensor-readings
```

O Serial Monitor deve exibir WiFi conectado, payload JSON e status HTTP de resposta.

## Configuração Oracle

Crie o arquivo `backend/.env` com:

```env
ORACLE_HOST=oracle.fiap.com.br
ORACLE_PORT=1521
ORACLE_SERVICE=ORCL
ORACLE_USER=RM000000
ORACLE_PASSWORD=sua_senha_ou_ddmmaa
FRONTEND_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

O arquivo `backend/.env` é local e está ignorado pelo Git.

## SQL usado

O SQL principal está em:

```text
document/sql/farmtech_sensor_readings.sql
```

Ele contem:

- criação da tabela `FARMTECH_SENSOR_READINGS`;
- índices por data e cultura;
- insert manual de validação;
- `SELECT *` para evidência;
- consulta de resumo por cultura;
- consulta de leituras com baixa umidade.

Execute a partir de `backend/`:

```bash
python run_sql_file.py ../document/sql/farmtech_sensor_readings.sql
```

## Rodar backend local

Execute os comandos a partir da pasta `backend/`.

Instalar dependências:

```bash
pip install -r requirements.txt
```

Validar conexão Oracle:

```bash
python test_oracle_connection.py
```

Listar tabelas do schema:

```bash
python list_oracle_tables.py
```

Subir API local:

```bash
uvicorn app.main:app --reload
```

Validações esperadas:

```text
GET http://127.0.0.1:8000/health
GET http://127.0.0.1:8000/health/db
POST http://127.0.0.1:8000/sensor-readings
GET http://127.0.0.1:8000/sensor-readings
GET http://127.0.0.1:8000/sensor-readings/latest
GET http://127.0.0.1:8000/sensor-readings/summary
```

## Rodar frontend local

Execute os comandos a partir da pasta `frontend/`.

Criar arquivo local de ambiente:

```bash
cp .env.example .env.local
```

Instalar dependências:

```bash
npm install
```

Subir a interface:

```bash
npm run dev
```

Telas principais:

```text
http://localhost:3000/dados
http://localhost:3000/circuito
```

Validações do frontend:

```bash
npm run lint
npm run build
npm audit --omit=dev
```

## Deploy

Repositorio oficial da entrega:

```text
https://github.com/felipedev01/farmtech-fase3-cap1
```

### Backend Render

Configurar variáveis em segredo:

```env
ORACLE_HOST=oracle.fiap.com.br
ORACLE_PORT=1521
ORACLE_SERVICE=ORCL
ORACLE_USER=RM000000
ORACLE_PASSWORD=sua_senha_ou_ddmmaa
FRONTEND_ORIGINS=https://sua-url-vercel.vercel.app
```

Comando de start recomendado:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Este repositório inclui `render.yaml` para criar o Web Service Python no Render
a partir da pasta `backend/`. As variáveis Oracle ficam marcadas como
`sync: false` e devem ser preenchidas no painel ou via API do Render, sem
versionar o arquivo `backend/.env`.

Após publicar, validar:

```text
https://sua-api-publica/health
https://sua-api-publica/health/db
```

### Frontend Vercel

Configurar:

```env
NEXT_PUBLIC_API_BASE_URL=https://sua-api-publica
NEXT_PUBLIC_WOKWI_EMBED_URL=https://wokwi.com/projects/SEU_PROJETO
NEXT_PUBLIC_WOKWI_EMBED_VERSION=versao-do-circuito
```

O frontend é publicado a partir da pasta `frontend/` como projeto Next.js. A
variável `NEXT_PUBLIC_API_BASE_URL` deve apontar para a URL pública do Render.

Validar em produção:

1. A tela de circuito carrega o Wokwi embutido.
2. O Wokwi envia para a API pública.
3. A API grava no Oracle.
4. A tela de dados lista a leitura gravada.

Quando o circuito for alterado no Wokwi, salve o projeto remoto e atualize
`NEXT_PUBLIC_WOKWI_EMBED_VERSION` para forçar o iframe a recarregar a nova
versão no frontend.

## Evidências

Usar o roteiro em:

```text
document/evidencias.md
```

Salvar prints em:

```text
assets/evidencias/oracle/
assets/evidencias/wokwi/
assets/evidencias/frontend/
```

Evidências mínimas:

- conexão no Oracle SQL Developer;
- tabela `FARMTECH_SENSOR_READINGS`;
- resultado de `SELECT * FROM FARMTECH_SENSOR_READINGS`;
- Wokwi rodando com Serial Monitor e status HTTP;
- frontend com circuito;
- frontend com dados gravados no Oracle;
- link do vídeo não listado no YouTube.

## Observação sobre arquivos de dados

Arquivos CSV e planilhas podem fazer parte da entrega, por isso o `.gitignore` deste projeto não ignora `*.csv`, `*.xls` ou `*.xlsx` por padrão.
