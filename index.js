require('dotenv').config(); // Cargar variables de entorno desde .env
const mqtt = require('mqtt');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

// Configuración MQTT
const options = {
  host: process.env.MQTT_HOST,
  port: process.env.MQTT_PORT,
  protocol: process.env.MQTT_PROTOCOL,
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASSWORD
};

const client = mqtt.connect(options);

// Configuración del servidor Express
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Sirve archivos estáticos desde la carpeta 'public'
app.use(express.static('public'));

// Almacena los mensajes recibidos
let lastMessage = '';

client.on('connect', () => {
  console.log('Connected to MQTT broker');
  client.subscribe('your/topic');
});

client.on('message', (topic, message) => {
  console.log(`Received message on ${topic}: ${message.toString()}`);
  lastMessage = message.toString();

  // Envía el mensaje a todos los clientes conectados por WebSocket
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(lastMessage);
    }
  });
});

// Servidor WebSocket
wss.on('connection', ws => {
  console.log('WebSocket client connected');
  ws.send(lastMessage);  // Envía el último mensaje recibido al nuevo cliente
});

// Inicia el servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
