const axios = require('axios');

// --- SEUS DADOS ATUALIZADOS (MUNDO BR10) ---
const CONFIG = {
    MUNDO: 'br10',
    SID: 'yKhDnHUrQsXKT4lZzSuGec4PrfWpKBf4dFHe_w6M', // Seu SID atual
    INSTANCE_ID: 'kijquk0j6e',                       // Seu ID de instância
    H: '' // <--- SE O BOT DER ERRO, O LOG VAI TENTAR TE DAR ESSE CÓDIGO
};

const headers = {
    'Cookie': `sid=${CONFIG.SID}; instanceId=${CONFIG.INSTANCE_ID};`,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Content-Type': 'application/json',
    'Origin': `https://${CONFIG.MUNDO}.forgeofempires.com`,
    'Referer': `https://${CONFIG.MUNDO}.forgeofempires.com/game/index`
};

async function enviarComando(servico, metodo, dados = []) {
    // Usamos um 'h' qualquer para forçar o servidor a responder com erro e nos mostrar o real
    const hAtual = CONFIG.H || '1234567890'; 
    const url = `https://${CONFIG.MUNDO}.forgeofempires.com/game/json?h=${hAtual}`;
    
    const payload = [{
        __class__: "ServerRequest",
        requestClass: servico,
        requestMethod: metodo,
        requestData: dados,
        requestId: Math.floor(Math.random() * 10000)
    }];

    try {
        const res = await axios.post(url, payload, { headers });
        
        // LOG DE SEGURANÇA: Se o servidor rejeitar, ele costuma mandar o motivo no JSON
        if (res.data && res.data.found_h) {
            console.log(`🎯 ACHEI O H! O seu código é: ${res.data.found_h}`);
        }

        return res.data;
    } catch (e) {
        console.log("⚠️ Erro de conexão ou H inválido. Verifique o SID.");
        return null;
    }
}

async function iniciarBot() {
    console.log("-----------------------------------------");
    console.log(`🤖 INICIANDO BOT NO MUNDO ${CONFIG.MUNDO.toUpperCase()}`);
    console.log("-----------------------------------------");

    const resposta = await enviarComando("OtherPlayerService", "getNeighborList");

    if (!resposta || !resposta[0] || !resposta[0].responseData) {
        console.log("❌ ERRO: Não foi possível ler os vizinhos.");
        console.log("👉 DICA: Olhe as linhas acima no log para ver se o 'H' apareceu.");
        console.log("👉 Se o SID expirou, pegue um novo no navegador e atualize o script.");
        return;
    }

    const vizinhos = resposta[0].responseData;
    console.log(`👥 Sucesso! ${vizinhos.length} vizinhos encontrados.`);

    let ajudados = 0;
    for (const p of vizinhos) {
        if (!p.is_self && p.next_interaction_in === 0) {
            console.log(`✨ Ajudando: ${p.name}...`);
            await enviarComando("OtherPlayerService", "politeAndMotivate", [p.player_id]);
            ajudados++;
            
            // Delay para evitar banimento (entre 2 e 5 segundos)
            await new Promise(r => setTimeout(r, Math.random() * 3000 + 2000));
        }
    }

    console.log(`🏁 FIM DO CICLO. Total de ajudas: ${ajudados}`);
}

iniciarBot();
setInterval(iniciarBot, 86400000); // Roda a cada 24 horas
