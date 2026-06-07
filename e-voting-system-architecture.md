#include <WiFi.h>
#include <HTTPClient.h>
#include <Adafruit_Fingerprint.h>

// ================== CONFIG ==================
const char* ssid = "BALBIN 2.4G";
const char* password = "Ryzen55600g";
const char* serverUrl = "http://192.168.100.78:3000/api/hardware/scan";

// Fingerprint sensor (UART2)
HardwareSerial fingerSerial(2);
const int RX_PIN = 16;
const int TX_PIN = 17;

Adafruit_Fingerprint finger(&fingerSerial);

// ================== LED PINS ==================
const int LED_GREEN = 12;  // Newly registered
const int LED_RED   = 13;  // Incorrect / error
const int LED_BLUE  = 14;  // Fingerprint exists / match found

// ================== SETUP ==================
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\n=== ESP32 Fingerprint System Started ===");

  // LED setup
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED,   OUTPUT);
  pinMode(LED_BLUE,  OUTPUT);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_RED,   LOW);
  digitalWrite(LED_BLUE,  LOW);

  fingerSerial.begin(57600, SERIAL_8N1, RX_PIN, TX_PIN);
  finger.begin(57600);

  if (finger.verifyPassword()) {
    Serial.println("✅ Fingerprint sensor found!");
    finger.getTemplateCount();
    Serial.print("📊 Templates stored: ");
    Serial.println(finger.templateCount);
    finger.setSecurityLevel(5);
    Serial.println("🔒 Security level set to 5");
  } else {
    Serial.println("❌ Fingerprint sensor NOT found! Check wiring (5V needed).");
    while (1) delay(1000);
  }

  connectWiFi();
  Serial.println("\n⏳ Waiting for finger...");
}

// ================== LED HELPER ==================
void flashLED(int pin, int duration = 2000) {
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_RED,   LOW);
  digitalWrite(LED_BLUE,  LOW);
  digitalWrite(pin, HIGH);
  delay(duration);
  digitalWrite(pin, LOW);
}

// ================== LOOP ==================
void loop() {
  uint8_t p = finger.getImage();

  if (p == FINGERPRINT_OK) {
    Serial.println("\n👆 Finger detected! Processing...");
    processFinger();
    delay(2000);
    clearFingerprintBuffer();
    Serial.println("\n⏳ Waiting for finger...");
  }

  delay(100);
}

// ================== WIFI ==================
void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n❌ WiFi connection failed!");
  }
}

// ================== CLEAR BUFFER ==================
void clearFingerprintBuffer() {
  finger.fingerID = -1;
  finger.confidence = 0;

  uint8_t p;
  int tries = 0;
  do {
    p = finger.getImage();
    delay(80);
    tries++;
  } while (p == FINGERPRINT_OK && tries < 8);
  delay(200);
}

// ================== PROCESS FINGER (Auto Match or Enroll) ==================
void processFinger() {
  uint8_t p = finger.image2Tz(1);
  if (p != FINGERPRINT_OK) {
    Serial.println("❌ Image conversion failed. Try again.");
    flashLED(LED_RED);  // ❌ Error → RED
    return;
  }

  Serial.println("🔍 Searching database...");
  p = finger.fingerSearch();

  if (p == FINGERPRINT_OK) {
    Serial.print("✅ MATCH FOUND → ID #");
    Serial.print(finger.fingerID);
    Serial.print(" (confidence: ");
    Serial.print(finger.confidence);
    Serial.println(")");
    flashLED(LED_BLUE);  // ✅ Already exists → BLUE
    sendToServer(finger.fingerID);
  }
  else if (p == FINGERPRINT_NOTFOUND) {
    Serial.println("⚠️ No match found → NEW fingerprint detected!");
    Serial.println("🔄 Starting automatic enrollment...");
    enrollNewFinger();
  }
  else {
    Serial.print("❌ Search error code: ");
    Serial.println(p);
    flashLED(LED_RED);  // ❌ Unknown error → RED
  }
}

// ================== AUTO ENROLL ==================
void enrollNewFinger() {
  finger.getTemplateCount();
  uint16_t newId = finger.templateCount + 1;
  Serial.print("📝 Assigning new ID: #");
  Serial.println(newId);

  Serial.println("✅ 1st scan captured.");
  Serial.println("✋ Remove finger...");
  delay(3500);

  Serial.println("👆 Place the SAME finger again...");
  clearFingerprintBuffer();

  uint8_t p;
  while ((p = finger.getImage()) != FINGERPRINT_OK) {
    delay(200);
    Serial.print(".");
  }
  Serial.println("\n✅ 2nd scan captured.");

  p = finger.image2Tz(2);
  if (p != FINGERPRINT_OK) {
    Serial.println("❌ 2nd scan conversion failed. Try again.");
    flashLED(LED_RED);  // ❌ Failed → RED
    return;
  }

  if (finger.createModel() != FINGERPRINT_OK) {
    Serial.println("❌ Scans do NOT match! Try again.");
    flashLED(LED_RED);  // ❌ Mismatch → RED
    return;
  }

  if (finger.storeModel(newId) != FINGERPRINT_OK) {
    Serial.println("❌ Failed to store fingerprint.");
    flashLED(LED_RED);  // ❌ Store failed → RED
    return;
  }

  Serial.print("✅ Successfully enrolled! New ID: #");
  Serial.println(newId);
  finger.getTemplateCount();
  Serial.print("📊 Total templates: ");
  Serial.println(finger.templateCount);
  flashLED(LED_GREEN);  // ✅ Newly registered → GREEN
  sendToServer(newId);
}

// ================== SEND TO SERVER ==================
void sendToServer(int fingerprintId) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi not connected!");
    return;
  }

  Serial.println("📤 Sending to server...");

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");

  String payload = "{\"fingerprintId\":" + String(fingerprintId) +
                   ",\"quality\":100,\"matchScore\":95}";

  Serial.print("Payload: ");
  Serial.println(payload);

  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.print("✅ HTTP Response: ");
    Serial.println(httpCode);
    Serial.println("Server reply: " + response);
  } else {
    Serial.print("❌ HTTP error: ");
    Serial.println(httpCode);
  }

  http.end();
}
192.168.100.78
