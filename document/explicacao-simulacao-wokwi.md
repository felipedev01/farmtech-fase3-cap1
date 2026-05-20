# Explicação didática da simulação Wokwi FarmTech

Este documento explica o funcionamento da simulação Wokwi do projeto FarmTech. A ideia é entender o que cada componente representa, como ele está ligado ao ESP32, como o firmware interpreta cada leitura e como os dados viram um envio para a API.

## 1. Visão geral

A simulação representa uma pequena estação agrícola com um ESP32. Esse ESP32 coleta dados de ambiente e de condição da cultura, decide se a bomba deve ficar ligada e envia uma leitura para o backend.

O fluxo geral é:

```text
Sensores e botões -> ESP32 -> regra da bomba -> JSON -> POST /sensor-readings -> backend
```

Na prática:

- o DHT22 informa temperatura e umidade;
- o LDR simula a luminosidade;
- o potenciômetro simula o pH;
- os botões N, P e K indicam se os nutrientes estão presentes;
- os botões Cultura A e Cultura B escolhem a cultura;
- o botão Bomba permite ligar a bomba manualmente;
- os LEDs ao lado dos controles acendem quando o respectivo switch está ligado;
- o LED azul mostra se a bomba está ligada pela lógica do código;
- a cada 15 segundos o ESP32 envia os dados para a API.

## 2. ESP32 DevKit v1

O ESP32 e o controlador principal da simulação. Ele recebe os sinais dos sensores e botões, processa tudo no firmware e envia os dados pela rede.

No Wokwi, ele aparece como `wokwi-esp32-devkit-v1`, com id `esp`.

No código, os pinos principais sao definidos assim:

```cpp
const int DHT_PIN = 15;
const int LDR_PIN = 34;
const int PH_PIN = 35;
const int BUTTON_N_PIN = 18;
const int BUTTON_P_PIN = 19;
const int BUTTON_K_PIN = 21;
const int BUTTON_PUMP_PIN = 22;
const int CULTURE_A_PIN = 25;
const int CULTURE_B_PIN = 26;
const int PUMP_LED_PIN = 23;
```

O ESP32 também se conecta ao Wi-Fi virtual do Wokwi:

```cpp
const char *WIFI_SSID = "Wokwi-GUEST";
const char *WIFI_PASSWORD = "";
```

Como testar:

- abra a simulação;
- inicie o Wokwi;
- abra o Serial Monitor;
- espere aparecer a mensagem de conexão Wi-Fi;
- depois acompanhe as leituras e os envios HTTP.

## 3. DHT22 - temperatura e umidade

O DHT22 representa um sensor de clima. Ele mede duas informacoes importantes para o campo:

- temperatura do ambiente;
- umidade.

No circuito:

- `VCC` do DHT22 vai para `3V3` do ESP32;
- `GND` do DHT22 vai para `GND`;
- `SDA` do DHT22 vai para o pino `D15`.

No código, ele e inicializado no `setup()`:

```cpp
dht.setup(DHT_PIN, DHTesp::DHT22);
```

No `loop()`, o ESP32 le os dados:

```cpp
TempAndHumidity dhtData = dht.getTempAndHumidity();
float humidity = isnan(dhtData.humidity) ? 0.0 : dhtData.humidity;
float temperature = isnan(dhtData.temperature) ? 0.0 : dhtData.temperature;
```

Campos gerados no JSON:

```json
"umidade_percent": 62.00,
"temperatura_c": 26.00
```

Importância na simulação:

- a temperatura e enviada apenas como informação de monitoramento;
- a umidade participa diretamente da decisao da bomba.

A regra da bomba usa a umidade assim:

```cpp
float humidityThreshold = 55.0;
bool pumpOn = pumpRequested || humidity < humidityThreshold;
```

Ou seja: se a umidade estiver abaixo de `55%`, a bomba liga automaticamente, mesmo que o switch Bomba esteja desligado.

Como testar no Wokwi:

- clique no sensor DHT22;
- altere os valores de temperatura e umidade;
- coloque a umidade abaixo de `55`;
- veja o LED azul ligar;
- acompanhe no Serial Monitor o campo `bomba=ON`.

## 4. LDR - sensor de luminosidade

O LDR representa um sensor de luz. Ele simula a quantidade de luminosidade recebida pela plantacao.

No circuito:

- `VCC` do LDR vai para `3V3`;
- `GND` vai para `GND`;
- `AO` vai para o pino analógico `D34`.

No código:

```cpp
float readLightPercent() {
  int raw = analogRead(LDR_PIN);
  return ((float)raw / 4095.0) * 100.0;
}
```

O ESP32 le um valor analógico entre `0` e `4095`. Depois converte esse valor para porcentagem:

```text
luminosidade_percent = leitura_bruta / 4095 * 100
```

Campo gerado no JSON:

```json
"luminosidade_percent": 48.20
```

Importância na simulação:

- mostra como uma grandeza analógica pode virar um valor percentual;
- complementa a leitura agrícola com informação de luz;
- no firmware atual, ela e enviada no payload.

Observação importante: o firmware envia `luminosidade_percent`, mas o schema principal do backend pode não armazenar esse campo se a tabela/API não tiver essa coluna. Mesmo assim, o valor aparece no Serial Monitor dentro do payload.

Como testar no Wokwi:

- ajuste o controle do sensor de luminosidade;
- observe a mudanca no campo `luz=...%` no Serial Monitor;
- espere o proximo envio de 15 segundos para ver o valor no JSON.

## 5. Potenciômetro - simulação do pH

O potenciômetro representa um sensor de pH simplificado. Ele não mede pH real; ele apenas gera um valor analógico que o código converte para uma faixa de pH.

No circuito:

- `VCC` do potenciômetro vai para `3V3`;
- `GND` vai para `GND`;
- `SIG` vai para o pino analógico `D35`.

No código:

```cpp
float readPh() {
  int raw = analogRead(PH_PIN);
  return 4.5 + ((float)raw / 4095.0) * 4.0;
}
```

O ESP32 le um valor entre `0` e `4095`. Esse valor e convertido para uma faixa entre `4.5` e `8.5`.

A conta e:

```text
ph = 4.5 + (leitura_bruta / 4095) * 4.0
```

Exemplos:

- leitura perto de `0`: pH perto de `4.5`;
- leitura no meio: pH perto de `6.5`;
- leitura perto de `4095`: pH perto de `8.5`.

Campo gerado no JSON:

```json
"ph": 6.50
```

Importância na simulação:

- representa a acidez ou alcalinidade do solo;
- ajuda a mostrar uma leitura analógica transformada em uma unidade agrícola compreensível.

Como testar no Wokwi:

- gire o potenciômetro;
- observe o valor `ph=...` no Serial Monitor;
- espere o proximo envio para ver o novo pH no payload JSON.

## 6. Switches N, P e K - nutrientes

Os switches N, P e K simulam a presença dos três principais nutrientes usados no monitoramento agrícola:

- `N`: nitrogênio;
- `P`: fósforo;
- `K`: potássio.

No circuito:

- switch N vai para o pino `D18`;
- switch P vai para o pino `D19`;
- switch K vai para o pino `D21`;
- o terminal comum de cada switch vai ao pino do ESP32;
- o terminal direito de cada switch vai ao `GND`;
- os LEDs dos switches N, P e K ficam ligados diretamente entre `3V3` e o terminal comum de cada switch.

No código, os controles sao configurados com `INPUT_PULLUP`:

```cpp
pinMode(BUTTON_N_PIN, INPUT_PULLUP);
pinMode(BUTTON_P_PIN, INPUT_PULLUP);
pinMode(BUTTON_K_PIN, INPUT_PULLUP);
```

Isso e importante: com `INPUT_PULLUP`, o pino fica naturalmente em `HIGH`. Quando o switch e ligado para o lado conectado ao `GND`, ele liga o pino ao `GND`, entao a leitura vira `LOW`.

Por isso a funcao `isPressed()` funciona assim:

```cpp
bool isPressed(int pin) {
  return digitalRead(pin) == LOW;
}
```

Campos gerados no JSON:

```json
"n_presente": true,
"p_presente": false,
"k_presente": true
```

Importância na simulação:

- cada botão representa se aquele nutriente está presente ou não;
- switch ligado significa `true`;
- switch desligado significa `false`.

Como testar no Wokwi:

- ligue o switch `N`;
- veja o LED verde de N ficar aceso enquanto o switch permanecer ligado;
- aguarde o proximo envio;
- veja `"n_presente": true` no payload;
- desligue o switch e observe que volta para `false` no envio seguinte.

## 7. Switches Cultura A e Cultura B - selecao da cultura

Esses dois switches servem para selecionar qual cultura está sendo monitorada. Em vez de ter quatro controles separados, o código usa combinacoes dos dois switches.

No circuito:

- Cultura A vai para o pino `D25`;
- Cultura B vai para o pino `D26`;
- o terminal comum de cada switch vai ao pino do ESP32;
- o terminal direito de cada switch vai ao `GND`;
- os LEDs de Cultura A e Cultura B ficam ligados diretamente entre `3V3` e o terminal comum de cada switch.

No código:

```cpp
String activeCulture() {
  bool a = isPressed(CULTURE_A_PIN);
  bool b = isPressed(CULTURE_B_PIN);

  if (!a && !b) {
    return "soja";
  }
  if (a && !b) {
    return "milho";
  }
  if (!a && b) {
    return "cafe";
  }
  return "cana";
}
```

A regra fica assim:

| Cultura A | Cultura B | Cultura enviada |
| --- | --- | --- |
| desligado | desligado | `soja` |
| ligado | desligado | `milho` |
| desligado | ligado | `cafe` |
| ligado | ligado | `cana` |

Campo gerado no JSON:

```json
"cultura": "soja"
```

Importância na simulação:

- permite simular leituras de diferentes culturas;
- o backend pode filtrar ou agrupar leituras por cultura.

Como testar no Wokwi:

- deixe os dois botões soltos e veja `cultura=soja`;
- ligue apenas Cultura A e veja o LED de Cultura A ficar aceso e `cultura=milho`;
- ligue apenas Cultura B e veja o LED de Cultura B ficar aceso e `cultura=cafe`;
- ligue os dois e veja os dois LEDs acesos e `cultura=cana`.

## 8. Switch Bomba - acionamento manual

O switch Bomba representa uma ordem manual para ligar a bomba de irrigacao.

No circuito:

- o switch Bomba vai para o pino `D22`;
- o terminal comum do switch vai ao pino do ESP32;
- o terminal direito vai ao `GND`;
- o LED vermelho do switch Bomba fica ligado diretamente entre `3V3` e o terminal comum do switch.

No código:

```cpp
bool pumpRequested = isPressed(BUTTON_PUMP_PIN);
bool pumpOn = pumpRequested || humidity < humidityThreshold;
```

Isso significa que a bomba pode ligar por dois motivos:

1. acionamento manual: o switch Bomba está ligado;
2. acionamento automatico: a umidade está abaixo de `55%`.

Campo gerado no JSON:

```json
"bomba_ligada": true
```

Importância na simulação:

- mostra a diferenca entre comando manual e automacao;
- permite testar a bomba sem precisar alterar a umidade do DHT22.

Como testar no Wokwi:

- ligue o switch Bomba;
- veja o LED vermelho do switch Bomba ficar aceso;
- veja também o LED azul da bomba acender, porque o comando manual liga a bomba;
- confira no Serial Monitor `bomba=ON`;
- desligue o switch;
- se a umidade estiver acima de `55%`, a bomba desliga;
- se a umidade estiver abaixo de `55%`, ela continua ligada automaticamente.

## 9. LEDs indicadores dos switches

Agora a simulação possui LEDs individuais para mostrar quando cada switch está ligado.

Esses LEDs não mudam o payload enviado para a API. Eles servem apenas como sinalizacao visual no Wokwi.

No circuito:

- o anodo de cada LED vai para `3V3`;
- o catodo de cada LED vai para o terminal comum do respectivo switch;
- quando o switch e ligado para o lado do `GND`, esse terminal comum e conectado ao `GND`;
- nesse momento a corrente passa por `3V3 -> LED -> switch -> GND`, e o LED fica aceso.

Esses LEDs não usam pinos extras do ESP32 e não dependem de `digitalWrite()`. Eles acendem pela ligacao física com o botão.

Como os controles usam `INPUT_PULLUP`, ligado significa `LOW` na entrada do ESP32. Essa mesma queda para `GND` também faz o LED correspondente acender.

## 10. LED azul - indicador da bomba

O LED azul não e uma bomba real. Ele e apenas um indicador visual para mostrar se a lógica da bomba está ligada ou desligada.

Esse LED azul e diferente dos LEDs dos switches. Os LEDs dos switches mostram apenas se cada controle está ligado. O LED azul mostra se a bomba está ligada pela decisao final do sistema.

Por isso, o LED azul pode acender mesmo sem o switch Bomba estar ligado, caso a umidade esteja abaixo de `55%`.

No circuito:

- anodo do LED vai para o pino `D23`;
- catodo vai para `GND`.

No código:

```cpp
digitalWrite(PUMP_LED_PIN, pumpOn ? HIGH : LOW);
```

Se `pumpOn` for `true`, o ESP32 manda `HIGH` para o LED e ele acende. Se `pumpOn` for `false`, manda `LOW` e o LED apaga.

Campo relacionado no JSON:

```json
"bomba_ligada": true
```

Importância na simulação:

- facilita enxergar a decisao do código sem depender apenas do Serial Monitor;
- confirma visualmente se a regra da bomba está funcionando.

Como testar no Wokwi:

- pressione o botão Bomba e veja o LED acender;
- reduza a umidade abaixo de `55%` e veja o LED acender automaticamente;
- aumente a umidade acima de `55%` e solte o botão Bomba para ver o LED apagar.

## 11. Wi-Fi e envio para a API

Depois de ler os componentes, o ESP32 monta um JSON e envia para a API configurada.

A URL base atual e:

```cpp
const char *API_BASE_URL = "https://farmtech-fase3-cap1-api.onrender.com";
```

O endpoint completo e montado no código:

```cpp
String url = String(API_BASE_URL) + "/sensor-readings";
```

Entao o envio real e:

```text
POST /sensor-readings
```

O envio acontece nesta função:

```cpp
int statusCode = http.POST(payload);
String response = http.getString();
```

Exemplo de payload enviado:

```json
{
  "device_id": "wokwi-esp32-cap1",
  "cultura": "soja",
  "umidade_percent": 62.00,
  "temperatura_c": 26.00,
  "ph": 6.50,
  "luminosidade_percent": 48.20,
  "n_presente": true,
  "p_presente": false,
  "k_presente": true,
  "limiar_umidade_percent": 55.00,
  "bomba_ligada": false
}
```

O envio não acontece a cada volta do `loop()`. O código espera 15 segundos entre os envios:

```cpp
const unsigned long SEND_INTERVAL_MS = 15000;
```

Como testar no Wokwi:

- inicie a simulação;
- abra o Serial Monitor;
- espere a conexão Wi-Fi;
- aguarde o primeiro envio;
- procure as linhas `POST`, `Payload`, `HTTP status` e `Resposta`.

## 12. O que acontece dentro do setup()

O `setup()` roda uma vez quando o ESP32 inicia.

Ele faz quatro coisas principais:

1. inicia o Serial Monitor:

```cpp
Serial.begin(115200);
```

2. configura os switches como entrada com pull-up interno:

```cpp
pinMode(BUTTON_N_PIN, INPUT_PULLUP);
pinMode(BUTTON_P_PIN, INPUT_PULLUP);
pinMode(BUTTON_K_PIN, INPUT_PULLUP);
pinMode(BUTTON_PUMP_PIN, INPUT_PULLUP);
pinMode(CULTURE_A_PIN, INPUT_PULLUP);
pinMode(CULTURE_B_PIN, INPUT_PULLUP);
```

3. configura o LED da bomba como saida:

```cpp
pinMode(PUMP_LED_PIN, OUTPUT);
```

4. configura leituras analógicas e inicia o DHT22:

```cpp
analogReadResolution(12);
dht.setup(DHT_PIN, DHTesp::DHT22);
```

5. conecta no Wi-Fi:

```cpp
connectWiFi();
```

## 13. O que acontece dentro do loop()

O `loop()` roda repetidamente enquanto a simulação estiver ligada.

Primeiro ele garante que o Wi-Fi está conectado:

```cpp
connectWiFi();
```

Depois le os sensores:

```cpp
TempAndHumidity dhtData = dht.getTempAndHumidity();
float ph = readPh();
float lightPercent = readLightPercent();
```

Depois le os botões:

```cpp
bool nPresent = isPressed(BUTTON_N_PIN);
bool pPresent = isPressed(BUTTON_P_PIN);
bool kPresent = isPressed(BUTTON_K_PIN);
bool pumpRequested = isPressed(BUTTON_PUMP_PIN);
String culture = activeCulture();
```

Depois decide se a bomba liga:

```cpp
bool pumpOn = pumpRequested || humidity < humidityThreshold;
```

Depois atualiza o LED final da bomba:

```cpp
digitalWrite(PUMP_LED_PIN, pumpOn ? HIGH : LOW);
```

Os LEDs dos switches não aparecem aqui porque foram ligados diretamente aos switches no circuito.

Por fim, se ja passaram 15 segundos, monta o JSON e envia para a API:

```cpp
String payload = buildPayload(...);
sendReading(payload);
lastSendAt = millis();
```

O `delay(250)` no final apenas reduz a velocidade do loop para não ficar executando rápido demais:

```cpp
delay(250);
```

## 14. Como interpretar uma leitura no Serial Monitor

Uma linha resumida pode aparecer assim:

```text
Leitura: cultura=soja temp=26.0C umidade=62.0% ph=6.50 luz=48.2% bomba=OFF
```

Interpretacao:

- `cultura=soja`: nenhum switch de cultura está ligado;
- `temp=26.0C`: DHT22 está simulando 26 graus;
- `umidade=62.0%`: umidade acima do limite de 55%;
- `ph=6.50`: potenciômetro está no meio da escala;
- `luz=48.2%`: luminosidade está proxima da metade;
- `bomba=OFF`: a bomba está desligada porque a umidade está boa e o switch Bomba está desligado.

Se a umidade cair para `40%`, a leitura pode virar:

```text
Leitura: cultura=soja temp=26.0C umidade=40.0% ph=6.50 luz=48.2% bomba=ON
```

Nesse caso, a bomba liga automaticamente porque `40` e menor que o limite `55`.

## 15. Resumo componente por componente

| Componente | Pino | Papel na simulação | Campo no JSON |
| --- | --- | --- | --- |
| ESP32 | varios | controla tudo e envia dados | `device_id` |
| DHT22 | D15 | mede temperatura e umidade | `temperatura_c`, `umidade_percent` |
| LDR | D34 | simula luminosidade | `luminosidade_percent` |
| Potenciômetro | D35 | simula pH | `ph` |
| Switch N | D18 | presença de nitrogênio | `n_presente` |
| Switch P | D19 | presença de fósforo | `p_presente` |
| Switch K | D21 | presença de potássio | `k_presente` |
| Switch Bomba | D22 | comando manual da bomba | `bomba_ligada` |
| Cultura A | D25 | selecao de cultura | `cultura` |
| Cultura B | D26 | selecao de cultura | `cultura` |
| LED N | direto no switch N | indica switch N ligado | não altera o JSON |
| LED P | direto no switch P | indica switch P ligado | não altera o JSON |
| LED K | direto no switch K | indica switch K ligado | não altera o JSON |
| LED switch Bomba | direto no switch Bomba | indica switch Bomba ligado | não altera o JSON |
| LED Cultura A | direto no switch Cultura A | indica Cultura A ligada | não altera o JSON |
| LED Cultura B | direto no switch Cultura B | indica Cultura B ligada | não altera o JSON |
| LED azul da bomba | D23 | indicador visual da bomba ligada | representa `bomba_ligada` |

## 16. Checklist para entender a simulação na prática

Use esta ordem para testar e entender:

1. Inicie o Wokwi e abra o Serial Monitor.
2. Confirme que apareceu `WiFi conectado`.
3. Espere o primeiro `Payload`.
4. Altere a umidade do DHT22 para menos de `55%` e veja a bomba ligar.
5. Aumente a umidade para mais de `55%` e veja a bomba desligar.
6. Ligue o switch Bomba e veja o LED vermelho do switch e o LED azul da bomba ligarem.
7. Ligue N, P e K e confira os LEDs dos switches e os campos booleanos no JSON.
8. Gire o potenciômetro e acompanhe o pH.
9. Altere o LDR e acompanhe a luminosidade.
10. Teste Cultura A, Cultura B e os dois juntos para ver os LEDs roxos ficarem acesos e os valores `milho`, `café` e `cana`.

Depois desse teste, a simulação deve ficar clara: cada componente muda uma parte do estado agrícola, o ESP32 transforma isso em dados estruturados e envia tudo para o backend.

