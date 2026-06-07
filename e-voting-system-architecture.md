

#include <WiFi.h>
#include <HTTPClient.h>
#include <Adafruit_Fingerprint.h>

// ================== CONFIG ==================
const char* ssid = "Infinix ZERO 30 5G";
const char* password = "11243555";
const char* serverBase = "http://10.83.108.175:3000";
const char* registerUrl = "http://10.83.108.175:3000/api/hardware/scan";
const char* verifyVoteUrl = "http://10.83.108.175:3000/api/hardware/verify-vote";

// Fingerprint sensor (UART2)
HardwareSerial fingerSerial(2);
const int RX_PIN = 16;
const int TX_PIN = 17;

Adafruit_Fingerprint finger(&fingerSerial);

// ================== LED PINS ==================
const int LED_GREEN = 12;  // Newly registered / vote saved
const int LED_RED   = 13;  // Incorrect / error
const int LED_BLUE  = 14;  // Fingerprint exists / match found
const int MODE_BTN  = 27;  // Toggle between Register and Vote Verify

// ================== MODES ==================
enum DeviceMode { MODE_REGISTER, MODE_VOTE_VERIFY };
DeviceMode currentMode = MODE_REGISTER;

// Forward declarations (Arduino requires these before use)
void connectWiFi();
void printModeHelp();
void flashLED(int pin, int duration = 2000);
void clearFingerprintBuffer();
void processRegisterFinger();
void processVoteVerifyFinger();
void enrollNewFinger();
void sendToServer(const char* url, int fingerprintId, bool isVoteVerify = false);

// ================== SETUP ==================
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\n=== ESP32 Fingerprint Voting System ===");

  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED,   OUTPUT);
  pinMode(LED_BLUE,  OUTPUT);
  pinMode(MODE_BTN,  INPUT_PULLUP);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_RED,   LOW);
  digitalWrite(LED_BLUE,  LOW);

  fingerSerial.begin(57600, SERIAL_8N1, RX_PIN, TX_PIN);
  finger.begin(57600);

  if (finger.verifyPassword()) {
    Serial.println("Fingerprint sensor found!");
    finger.getTemplateCount();
    Serial.print("Templates stored: ");
    Serial.println(finger.templateCount);
    finger.setSecurityLevel(5);
  } else {
    Serial.println("Fingerprint sensor NOT found! Check wiring (5V needed).");
    while (1) delay(1000);
  }

  connectWiFi();
  printModeHelp();
  Serial.println("\nWaiting for finger...");
}

// ================== LED HELPER ==================
void flashLED(int pin, int duration) {
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_RED,   LOW);
  digitalWrite(LED_BLUE,  LOW);
  digitalWrite(pin, HIGH);
  delay(duration);
  digitalWrite(pin, LOW);
}

void printModeHelp() {
  Serial.println("\n--- CURRENT MODE ---");
  if (currentMode == MODE_REGISTER) {
    Serial.println("REGISTER: Scan to enroll new voters or log existing ones");
    Serial.println("  -> POST /api/hardware/scan");
    flashLED(LED_GREEN, 300);
  } else {
    Serial.println("VOTE VERIFY: Scan after voting to confirm ballot");
    Serial.println("  -> POST /api/hardware/verify-vote");
    flashLED(LED_BLUE, 300);
  }
  Serial.println("Press GPIO 27 button to switch mode\n");
}

// ================== LOOP ==================
void loop() {
  // Toggle mode on button press
  if (digitalRead(MODE_BTN) == LOW) {
    delay(200);
    if (digitalRead(MODE_BTN) == LOW) {
      currentMode = (currentMode == MODE_REGISTER) ? MODE_VOTE_VERIFY : MODE_REGISTER;
      printModeHelp();
      while (digitalRead(MODE_BTN) == LOW) delay(50);
    }
  }

  uint8_t p = finger.getImage();

  if (p == FINGERPRINT_OK) {
    Serial.println("\nFinger detected! Processing...");
    if (currentMode == MODE_REGISTER) {
      processRegisterFinger();
    } else {
      processVoteVerifyFinger();
    }
    delay(2000);
    clearFingerprintBuffer();
    Serial.println("\nWaiting for finger...");
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
    Serial.println("\nWiFi connected!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi connection failed!");
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

// ================== REGISTER MODE ==================
void processRegisterFinger() {
  uint8_t p = finger.image2Tz(1);
  if (p != FINGERPRINT_OK) {
    Serial.println("Image conversion failed.");
    flashLED(LED_RED);
    return;
  }

  Serial.println("Searching database...");
  p = finger.fingerSearch();

  if (p == FINGERPRINT_OK) {
    Serial.print("MATCH FOUND -> ID #");
    Serial.println(finger.fingerID);
    flashLED(LED_BLUE);
    sendToServer(registerUrl, finger.fingerID);
  }
  else if (p == FINGERPRINT_NOTFOUND) {
    Serial.println("No match -> Starting enrollment...");
    enrollNewFinger();
  }
  else {
    Serial.print("Search error: ");
    Serial.println(p);
    flashLED(LED_RED);
  }
}

// ================== VOTE VERIFY MODE ==================
void processVoteVerifyFinger() {
  uint8_t p = finger.image2Tz(1);
  if (p != FINGERPRINT_OK) {
    Serial.println("Image conversion failed.");
    flashLED(LED_RED);
    return;
  }

  Serial.println("Verifying voter fingerprint...");
  p = finger.fingerSearch();

  if (p == FINGERPRINT_OK) {
    Serial.print("MATCH FOUND -> ID #");
    Serial.println(finger.fingerID);
    sendToServer(verifyVoteUrl, finger.fingerID, true);
  }
  else if (p == FINGERPRINT_NOTFOUND) {
    Serial.println("Fingerprint NOT registered!");
    flashLED(LED_RED);
  }
  else {
    Serial.print("Search error: ");
    Serial.println(p);
    flashLED(LED_RED);
  }
}

// ================== AUTO ENROLL ==================
void enrollNewFinger() {
  finger.getTemplateCount();
  uint16_t newId = finger.templateCount + 1;
  Serial.print("Assigning new ID: #");
  Serial.println(newId);

  Serial.println("1st scan captured. Remove finger...");
  delay(3500);

  Serial.println("Place the SAME finger again...");
  clearFingerprintBuffer();

  uint8_t p;
  while ((p = finger.getImage()) != FINGERPRINT_OK) {
    delay(200);
    Serial.print(".");
  }
  Serial.println("\n2nd scan captured.");

  p = finger.image2Tz(2);
  if (p != FINGERPRINT_OK) {
    Serial.println("2nd scan conversion failed.");
    flashLED(LED_RED);
    return;
  }

  if (finger.createModel() != FINGERPRINT_OK) {
    Serial.println("Scans do NOT match!");
    flashLED(LED_RED);
    return;
  }

  if (finger.storeModel(newId) != FINGERPRINT_OK) {
    Serial.println("Failed to store fingerprint.");
    flashLED(LED_RED);
    return;
  }

  Serial.print("Successfully enrolled! ID: #");
  Serial.println(newId);
  flashLED(LED_GREEN);
  sendToServer(registerUrl, newId);
}

// ================== SEND TO SERVER ==================
void sendToServer(const char* url, int fingerprintId, bool isVoteVerify) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected!");
    flashLED(LED_RED);
    return;
  }

  Serial.println("Sending to server...");

  HTTPClient http;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);

  String payload = "{\"fingerprintId\":" + String(fingerprintId) +
                   ",\"quality\":100,\"matchScore\":95}";

  Serial.print("URL: ");
  Serial.println(url);
  Serial.print("Payload: ");
  Serial.println(payload);

  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.print("HTTP Response: ");
    Serial.println(httpCode);
    Serial.println("Server: " + response);

    if (isVoteVerify) {
      if (response.indexOf("\"verified\":true") >= 0 || response.indexOf("\"success\":true") >= 0) {
        Serial.println("VOTE CONFIRMED!");
        flashLED(LED_GREEN, 3000);
      } else {
        Serial.println("Vote verification failed.");
        flashLED(LED_RED);
      }
    }
  } else {
    Serial.print("HTTP error: ");
    Serial.println(httpCode);
    flashLED(LED_RED);
  }

  http.end();
}
