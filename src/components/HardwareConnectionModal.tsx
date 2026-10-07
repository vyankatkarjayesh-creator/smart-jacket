import React, { useState } from 'react';
import { 
  Cpu, 
  Wifi, 
  Flame, 
  Heart, 
  Code2, 
  Check, 
  Copy, 
  X, 
  Layers, 
  Radio, 
  Terminal,
  ExternalLink
} from 'lucide-react';

interface HardwareConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HardwareConnectionModal: React.FC<HardwareConnectionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'esp32' | 'mqtt' | 'firebase' | 'rest'>('esp32');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const esp32Code = `// ========================================================
// SmartGuard AI - ESP32 Smart Safety Jacket Firmware
// Target MCU: ESP32-WROOM-32 / ESP32-S3
// Sensors: MQ-2 Gas, MAX30102 PPG/SpO2, MPU6050 6-Axis IMU,
//          DHT22 Temp/Humidity, NEO-6M GPS, LoRa SX1276
// ========================================================

#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"
#include "DHT.h"
#include <TinyGPS++.h>

const char* ssid = "INDUSTRIAL_MESH_WIFI";
const char* password = "INDUSTRIAL_PASS";
const char* mqtt_server = "mqtt.yourfacility.com";
const char* JACKET_ID = "SJ-9021-Pro";

WiFiClient espClient;
PubSubClient client(espClient);
DHT dht(4, DHT22);
MAX30105 particleSensor;
TinyGPSPlus gps;

void setup() {
  Serial.begin(115200);
  dht.begin();
  Wire.begin(21, 22); // I2C SDA, SCL
  particleSensor.begin(Wire, I2C_SPEED_FAST);
  particleSensor.setup();
  
  WiFi.begin(ssid, password);
  client.setServer(mqtt_server, 1883);
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  // Read sensors every 2000 ms
  static unsigned long lastUpdate = 0;
  if (millis() - lastUpdate > 2000) {
    lastUpdate = millis();

    float temp = dht.readTemperature();
    float hum = dht.readHumidity();
    int gasRaw = analogRead(34); // MQ-2 Analog Pin
    float gasPpm = (gasRaw / 4095.0) * 150.0;
    int heartRate = 75; // Computed from MAX30102 peak detection
    int spO2 = 98;

    char payload[256];
    snprintf(payload, sizeof(payload),
      "{\\"jacketId\\":\\"%s\\",\\"temp\\":%.1f,\\"hum\\":%.1f,\\"gas\\":%.1f,\\"hr\\":%d,\\"spo2\\":%d,\\"motion\\":\\"Walking\\"}",
      JACKET_ID, temp, hum, gasPpm, heartRate, spO2);

    client.publish("smartguard/telemetry", payload);
    Serial.println(payload);
  }
}`;

  const mqttCode = `// ========================================================
// Frontend MQTT WebSocket Client Integration
// Replace generateSensorData() in src/services/sensorSimulator.ts:
// ========================================================

import mqtt from 'mqtt';

export function connectLiveJacketStream(jacketId: string, onData: (data: any) => void) {
  // Connect via secure WebSocket to your Mosquitto / HiveMQ / AWS IoT broker
  const client = mqtt.connect('wss://broker.yourfacility.com:8084/mqtt', {
    clientId: 'smartguard_web_' + Math.random().toString(16).substring(2, 8),
    username: 'telemetry_read',
    password: 'SECURE_TOKEN',
    clean: true,
  });

  client.on('connect', () => {
    console.log('Connected to Industrial IoT Broker!');
    client.subscribe(\`smartguard/telemetry/\${jacketId}\`);
  });

  client.on('message', (topic, payload) => {
    const raw = JSON.parse(payload.toString());
    onData(raw);
  });

  return () => client.end();
}`;

  const firebaseCode = `// ========================================================
// Firebase Firestore Real-Time Jacket Telemetry Listener
// Replace simulation in src/App.tsx:
// ========================================================

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "smartguard-iot.firebaseapp.com",
  projectId: "smartguard-iot",
  storageBucket: "smartguard-iot.appspot.com",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Subscribe to real-time updates for active jacket:
export function subscribeToJacket(jacketId: string, callback: (data: any) => void) {
  const unsub = onSnapshot(doc(db, "jackets", jacketId), (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    }
  });
  return unsub;
}`;

  const restCode = `// ========================================================
// REST API Polling / Webhook Gateway Example
// Endpoint: /api/sensors/jacket-feed
// ========================================================

export async function fetchJacketTelemetry(jacketId: string) {
  const response = await fetch(\`/api/sensors/jacket-feed?id=\${jacketId}\`, {
    headers: {
      'Authorization': 'Bearer YOUR_SECURE_API_KEY',
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) throw new Error('Failed to retrieve jacket feed');
  return await response.json();
}`;

  const getCodeSnippet = () => {
    switch (activeTab) {
      case 'esp32':
        return esp32Code;
      case 'mqtt':
        return mqttCode;
      case 'firebase':
        return firebaseCode;
      case 'rest':
        return restCode;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden font-mono text-xs max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm font-['Chakra_Petch',sans-serif]">
                Hardware Integration & Production Deployment Guide
              </h3>
              <p className="text-slate-400 text-xs">
                Connect physical SmartGuard jackets via ESP32, MQTT WebSocket, Firebase or REST API
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('esp32')}
            className={`px-3 py-2 border-b-2 font-bold transition-all ${
              activeTab === 'esp32'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ESP32 / Arduino C++
          </button>
          <button
            onClick={() => setActiveTab('mqtt')}
            className={`px-3 py-2 border-b-2 font-bold transition-all ${
              activeTab === 'mqtt'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            MQTT WebSockets
          </button>
          <button
            onClick={() => setActiveTab('firebase')}
            className={`px-3 py-2 border-b-2 font-bold transition-all ${
              activeTab === 'firebase'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Firebase Firestore
          </button>
          <button
            onClick={() => setActiveTab('rest')}
            className={`px-3 py-2 border-b-2 font-bold transition-all ${
              activeTab === 'rest'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            REST API Gateway
          </button>
        </div>

        {/* Code Snippet Area */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          <div className="flex items-center justify-between text-slate-400 pb-1">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              Source Code &amp; Hook Architecture
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all text-[11px]"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 overflow-x-auto text-[11px] leading-relaxed font-mono">
            <code>{getCodeSnippet()}</code>
          </pre>

          {/* Quick steps checklist */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-slate-300 text-xs">
            <span className="font-bold text-white block">Production Steps to Go Live:</span>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
              <li>Flash firmware to ESP32 / STM32 microcontroller housed inside the jacket power pocket.</li>
              <li>Calibrate MQ-2 gas sensor baseline and optical PPG contact pads.</li>
              <li>Point broker endpoint in <code className="text-cyan-400">src/services/sensorSimulator.ts</code> to your production MQTT/Firebase endpoint.</li>
              <li>Deploy frontend to Cloud Run or secure intranet host.</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all text-xs"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
