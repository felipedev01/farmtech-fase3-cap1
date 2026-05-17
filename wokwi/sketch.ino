#include <DHTesp.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>

const char *WIFI_SSID = "Wokwi-GUEST";
const char *WIFI_PASSWORD = "";

// Use the public backend URL after deploy, for example:
// https://farmtech-cap1-api.onrender.com
// For local tests from Wokwi with the Private IoT Gateway enabled:
// http://host.wokwi.internal:8001
const char *API_BASE_URL = "https://superior-player-valued-titans.trycloudflare.com";
const char *DEVICE_ID = "wokwi-esp32-cap1";

const unsigned long SEND_INTERVAL_MS = 15000;

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

DHTesp dht;
unsigned long lastSendAt = 0;

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }

  Serial.print("Conectando ao WiFi ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("WiFi conectado. IP: ");
  Serial.println(WiFi.localIP());
}

bool isPressed(int pin) {
  return digitalRead(pin) == LOW;
}

String boolJson(bool value) {
  return value ? "true" : "false";
}

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

float readPh() {
  int raw = analogRead(PH_PIN);
  return 4.5 + ((float)raw / 4095.0) * 4.0;
}

float readLightPercent() {
  int raw = analogRead(LDR_PIN);
  return ((float)raw / 4095.0) * 100.0;
}

String buildPayload(
    float humidity,
    float temperature,
    float ph,
    float lightPercent,
    bool nPresent,
    bool pPresent,
    bool kPresent,
    bool pumpOn,
    String culture,
    float humidityThreshold) {
  String payload = "{";
  payload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  payload += "\"cultura\":\"" + culture + "\",";
  payload += "\"umidade_percent\":" + String(humidity, 2) + ",";
  payload += "\"temperatura_c\":" + String(temperature, 2) + ",";
  payload += "\"ph\":" + String(ph, 2) + ",";
  payload += "\"luminosidade_percent\":" + String(lightPercent, 2) + ",";
  payload += "\"n_presente\":" + boolJson(nPresent) + ",";
  payload += "\"p_presente\":" + boolJson(pPresent) + ",";
  payload += "\"k_presente\":" + boolJson(kPresent) + ",";
  payload += "\"limiar_umidade_percent\":" + String(humidityThreshold, 2) + ",";
  payload += "\"bomba_ligada\":" + boolJson(pumpOn);
  payload += "}";
  return payload;
}

void sendReading(String payload) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi desconectado. Envio cancelado.");
    return;
  }

  String url = String(API_BASE_URL) + "/sensor-readings";
  HTTPClient http;
  WiFiClient plainClient;
  WiFiClientSecure secureClient;

  if (url.startsWith("https://")) {
    secureClient.setInsecure();
    http.begin(secureClient, url);
  } else {
    http.begin(plainClient, url);
  }

  http.addHeader("Content-Type", "application/json");

  Serial.print("POST ");
  Serial.println(url);
  Serial.print("Payload: ");
  Serial.println(payload);

  int statusCode = http.POST(payload);
  String response = http.getString();

  Serial.print("HTTP status: ");
  Serial.println(statusCode);
  Serial.print("Resposta: ");
  Serial.println(response);
  Serial.println("---");

  http.end();
}

void setup() {
  Serial.begin(115200);

  pinMode(BUTTON_N_PIN, INPUT_PULLUP);
  pinMode(BUTTON_P_PIN, INPUT_PULLUP);
  pinMode(BUTTON_K_PIN, INPUT_PULLUP);
  pinMode(BUTTON_PUMP_PIN, INPUT_PULLUP);
  pinMode(CULTURE_A_PIN, INPUT_PULLUP);
  pinMode(CULTURE_B_PIN, INPUT_PULLUP);
  pinMode(PUMP_LED_PIN, OUTPUT);

  analogReadResolution(12);
  dht.setup(DHT_PIN, DHTesp::DHT22);

  connectWiFi();
}

void loop() {
  connectWiFi();

  TempAndHumidity dhtData = dht.getTempAndHumidity();
  float humidity = isnan(dhtData.humidity) ? 0.0 : dhtData.humidity;
  float temperature = isnan(dhtData.temperature) ? 0.0 : dhtData.temperature;
  float ph = readPh();
  float lightPercent = readLightPercent();
  float humidityThreshold = 55.0;

  bool nPresent = isPressed(BUTTON_N_PIN);
  bool pPresent = isPressed(BUTTON_P_PIN);
  bool kPresent = isPressed(BUTTON_K_PIN);
  bool pumpRequested = isPressed(BUTTON_PUMP_PIN);
  bool pumpOn = pumpRequested || humidity < humidityThreshold;
  String culture = activeCulture();

  digitalWrite(PUMP_LED_PIN, pumpOn ? HIGH : LOW);

  if (millis() - lastSendAt >= SEND_INTERVAL_MS || lastSendAt == 0) {
    String payload = buildPayload(
        humidity,
        temperature,
        ph,
        lightPercent,
        nPresent,
        pPresent,
        kPresent,
        pumpOn,
        culture,
        humidityThreshold);

    Serial.print("Leitura: cultura=");
    Serial.print(culture);
    Serial.print(" temp=");
    Serial.print(temperature, 1);
    Serial.print("C umidade=");
    Serial.print(humidity, 1);
    Serial.print("% ph=");
    Serial.print(ph, 2);
    Serial.print(" luz=");
    Serial.print(lightPercent, 1);
    Serial.print("% bomba=");
    Serial.println(pumpOn ? "ON" : "OFF");

    sendReading(payload);
    lastSendAt = millis();
  }

  delay(250);
}
