const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// --- CONFIGURAÇÕES DE ACESSO ---
const telegramToken = '8602651456:AAHBB8g0lvXPEZjcUN4afQxkTGhzRDUc8UE';
const GROQ_KEY = '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';

// Seus cookies atualizados (Simulando login via WWW)
const COOKIES = 'pac_ocean=3E830B6C; HighwindFRPG=K2Frkr5rtP9NUJqkQJS3lw%3D%3D%3Cstrip%3E%24argon2id%24v%3D19%24m%3D7168%2Ct%3D4%2Cp%3D1%24WmhsbEc3Y3hXTk05NUJtMw%24Si%2FlxsAxAZF6elMB50x8GXJSQKWd12ZpZ8oUstU2Vd8; farmrpg_token=iu9485rc4fjepnk1g4bsgu319n1p0lbtqtcror2c; last_tab_profile=tab1;';

const bot = new TelegramBot(telegramToken, { polling: true });

// --- HEADERS QUE SIMULAM NAVEGADOR REAL (WWW MODE) ---
const webHeaders = {
    'Host': 'farmrpg.com',
    'Connection': 'keep-alive',
    'Pragma': 'no-cache',
    'Cache-Control': 'no-cache',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Origin': 'https://farmrpg.com',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Dest': 'empty',
    'Referer': 'https://farmrpg.com/index.php',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cookie': COOKIES,
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
};

// --- CÉREBRO LLAMA 3 ---
async function inteligenciaLlama(prata, stamina) {
    try {
        const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama3-8b-8192",
            messages: [
                { role: "system", content: "Você é um bot estrategista de Farm RPG. Responda APENAS com uma dessas palavras: COLHER, PLANTAR ou PESCAR." },
                { role: "user", content: `Status: ${prata} prata, ${stamina} stamina. O que fazer?` }
            ],
            temperature: 0.3
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
        // Simulando o tempo de clique humano (1.5 a 3 segundos)
        await new Promise(r => setTimeout(r, 1500 + Math.random() * 1500));
        
        const r = await axios.post(`https://farmrpg.com/worker.php?go=${go}`, {}, { headers: webHeaders });
        console.log(`[WWW-BOT] ${nome} executado.`);
        return r.data;
    } catch (error) {
        console.log(`Erro técnico em: ${nome}`);
    }
}

async function iniciarFarmWWW(chatId) {
    bot.sendMessage(chatId, "🌐 *MODO NAVEGADOR WWW ATIVADO*\nSimulando acesso real via Chrome/Windows.");

    while (true) {
        try {
            // Verifica se ainda está logado
            const check = await axios.get('https://farmrpg.com/index.php', { headers: webHeaders });
            if (!check.data.includes('username')) {
                bot.sendMessage(chatId, "⚠️ Sessão expirada! Atualize os cookies no GitHub.");
                break;
            }

            const prata = check.data.match(/class='silver'>(.*?)<\/span>/)?.[1] || '0';
            const stamina = check.data.match(/id='staminatxt'>(.*?)<\/span>/)?.[1] || '0';

            const decisao = await inteligenciaLlama(prata, stamina);
            bot.sendMessage(chatId, `🤖 *IA Decidiu:* ${decisao}\n💰 Prata: ${prata} | ⚡ Stamina: ${stamina}`);

            if (decisao.includes("COLHER")) await realizarAcao('harvestall', 'Colheita');
            if (decisao.includes("PLANTAR")) await realizarAcao('plantall&id=8', 'Plantio');
            if (decisao.includes("PESCAR")) {
                if (parseInt(stamina) > 5) {
                    await realizarAcao('fish&id=1', 'Pescaria');
                    await realizarAcao('sellallfish', 'Venda');
                }
            }
            await realizarAcao('collectallpets', 'Pets');

        } catch (e) {
            console.log("Falha no ciclo.");
        }
        // Espera 2 minutos entre ciclos (Padrão seguro para WWW)
        await new Promise(r => setTimeout(r, 120000));
    }
}

bot.onText(/\/start/, (msg) => iniciarFarmWWW(msg.chat.id));
console.log("V27 WWW-Mode Online.");
