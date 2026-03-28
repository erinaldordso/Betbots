import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import TelegramBot from "node-telegram-bot-api";

// --- CONFIGURAÇÕES ---
const telegramToken = process.env.TELEGRAM_TOKEN || '8602651456:AAHBB8g0lvXPEZjcUN4afQxkTGhzRDUc8UE';
const groqKey = process.env.GROQ_API_KEY || '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';

// Seu Cookie Atual (Sempre mantenha atualizado aqui)
let currentCookies = 'pac_ocean=4829DE6B; HighwindFRPG=K2Frkr5rtP9NUJqkQJS3lw%3D%3D%3Cstrip%3E%24argon2id%24v%3D19%24m%3D7168%2Ct%3D4%2Cp%3D1%24WmhsbEc3Y3hXTk05NUJtMw%24Si%2FlxsAxAZF6elMB50x8GXJSQKWd12ZpZ8oUstU2Vd8; farmrpg_token=h1jh6v8vd0qdvnfp4k6qco7dpgvp6un0dk92cb14';

const bot = new TelegramBot(telegramToken, { polling: true });

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Cookie': currentCookies,
    'Referer': 'https://farmrpg.com/index.php',
    'Origin': 'https://farmrpg.com',
    'X-Requested-With': 'XMLHttpRequest'
};

// --- FUNÇÃO PARA PEGAR STATUS REAL ---
async function parseGameStatus() {
    try {
        const res = await axios.get('https://farmrpg.com/index.php', { headers });
        const $ = cheerio.load(res.data);
        
        const prata = $(".silver").first().text().trim() || "0";
        const stamina = $("#staminatxt").text().trim() || "0";
        
        if (!res.data.includes('staminatxt')) return null;
        return { prata, stamina };
    } catch (e) { return null; }
}

// --- INTELIGÊNCIA IA ---
async function inteligenciaIA(status: any) {
    try {
        const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama-3.1-8b-instant",
            messages: [{ 
                role: "system", 
                content: "Você é um bot estrategista de Farm RPG. Responda em JSON: {\"comando\": \"harvestall\", \"motivo\": \"explicação\"}. Comandos: harvestall, plantall, fish, sellallfish." 
            }, { role: "user", content: JSON.stringify(status) }],
            response_format: { type: "json_object" }
        }, { headers: { 'Authorization': `Bearer ${groqKey}` } });
        return JSON.parse(res.data.choices[0].message.content);
    } catch (e) { return { comando: "wait" }; }
}

// --- EXECUÇÃO DE AÇÕES ---
async function realizarAcao(go: string) {
    try {
        await new Promise(r => setTimeout(r, 3000)); // Delay humano
        await axios.post(`https://farmrpg.com/worker.php?go=${go}`, {}, { headers });
    } catch (e) { console.log("Erro na ação " + go); }
}

// --- LOOP DO BOT ---
async function loopBot(chatId: number) {
    bot.sendMessage(chatId, "🚀 Bot V36 Iniciado com Express + IA!");
    while (true) {
        const status = await parseGameStatus();
        if (!status) {
            bot.sendMessage(chatId, "❌ Sessão Inválida! Atualize os Cookies.");
            break;
        }

        const decisao = await inteligenciaIA(status);
        bot.sendMessage(chatId, `🤖 IA decidiu: ${decisao.comando}\n💰 Prata: ${status.prata} | ⚡ Stamina: ${status.stamina}`);

        if (decisao.comando === "harvestall") await realizarAcao('harvestall');
        if (decisao.comando === "plantall") await realizarAcao('plantall&id=8');
        if (decisao.comando === "fish") {
            await realizarAcao('fish&id=1');
            await realizarAcao('sellallfish');
        }

        await new Promise(r => setTimeout(r, 180000)); // 3 minutos
    }
}

bot.onText(/\/start/, (msg) => loopBot(msg.chat.id));

// --- SERVIDOR EXPRESS (Obrigatório para o Railway não desligar) ---
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot de Farm RPG está Online!'));
app.listen(port, "0.0.0.0", () => console.log(`Servidor rodando na porta ${port}`));
    
