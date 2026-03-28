const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// --- CREDENCIAIS ---
const telegramToken = '8602651456:AAHBB8g0lvXPEZjcUN4afQxkTGhzRDUc8UE';
const GROQ_KEY = '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';

// COPIE E COLE SUA STRING DE COOKIE INTEIRA AQUI DENTRO DAS ASPAS
// DICA: No Cookie-Editor, use a opção "Export" -> "Header String" se tiver, ou monte igual abaixo:
const COOKIE_BRUTO = 'pac_ocean=4829DE6B; HighwindFRPG=K2Frkr5rtP9NUJqkQJS3lw%3D%3D%3Cstrip%3E%24argon2id%24v%3D19%24m%3D7168%2Ct%3D4%2Cp%3D1%24WmhsbEc3Y3hXTk05NUJtMw%24Si%2FlxsAxAZF6elMB50x8GXJSQKWd12ZpZ8oUstU2Vd8; farmrpg_token=h1jh6v8vd0qdvnfp4k6qco7dpgvp6un0dk92cb14; last_tab_profile=tab1;';

const bot = new TelegramBot(telegramToken, { polling: true });

const headersBase = {
    'Cookie': COOKIE_BRUTO,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Referer': 'https://farmrpg.com/index.php',
    'Origin': 'https://farmrpg.com',
    'X-Requested-With': 'XMLHttpRequest'
};

// --- IA LLAMA 3 ---
async function decidirIA(prata, stamina) {
    try {
        const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama3-8b-8192",
            messages: [{ role: "system", content: "Responda apenas: COLHER, PLANTAR ou PESCAR." },
                       { role: "user", content: `Status: ${prata} prata, ${stamina} stamina.` }],
            temperature: 0.2
        }, { headers: { 'Authorization': `Bearer ${GROQ_KEY}` } });
        return res.data.choices[0].message.content.toUpperCase();
    } catch (e) { return "COLHER"; }
}

async function acao(go, nome) {
    try {
        await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
        await axios.post(`https://farmrpg.com/worker.php?go=${go}`, {}, { headers: headersBase });
        console.log(`[OK] ${nome}`);
    } catch (e) { console.log(`Erro em ${nome}`); }
}

async function loop(chatId) {
    bot.sendMessage(chatId, "🛠️ *V31:* Tentando validar sessão real...");

    while (true) {
        try {
            // Acessando a página principal para verificar se o cookie funcionou
            const res = await axios.get('https://farmrpg.com/index.php', { headers: headersBase });
            const html = res.data;

            // Se não encontrar o texto 'silver' ou 'staminatxt', o login falhou
            if (!html.includes('silver') && !html.includes('staminatxt')) {
                bot.sendMessage(chatId, "❌ *SESSÃO INVÁLIDA:* O servidor deslogou o bot. Atualize o `farmrpg_token` no script.");
                break; 
            }

            const prata = html.match(/class='silver'>(.*?)<\/span>/)?.[1] || "???";
            const stamina = html.match(/id='staminatxt'>(.*?)<\/span>/)?.[1] || "0";

            const acaoIA = await decidirIA(prata, stamina);
            bot.sendMessage(chatId, `✅ *Logado!*\n💰 Prata: ${prata}\n⚡ Stamina: ${stamina}\n🧠 IA: ${acaoIA}`);

            if (acaoIA.includes("COLHER")) await acao('harvestall', 'Colheita');
            if (acaoIA.includes("PLANTAR")) await acao('plantall&id=8', 'Plantio');
            if (acaoIA.includes("PESCAR") && parseInt(stamina) > 5) {
                await acao('fish&id=1', 'Pesca');
                await acao('sellallfish', 'Venda');
            }
            await acao('collectallpets', 'Pets');

        } catch (e) {
            console.error("Erro no loop:", e.message);
        }
        await new Promise(r => setTimeout(r, 180000)); // 3 minutos
    }
}

bot.onText(/\/start/, (msg) => loop(msg.chat.id));
console.log("V31 Online.");
