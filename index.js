const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const telegramToken = '8602651456:AAHBB8g0lvXPEZjcUN4afQxkTGhzRDUc8UE';
const GROQ_KEY = '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';

// --- COPIE O COOKIE NOVO AQUI (O QUE VOCÊ GEROU APÓS PLANTAR ALGO NO PC) ---
const COOKIES = 'pac_ocean=4829DE6B; HighwindFRPG=K2Frkr5rtP9NUJqkQJS3lw%3D%3D%3Cstrip%3E%24argon2id%24v%3D19%24m%3D7168%2Ct%3D4%2Cp%3D1%24WmhsbEc3Y3hXTk05NUJtMw%24Si%2FlxsAxAZF6elMB50x8GXJSQKWd12ZpZ8oUstU2Vd8; farmrpg_token=h1jh6v8vd0qdvnfp4k6qco7dpgvp6un0dk92cb14; last_tab_profile=tab1;';

const bot = new TelegramBot(telegramToken, { polling: true });

// HEADERS DE NAVEGADOR COM PERSISTÊNCIA
const headersV35 = {
    'authority': 'farmrpg.com',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'cookie': COOKIES,
    'referer': 'https://farmrpg.com/index.php',
    'sec-ch-ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'same-origin',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'x-requested-with': 'XMLHttpRequest'
};

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
        await new Promise(r => setTimeout(r, 4000 + Math.random() * 2000));
        await axios.post(`https://farmrpg.com/worker.php?go=${go}`, {}, { headers: headersV35 });
        console.log(`[OK] ${nome}`);
    } catch (e) { console.log(`Erro em ${nome}`); }
}

async function loop(chatId) {
    bot.sendMessage(chatId, "🛡️ *V35:* Testando validade da sessão real...");

    while (true) {
        try {
            // Requisição inicial para "acordar" a sessão
            const res = await axios.get('https://farmrpg.com/index.php', { headers: headersV35 });
            const html = res.data;

            // Se o login falhar, o bot avisa
            if (!html.includes('id=\'staminatxt\'') && !html.includes('id="staminatxt"')) {
                bot.sendMessage(chatId, "❌ *SESSÃO NEGADA:* O servidor bloqueou o bot.\n\n*AÇÃO:* Tente trocar o nome do projeto no Railway para mudar o IP.");
                break; 
            }

            const prata = html.match(/class='silver'>(.*?)<\/span>/)?.[1] || "???";
            const stamina = html.match(/id='staminatxt'>(.*?)<\/span>/)?.[1] || "0";

            const acaoIA = await decidirIA(prata, stamina);
            bot.sendMessage(chatId, `✅ *LOGADO!*\n💰 Prata: ${prata}\n⚡ Stamina: ${stamina}\n🧠 IA Decidiu: ${acaoIA}`);

            if (acaoIA.includes("COLHER")) await acao('harvestall', 'Colheita');
            if (acaoIA.includes("PLANTAR")) await acao('plantall&id=8', 'Plantio');
            if (acaoIA.includes("PESCAR") && parseInt(stamina) > 10) {
                await acao('fish&id=1', 'Pesca');
                await acao('sellallfish', 'Venda');
            }
            await acao('collectallpets', 'Pets');

        } catch (e) {
            console.error("Erro no ciclo:", e.message);
        }
        // Espera 5 minutos para o servidor não suspeitar do IP do Railway
        await new Promise(r => setTimeout(r, 300000)); 
    }
}

bot.onText(/\/start/, (msg) => loop(msg.chat.id));
console.log("V35 Online.");
