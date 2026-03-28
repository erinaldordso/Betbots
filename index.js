const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// --- CONFIGURAÇÕES ---
const telegramToken = '8602651456:AAHBB8g0lvXPEZjcUN4afQxkTGhzRDUc8UE';
const GROQ_KEY = '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';

// COOKIES ATUALIZADOS (Limpos para o Axios)
const COOKIES = 'pac_ocean=4829DE6B; HighwindFRPG=K2Frkr5rtP9NUJqkQJS3lw%3D%3D; farmrpg_token=h1jh6v8vd0qdvnfp4k6qco7dpgvp6un0dk92cb14; last_tab_profile=tab1;';

const bot = new TelegramBot(telegramToken, { polling: true });

// HEADERS DE NAVEGADOR DE ALTA COMPATIBILIDADE
const browserHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cookie': COOKIES,
    'Referer': 'https://farmrpg.com/index.php',
    'Origin': 'https://farmrpg.com',
    'Connection': 'keep-alive'
};

async function inteligenciaLlama(prata, stamina) {
    try {
        const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: "llama3-8b-8192",
            messages: [
                { role: "system", content: "Responda apenas UMA palavra: COLHER, PLANTAR ou PESCAR." },
                { role: "user", content: `Status: ${prata} prata, ${stamina} stamina.` }
            ],
            temperature: 0.3
        }, {
            headers: { 'Authorization': `Bearer ${GROQ_KEY}` }
        });
        return res.data.choices[0].message.content.toUpperCase();
    } catch (e) { return "COLHER"; }
}

async function realizarAcao(go, nome) {
    try {
        await new Promise(r => setTimeout(r, 2000));
        const r = await axios.post(`https://farmrpg.com/worker.php?go=${go}`, {}, { headers: browserHeaders });
        console.log(`[ACAO] ${nome}: ${String(r.data).substring(0, 20)}`);
    } catch (error) { console.log(`Erro em ${nome}`); }
}

async function iniciarFarm(chatId) {
    bot.sendMessage(chatId, "🔍 *Tentando Logar na Conta Real...*");

    while (true) {
        try {
            // Tenta acessar a página principal para pegar os dados
            const response = await axios.get('https://farmrpg.com/index.php', { 
                headers: browserHeaders,
                maxRedirects: 5 
            });
            const html = response.data;

            // TESTE DE LOGIN: Procura pelo ID da stamina ou prata que só aparecem logado
            if (!html.includes('staminatxt') && !html.includes('silver')) {
                bot.sendMessage(chatId, "⚠️ *LOGIN FALHOU:* O bot está vendo a página de login, não a sua fazenda.\n\n*O que fazer:* Abra o jogo no PC, pegue os cookies de novo e NÃO FAÇA LOGOUT.");
                console.log("Falha no Login - Conteúdo recebido não é a Fazenda.");
                break;
            }

            // Captura de Prata e Stamina
            const prata = html.match(/class='silver'>(.*?)<\/span>/)?.[1] || "0";
            const stamina = html.match(/id='staminatxt'>(.*?)<\/span>/)?.[1] || "0";

            const decisao = await inteligenciaLlama(prata, stamina);
            bot.sendMessage(chatId, `✅ *LOGADO!* \n💰 Prata: ${prata} \n⚡ Stamina: ${stamina}\n🤖 *IA:* ${decisao}`);

            if (decisao.includes("COLHER")) await realizarAcao('harvestall', 'Colheita');
            if (decisao.includes("PLANTAR")) await realizarAcao('plantall&id=8', 'Pimentas');
            if (decisao.includes("PESCAR") && parseInt(stamina) > 5) {
                await realizarAcao('fish&id=1', 'Pesca');
                await realizarAcao('sellallfish', 'Venda');
            }
            await realizarAcao('collectallpets', 'Pets');

        } catch (e) {
            console.error("Erro no ciclo:", e.message);
            bot.sendMessage(chatId, "🔌 Erro de conexão com o Farm RPG.");
        }
        await new Promise(r => setTimeout(r, 120000));
    }
}

bot.onText(/\/start/, (msg) => iniciarFarm(msg.chat.id));
console.log("V29 Online.");
