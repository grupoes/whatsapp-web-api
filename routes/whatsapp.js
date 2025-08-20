// routes/whatsapp.js
const express = require("express");
const router = express.Router();
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

require("dotenv").config();

const CLIENT = process.env.CLIENT;

let client; // Declarar la variable client fuera del if-els

// Inicializar el cliente de WhatsApp
if (CLIENT === "development") {
  client = new Client({
    puppeteer: {
      headless: true,
    },
  });
} else {
  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      executablePath: "/usr/bin/google-chrome-stable",
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--disable-extensions",
        "--disable-plugins",
        "--disable-default-apps",
        "--disable-sync",
        "--metrics-recording-only",
        "--no-default-browser-check",
        "--mute-audio",
        "--disable-background-networking",
      ],
    },
  });
}

let receivedMessages = []; // Arreglo para almacenar los mensajes recibidos

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("Client is ready!");
});

client.on("message_create", (message) => {
  console.log("Mensaje recibido:", message.body);

  // Guardar los mensajes entrantes
  receivedMessages.push({
    id: message.id._serialized,
    from: message.from,
    body: message.body,
    timestamp: message.timestamp,
    content: message,
  });

  // Ejemplo de respuesta a un comando específico
  if (message.body === "!ping") {
    message.reply("pong");
  }
});

client.initialize();

// Endpoint para enviar un mensaje
router.post("/send", async (req, res) => {
  const { numeroDestino, mensaje } = req.body;

  if (!numeroDestino || !mensaje) {
    return res
      .status(400)
      .json({ error: "Número de destino y mensaje son requeridos" });
  }

  try {
    const chatId = `${numeroDestino}@c.us`;
    const response = await client.sendMessage(chatId, mensaje);
    res.json({ message: "Mensaje enviado", response });
  } catch (error) {
    console.error("Error al enviar mensaje:", error);
    res.status(500).json({ error: "Error al enviar mensaje" });
  }
});

// Endpoint para obtener los mensajes recibidos
router.get("/messages", (req, res) => {
  res.json({ messages: receivedMessages });
});

module.exports = router;
