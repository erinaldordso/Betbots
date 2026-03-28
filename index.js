const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// --- CONFIGURAÇÕES DE ACESSO ---
const telegramToken = '8602651456:AAHBB8g0lvXPEZjcUN4afQxkTGhzRDUc8UE';
const GROQ_KEY = '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';

// COOKIES ATUALIZADOS (28/03/2026)
const COOKIES = 'pac_ocean=4829DE6B; HighwindFRPG=K2Frkr5rtP9NUJqkQJS3lw%3D%3D%3Cstrip%3E%24argon2id%24v%3D19%24m%3D7168%2Ct%3D4%2Cp%3D1%24WmhsbEc3Y3hXTk05NUJtMw%24Si%2FlxsAxAZF6elMB50x8GXJSQKWd12ZpZ8oUstU2Vd8; farmrpg_token=h1jh6v8vd0qdvnfp4k6qco7dpgvp6un0dk92cb14; last_tab_profile=tab1;';

const bot = new TelegramBot(telegramToken, { polling: true });

const webHeaders = {
    'Host': 'farmrpg.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cookie': COOKIES,
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'Referer': 'https://farmrpg.com/index.php',
    'X-Requested-With': 'XMLHttpRequest'
};

// --- CÉREBRO LLAMA 3 ---
async function inteligenciaLlama(prata, stamina) {
    try {
        const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama3-8b-8192",
            messages: [
                { role: "system", content: "Você é o mestre do Farm RPG. Responda apenas UMA palavra: COLHER, PLANTAR ou PESCAR." },
                { role: "user", content: `Status: ${prata} prata, ${stamina} stamina. O que fazer agora?` }
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
        // Delay aleatório para parecer humano (2 a 4 segundos)
        await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
        
        const r = await axios.post(`https://farmrpg.com/worker.php?go=${go}`, {}, { 
            headers: { ...webHeaders, 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' } 
        });
        console.log(`[ACAO] ${nome} executado.`);
        return r.data;
    } catch (error) {
        console.log(`Erro em: ${nome}`);
    }
}

async function iniciarFarmReal(chatId) {
    bot.sendMessage(chatId, "🚀 *MODO NAVEGADOR COMPATÍVEL ATIVADO*\nConectando à sua conta real...");

    while (true) {
        try {
            // BUSCA STATUS REAL DA CONTA
            const response = await axios.get('https://farmrpg.com/index.php', { headers: webHeaders });
            const html = response.data;

            if (!html.includes('username')) {
                bot.sendMessage(chatId, "❌ *Erro de Login:* O token expirou ou é inválido.");
                break;
            }

            // Captura Prata e Stamina direto do site
            const prata = html.match(/class='silver'>(.*?)<\/span>/)?.[1] || "Desconhecido";
            const stamina = html.match(/id='staminatxt'>(.*?)<\/span>/)?.[1] || "0";

            const decisao = await inteligenciaLlama(prata, stamina);
            bot.sendMessage(chatId, `📊 *STATUS REAL:*\n💰 Prata: ${prata}\n⚡ Stamina: ${stamina}\n\n🤖 *IA Decidiu:* ${decisao}`);

            // Execução baseada na decisão
            if (decisao.includes("COLHER")) await realizarAcao('harvestall', 'Colheita');
            if (decisao.includes("PLANTAR")) await realizarAcao('plantall&id=8', 'Plantio');
            if (decisao.includes("PESCAR")) {
                if (parseInt(stamina) > 10) {
                    await realizarAcao('fish&id=1', 'Pescaria');
                    await realizarAcao('sellallfish', 'Venda de Peixes');
                }
            }
            await realizarAcao('collectallpets', 'Pets');

        } catch (e) {
            console.log("Erro no ciclo: " + e.message);
        }
        
        // Espera 3 minutos entre os ciclos para segurança total
        await new Promise(r => setTimeout(r, 180000));
    }
}

bot.onText(/\/start/, (msg) => iniciarFarmReal(msg.chat.id));
console.log("V28 Real-Mode Online.");

// Tratamento de erros para não derrubar o container do Railway
process.on('uncaughtException', (err) => console.error('Erro:', err));
