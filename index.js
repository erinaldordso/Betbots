const crypto = require('crypto');
if (!global.crypto) global.crypto = crypto;
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const http = require('http');
const CONFIG = {
  waPhone: "5521982931764",
  idGrupoWhats: "120363426472430463@g.us",
  botTelegramAlvo: "betbotsbot02_bot",
  tgId: 39001979,
  tgHash: "0f3413d54b53889450752b735d5221ba",
  tgSession: "1AQAOMTQ5LjE1NC4xNzUuNTUBuwlVXFIOFujrvIRSQm6+qO/laUfru5LFHEmbx/O6z99qNjKpqdu71VocaUIQewykJjNMob0boWJ7z5rUxSXDVSmdDgTiCBoay80hf4XSkM33TIqOPLWOXvyENiomBt8vGbekM/IUzZhmRLuSjfDenRQUu+eOtLt1j+kN2E3IHBJUjPY3whabSuCFUnrEbJmHHRCNeCqNY14Lb6efF/+LdFcdxgVjmItP6+1taPQHEg/36xf/FwlojiiR+zosMyA09NMCA3v3iVbOB9uM0qJcMxz8fD7QAhbvEsrOMMGZxNyyOUFZBP6LPjwIMBM1eVBXm/DxNB06tUs8h1eHXnDLZBo="
};
// Servidor exigido pela Railway
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.end('Bot Online');
}).listen(PORT);

async function iniciar() {
  console.log("📂 Carregando credenciais da Railway...");
  const { state, saveCreds } = await useMultiFileAuthState('sessao_permanente');
  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: Browsers.macOS('Desktop'),
    connectTimeoutMs: 60000
  });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', (u) => {
    const { connection, lastDisconnect } = u;
    if (connection === 'open') {
      console.log("✅ WHATSAPP CONECTADO COM SUCESSO!");
      conectarTelegram(sock);
    }
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code !== DisconnectReason.loggedOut) {
        console.log("🔄 Conexão perdida, tentando voltar...");
        setTimeout(iniciar, 5000);
      }
    }
  });
  if (!sock.authState.creds.registered) {
    console.log("📡 Gerando código de pareamento...");
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(CONFIG.waPhone);
        console.log(`\n************************************`);
        console.log(`🔥 DIGITE NO SEU WHATSAPP: ${code}`);
        console.log(`************************************\n`);
      } catch (e) {
        console.log("Erro ao gerar código. Verifique sua conexão.");
      }
    }, 10000);
  }
}

async function conectarTelegram(sock) {
  const client = new TelegramClient(new StringSession(CONFIG.tgSession), CONFIG.tgId, CONFIG.tgHash, {});
  await client.connect();
  console.log("📡 Monitorando Telegram...");
  client.addEventHandler(async (event) => {
    const message = event.message.message;
    if (message && (message.toLowerCase().includes("betbots") || (await event.message.getSender())?.username === CONFIG.botTelegramAlvo)) {
      const texto = `⚠️ *VIP 0.5 GOL NALDO.TIPS* ⚠️\n\n${message}\n\n💰 *[APOSTAR](https://referme.to/erinaldorodriguesdeo-11)*\n📸 *[@erinaldo.2020](https://instagram.com/erinaldo.2020)*`;
      try {
        await sock.sendMessage(CONFIG.idGrupoWhats, { text: texto });
        console.log("🚀 SINAL REPASSADO!");
      } catch (e) {
        console.log("Erro no envio do WhatsApp.");
      }
    }
  }, new NewMessage({}));
}

iniciar();