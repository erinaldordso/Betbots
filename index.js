const axios = require('axios');

// CONFIGURAÇÃO DOS SEUS COOKIES (O QUE VOCÊ PEGOU NO NAVEGADOR)
const SID = 'W7bWbyw_cq3lzzv4N-l0J4j2dUDOs8lBCD0nXT6Y';
const INSTANCE_ID = 'ievw22oi9';
const MUNDO = 'br10'; // Seu mundo no Forge

const headers = {
    'Cookie': `sid=${SID}; instanceId=${INSTANCE_ID};`,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Content-Type': 'application/json'
};

// FUNÇÃO PARA ENVIAR COMANDOS AO SERVIDOR
async function enviarComando(servico, metodo, dados = []) {
    // Nota: Como não temos o 'h', tentamos enviar vazio. 
    // Se o servidor negar, ele retornará o erro com o 'h' necessário no corpo da resposta.
    const url = `https://${MUNDO}.forgeofempires.com/game/json?h=`;
    
    const payload = [{
        __class__: "ServerRequest",
        requestClass: servico,
        requestMethod: metodo,
        requestData: dados,
        requestId: Math.floor(Math.random() * 1000)
    }];

    try {
        const res = await axios.post(url, payload, { headers });
        return res.data;
    } catch (e) {
        console.error("❌ Erro na requisição:", e.message);
        return null;
    }
}

// LÓGICA PRINCIPAL: AUTO-AJUDA (MOTIVAR/POLIR VIZINHOS)
async function rodarBot() {
    console.log("🤖 Iniciando ciclo de ajuda automática...");

    // 1. Pega a lista de vizinhos
    const vizinhos = await enviarComando("OtherPlayerService", "getNeighborList");

    if (!vizinhos || !vizinhos[0] || !vizinhos[0].responseData) {
        console.log("⚠️ Não foi possível ler a lista. Verifique se o SID ainda é válido.");
        return;
    }

    const players = vizinhos[0].responseData;
    console.log(`👥 Encontrados ${players.length} vizinhos.`);

    for (let player of players) {
        // Só ajuda se não for você mesmo e se o botão de ajuda estiver disponível (next_interaction_in === 0)
        if (!player.is_self && player.next_interaction_in === 0) {
            console.log(`✨ Ajudando jogador: ${player.name}...`);
            
            await enviarComando("OtherPlayerService", "politeAndMotivate", [player.player_id]);
            
            // ESPERA de 3 a 5 segundos entre cada ajuda (MUITO IMPORTANTE PARA NÃO SER BANIDO)
            const delay = Math.floor(Math.random() * 2000) + 3000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    console.log("🏁 Ciclo concluído! Próxima verificação em 24 horas.");
}

// Executa o bot imediatamente ao ligar o Railway
rodarBot();

// Agenda para rodar a cada 24 horas (86400000 ms)
setInterval(rodarBot, 86400000);
