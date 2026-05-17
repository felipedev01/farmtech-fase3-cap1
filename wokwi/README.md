# Wokwi + PlatformIO - ESP32 FarmTech

Projeto Wokwi da entrega Cap 1. O circuito simula um ESP32 enviando leituras para a API pública da FarmTech por HTTP.

Esta pasta também está configurada como projeto PlatformIO para rodar a simulação diretamente no VS Code com a extensão Wokwi.

## Componentes

- ESP32 DevKit v1.
- DHT22 para temperatura e umidade.
- LDR para luminosidade simulada.
- Potenciômetro para pH simulado.
- Switches N, P, K para presença de nutrientes.
- Switches para cultura e acionamento de bomba.
- LEDs individuais ligados diretamente nos switches para indicar quando cada controle está ligado.
- LED azul como indicador da bomba ligada pela regra final.

## Arquivos principais

- `platformio.ini`: configuração do build PlatformIO para ESP32 DevKit.
- `src/main.cpp`: firmware oficial usado pelo PlatformIO.
- `diagram.json`: circuito usado pela extensão Wokwi no VS Code.
- `wokwi.toml`: aponta a simulação para o firmware gerado pelo PlatformIO.
- `sketch.ino`: versão Arduino/Wokwi web preservada como referência.

## Configuração do endpoint

No arquivo `src/main.cpp`, ajuste:

```cpp
const char *API_BASE_URL = "http://host.wokwi.internal:8001";
```

Use somente a base da URL, sem `/sensor-readings` no final. O firmware monta o endpoint completo como:

```text
POST /sensor-readings
```

Para testar contra backend local a partir do Wokwi:

```cpp
const char *API_BASE_URL = "http://host.wokwi.internal:8001";
```

Esse acesso local exige o Wokwi Private IoT Gateway habilitado. Sem o gateway,
use uma API pública em Render/Railway, porque o gateway público do Wokwi não
acessa serviços locais da máquina.

Para deploy, use a URL pública do Render ou Railway, por exemplo:

```cpp
const char *API_BASE_URL = "https://farmtech-cap1-api.onrender.com";
```

Neste projeto, a URL atual preservada para a simulação é:

```cpp
const char *API_BASE_URL = "https://superior-player-valued-titans.trycloudflare.com";
```

## Payload enviado

Exemplo de JSON enviado pelo ESP32:

```json
{
  "device_id": "wokwi-esp32-cap1",
  "cultura": "soja",
  "umidade_percent": 62.0,
  "temperatura_c": 26.0,
  "ph": 6.5,
  "luminosidade_percent": 48.2,
  "n_presente": true,
  "p_presente": false,
  "k_presente": true,
  "limiar_umidade_percent": 55.0,
  "bomba_ligada": false
}
```

O campo `luminosidade_percent` é uma leitura adicional do Wokwi. A tabela Oracle principal pode armazenar apenas os campos obrigatórios do plano.

## Como rodar no VS Code com PlatformIO e Wokwi

1. Abra esta pasta no VS Code:

```powershell
code "Projetos/farm-tech-solutions/wokwi"
```

2. Confirme que as extensões `PlatformIO IDE` e `Wokwi Simulator` estão instaladas.
3. Execute o build do PlatformIO pela barra inferior ou pelo comando `PlatformIO: Build`.
4. Confirme que o build gerou:

```text
.pio/build/esp32dev/firmware.bin
.pio/build/esp32dev/firmware.elf
```

5. Abra `diagram.json` no VS Code.
6. Inicie a simulação pelo botão Start do painel Wokwi ou pelo comando `Wokwi: Start Simulator`.
7. Abra o Serial Monitor e confirme que aparecem WiFi conectado, payload JSON e resposta do `POST /sensor-readings`.

Se a extensão Wokwi pedir licença, execute `Wokwi: Request a new License` pela paleta de comandos do VS Code.

## Como rodar no Wokwi web

1. Abra o projeto no Wokwi.
2. Suba `diagram.json` e `sketch.ino`.
3. Ajuste `API_BASE_URL` para a API local ou pública.
4. Clique em Start.
5. Abra o Serial Monitor.
6. Acione os switches N, P, K, bomba e cultura.
7. Confirme que o Serial Monitor imprime `HTTP status: 200` ou `HTTP status: 201`.

## Evidência esperada no vídeo

- Circuito rodando no Wokwi.
- Serial Monitor exibindo WiFi conectado.
- Serial Monitor exibindo o payload JSON.
- Serial Monitor exibindo o status HTTP do `POST /sensor-readings`.
- Frontend ou Oracle mostrando a leitura recebida.
