const axios = require('axios');
const http = require('http');

// --- SEUS DADOS (ATUALIZE O SID SEMPRE QUE EXPIRAR) ---
const CONFIG = {
    MUNDO: 'br10',
    SID: 'yKhDnHUrQsXKT4lZzSuGec4PrfWpKBf4dFHe_w6M', 
    INSTANCE_ID: 'kijquk0j6e',
    H: '' // Deixe vazio se não tiver, o bot tentará rodar sem ele
};

const headers = {
    'Cookie': `sid=${CONFIG.SID}; instanceId=${CONFIG.INSTANCE_ID};`,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Content-Type': 'application/json',
    'Origin': `https://${CONFIG.MUNDO}.forgeofempires.com`,
    'Referer': `https://${CONFIG.MUNDO}.forgeofempires.com/game/index`
};

// MANTÉM O RAILWAY FELIZ (EVITA O ERRO SIGTERM)
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot Forge of Empires Online!\n');
});
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`🚀 Servidor de monitoramento na porta ${PORT}`));

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
        return null;
    }
}

async function iniciarBot() {
    console.log(`\n📅 Execução: ${new Date().toLocaleString()}`);
    
    try {
        const resposta = await enviarComando("OtherPlayerService", "getNeighborList");

        if (!resposta || !resposta[0] || !resposta[0].responseData) {
            console.log("❌ ERRO: O SID expirou ou o servidor bloqueou a conexão.");
            console.log("👉 Pegue um novo SID no navegador e atualize o GitHub.");
            return;
        }

        const vizinhos = resposta[0].responseData;
        console.log(`👥 Vizinhos encontrados: ${vizinhos.length}`);

        let contador = 0;
        for (const p of vizinhos) {
            if (!p.is_self && p.next_interaction_in === 0) {
                console.log(`✨ Motivando: ${p.name}...`);
                await enviarComando("OtherPlayerService", "politeAndMotivate", [p.player_id]);
                contador++;
                
                // Delay de 3 segundos para segurança
                await new Promise(r => setTimeout(r, 3000));
            }
        }
        console.log(`🏁 Ciclo finalizado. Ajudados: ${contador}`);

    } catch (error) {
        console.log("⚠️ Ocorreu um erro, mas o bot continua online.");
    }
}

// Inicia a primeira vez e repete a cada 6 horas
iniciarBot();
setInterval(iniciarBot, 21600000); 
