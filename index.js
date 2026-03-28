const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// --- SISTEMA DE TOKENS E COOKIES ATUALIZADOS ---
const telegramToken = '8602651456:AAHBB8g0lvXPEZjcUN4afQxkTGhzRDUc8UE';
const GROQ_KEY = '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';

const COOKIES = 'pac_ocean=3E830B6C; HighwindFRPG=K2Frkr5rtP9NUJqkQJS3lw%3D%3D%3Cstrip%3E%24argon2id%24v%3D19%24m%3D7168%2Ct%3D4%2Cp%3D1%24WmhsbEc3Y3hXTk05NUJtMw%24Si%2FlxsAxAZF6elMB50x8GXJSQKWd12ZpZ8oUstU2Vd8; farmrpg_token=iu9485rc4fjepnk1g4bsgu319n1p0lbtqtcror2c; last_tab_profile=tab1;';

const bot = new TelegramBot(telegramToken, { polling: true });

const headers = {
    'Cookie': COOKIES,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
    'Accept': '*/*',
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Referer': 'https://farmrpg.com/index.php'
};

async function inteligenciaLlama(prata, stamina) {
    try {
        const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama3-8b-8192",
            messages: [
                { role: "system", content: "Você é um bot estrategista de Farm RPG. Analise os recursos e responda APENAS com uma dessas palavras: COLHER, PLANTAR ou PESCAR." },
                { role: "user", content: `Status Atual: Prata ${prata}, Stamina ${stamina}. O que devo priorizar?` }
            ],
            temperature: 0.4
        }, {
            headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' }
        });
        return res.data.choices[0].message.content.toUpperCase();
    } catch (e) {
        return "COLHER";
    }
}

async function realizarAcao(go, nome) {
    try {
        const r = await axios.post(`https://farmrpg.com/worker.php?go=${go}`, {}, { headers });
        console.log(`[EXECUÇÃO] ${nome} | Resposta: ${String(r.data).substring(0, 30)}`);
        return r.data;
    } catch (error) {
        console.log(`Erro técnico em: ${nome}`);
    }
}

async function iniciarFarmInteligente(chatId) {
    bot.sendMessage(chatId, "🛡️ *SISTEMA V27 ATIVADO*\nTokens sincronizados e Llama 3 operando!");
    while (true) {
        try {
            const check = await axios.get('https://farmrpg.com/index.php', { headers });
            if (!check.data.includes('username')) {
                bot.sendMessage(chatId, "❌ *ALERTA:* Token rejeitado! Pegue novos cookies.");
                break;
            }
            const prata = check.data.match(/class='silver'>(.*?)<\/span>/)?.[1] || '0';
            const stamina = check.data.match(/id='staminatxt'>(.*?)<\/span>/)?.[1] || '0';

            const decisao = await inteligenciaLlama(prata, stamina);
            bot.sendMessage(chatId, `🧠 *IA Decidiu:* ${decisao}\n💰 Prata: ${prata} | ⚡ Stamina: ${stamina}`);

            if (decisao.includes("COLHER")) {
                await realizarAcao('harvestall', 'Colheita Automática');
            } else if (decisao.includes("PLANTAR")) {
                await realizarAcao('plantall&id=8', 'Plantio de Pimentas');
            } else if (decisao.includes("PESCAR")) {
                if (parseInt(stamina) > 5) {
                    await realizarAcao('fish&id=1', 'Pescaria');
                    await realizarAcao('sellallfish', 'Venda de Peixes');
                } else {
                    await realizarAcao('harvestall', 'Recuperando Stamina');
                }
            }
            await realizarAcao('collectallpets', 'Coleta de Pets');
        } catch (e) {
            console.log("Falha no ciclo.");
        }
        await new Promise(r => setTimeout(r, 120000));
    }
}

bot.onText(/\/start/, (msg) => iniciarFarmInteligente(msg.chat.id));
console.log("V27 Online.");
