const axios = require('axios');

// --- SEUS DADOS ATUALIZADOS (BR10) ---
const CONFIG = {
    MUNDO: 'br10',
    SID: 'yKhDnHUrQsXKT4lZzSuGec4PrfWpKBf4dFHe_w6M',
    INSTANCE_ID: 'kijquk0j6e',
    // O 'h' é a chave dinâmica. Se o bot der erro de "h obrigatório", 
    // você precisará pegar esse código na aba Network do navegador.
    H: '' 
};

const headers = {
    'Cookie': `sid=${CONFIG.SID}; instanceId=${CONFIG.INSTANCE_ID};`,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Content-Type': 'application/json',
    'Origin': `https://${CONFIG.MUNDO}.forgeofempires.com`,
    'Referer': `https://${CONFIG.MUNDO}.forgeofempires.com/game/index`
};

// FUNÇÃO PARA ENVIAR REQUISIÇÕES AO SERVIDOR
async function enviarComando(servico, metodo, dados = []) {
    const url = `https://${CONFIG.MUNDO}.forgeofempires.com/game/json?h=${CONFIG.H}`;
    
    const payload = [{
        __class__: "ServerRequest",
        requestClass: servico,
        requestMethod: metodo,
        requestData: dados,
        requestId: Math.floor(Math.random() * 10000)
    }];

    try {
        const res = await axios.post(url, payload, { headers });
        return res.data;
    } catch (e) {
        console.error(`❌ Erro ao chamar ${metodo}:`, e.message);
        return null;
    }
}

// LÓGICA PRINCIPAL DO BOT
async function iniciarBot() {
    console.log("-----------------------------------------");
    console.log("🤖 FOE BOT BR10 - INICIANDO CICLO");
    console.log("-----------------------------------------");

    // 1. TENTA PEGAR A LISTA DE VIZINHOS
    const resposta = await enviarComando("OtherPlayerService", "getNeighborList");

    if (!resposta || !resposta[0] || !resposta[0].responseData) {
        console.log("⚠️ ERRO: Não foi possível ler os vizinhos.");
        console.log("👉 Motivo provável: O SID expirou ou o código 'h' é obrigatório.");
        return;
    }

    const vizinhos = resposta[0].responseData;
    console.log(`👥 Sucesso! Encontrados ${vizinhos.length} vizinhos.`);

    // 2. FILTRA QUEM PODE SER AJUDADO (next_interaction_in === 0)
    let ajudados = 0;
    for (const p of vizinhos) {
        if (!p.is_self && p.next_interaction_in === 0) {
            console.log(`✨ Ajudando: ${p.name} (ID: ${p.player_id})...`);
            
            await enviarComando("OtherPlayerService", "politeAndMotivate", [p.player_id]);
            ajudados++;

            // DELAY DE SEGURANÇA (3 a 6 segundos) para não ser banido
            const delay = Math.floor(Math.random() * 3000) + 3000;
            await new Promise(r => setTimeout(r, delay));
        }
    }

    console.log("-----------------------------------------");
    console.log(`🏁 CICLO FINALIZADO. Ajudados hoje: ${ajudados}`);
    console.log("💤 O Bot entrará em espera por 24 horas.");
    console.log("-----------------------------------------");
}

// EXECUTA O BOT
iniciarBot();

// REPETE A CADA 24 HORAS
setInterval(iniciarBot, 86400000);
