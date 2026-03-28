const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// --- CREDENCIAIS ---
const telegramToken = '8602651456:AAHBB8g0lvXPEZjcUN4afQxkTGhzRDUc8UE';
const GROQ_KEY = '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';

// COOKIES ATUALIZADOS (28/03/2026 - 18:30)
const COOKIES = 'pac_ocean=4829DE6B; HighwindFRPG=K2Frkr5rtP9NUJqkQJS3lw%3D%3D%3Cstrip%3E%24argon2id%24v%3D19%24m%3D7168%2Ct%3D4%2Cp%3D1%24WmhsbEc3Y3hXTk05NUJtMw%24Si%2FlxsAxAZF6elMB50x8GXJSQKWd12ZpZ8oUstU2Vd8; farmrpg_token=h1jh6v8vd0qdvnfp4k6qco7dpgvp6un0dk92cb14; last_tab_profile=tab1;';

const bot = new TelegramBot(telegramToken, { polling: true });

const headersV34 = {
    'Cookie': COOKIES,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': 'https://farmrpg.com/index.php',
    'Origin': 'https://farmrpg.com',
    'X-Requested-With': 'XMLHttpRequest',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin'
};

// --- INTELIGÊNCIA LLAMA 3 ---
async function decidirIA(prata, stamina) {
    try {
        const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama3-8b-8192",
            messages: [
                { role: "system", content: "Você é um bot de Farm RPG. Analise o status e responda APENAS: COLHER, PLANTAR ou PESCAR." },
                { role: "user", content: `Status: Prata ${prata}, Stamina ${stamina}` }
            ],
            temperature: 0.2
        }, { headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' } });
        return res.data.choices[0].message.content.toUpperCase();
    } catch (e) { return "COLHER"; }
}

async function acao(go, nome) {
    try {
        await new Promise(r => setTimeout(r, 2500 + Math.random() * 2500));
        await axios.post(`https://farmrpg.com/worker.php?go=${go}`, {}, { headers: headersV34 });
        console.log(`[OK] ${nome}`);
    } catch (e) { console.log(`Erro em ${nome}`); }
}

async function loop(chatId) {
    bot.sendMessage(chatId, " farmrpg_token sincronizado! Verificando conta real...");

    while (true) {
        try {
            // Acessando a página para validar o login
            const res = await axios.get('https://farmrpg.com/index.php', { headers: headersV34 });
            const html = res.data;

            // Se não encontrar o indicador de stamina, o login falhou
            if (!html.includes('id=\'staminatxt\'') && !html.includes('id="staminatxt"')) {
                bot.sendMessage(chatId, "❌ *SESSÃO NEGADA:* O servidor não aceitou os cookies.\n\n*Dica:* Abra o jogo no PC, mude de aba (ex: ir para a Farm) e pegue o cookie de novo sem deslogar.");
                break;
            }

            // Captura de Prata e Stamina reais
            const prata = html.match(/class='silver'>(.*?)<\/span>/)?.[1] || "0";
            const stamina = html.match(/id='staminatxt'>(.*?)<\/span>/)?.[1] || "0";

            const decisao = await decidirIA(prata, stamina);
            bot.sendMessage(chatId, `📊 *STATUS ATUAL:*\n💰 Prata: ${prata}\n⚡ Stamina: ${stamina}\n🧠 IA Decidiu: ${decisao}`);

            if (decisao.includes("COLHER")) await acao('harvestall', 'Colheita');
            if (decisao.includes("PLANTAR")) await acao('plantall&id=8', 'Plantio');
            if (decisao.includes("PESCAR") && parseInt(stamina) > 10) {
                await acao('fish&id=1', 'Pesca');
                await acao('sellallfish', 'Venda');
            }
            await acao('collectallpets', 'Pets');

        } catch (e) {
            console.error("Erro no ciclo:", e.message);
        }
        // Delay de 4 minutos (240.000ms) para segurança total
        await new Promise(r => setTimeout(r, 240000));
    }
}

bot.onText(/\/start/, (msg) => loop(msg.chat.id));
console.log("V34 Online - Monitorando Conta Real.");
