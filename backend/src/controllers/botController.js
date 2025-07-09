const { spawn, exec } = require('child_process');
const path = require('path');
const QRCode = require('qrcode');

class BotController {
    constructor() {
        this.botProcess = null;
        this.connectionStatus = 'disconnected';
        this.qrCode = null;
        this.logs = [];
        this.botPath = path.join(__dirname, '../../../bot-whatsapp');
    }

    addLog(message) {
        const timestamp = new Date().toISOString();
        this.logs.push(`[${timestamp}] ${message}`);
        if (this.logs.length > 100) {
            this.logs = this.logs.slice(-100);
        }
        console.log(`[Bot Controller] ${message}`);
    }

    async getStatus(req, res) {
        const status = {
            status: this.connectionStatus || "disconnected",
            uptime: 0,
            qrCode: this.qrCode ? this.qrCode.replace(/\u001b\[[0-9;]*m/g, '') : null,
            logsCount: this.logs.length,
            processId: this.botProcess ? this.botProcess.pid : null
        };
        res.json({ success: true, data: status });
    }

    async startBot(req, res) {
        try {
            await this.stopBotProcess();
            this.connectionStatus = 'connecting';
            this.qrCode = null;
            this.addLog('Iniciando bot WhatsApp...');

            this.botProcess = spawn('node', ['src/index.js'], {
                cwd: this.botPath,
                stdio: ['pipe', 'pipe', 'pipe'],
                detached: false
            });

            this.botProcess.stdout.on('data', (data) => {
                const output = data.toString();
                
               // Detectar QR Code - DEBUG AMPLO
console.log('=== TODA SAÍDA ===');
console.log('Contém █:', output.includes('█'));
console.log('Contém ▄:', output.includes('▄'));  
console.log('Contém ▀:', output.includes('▀'));
console.log('Tamanho:', output.length);
console.log('Primeiros 20 chars:', JSON.stringify(output.substring(0, 20)));
console.log('=================');

if (output.length > 30000 || output.includes('\u001b[47m') || output.includes('█')) {
    console.log('=== QR DETECTADO ===');
    console.log('Tamanho:', output.length);
    console.log('===================');

    // Converter códigos ANSI para ASCII visual
    this.qrCode = output
    .replace(/\u001b\[47m  \u001b\[0m/g, "██")  // Branco → ██
    .replace(/\u001b\[40m  \u001b\[0m/g, "  ")  // Preto → espaços
    .replace(/\u001b\[[0-9;]*m/g, "");          // Limpar códigos restantes
    this.connectionStatus = 'waiting_qr';
    this.addLog('QR Code gerado');
}
                this.addLog(`STDOUT: ${output.trim()}`);
            });

            this.botProcess.stderr.on('data', (data) => {
                this.addLog(`ERRO: ${data.toString().trim()}`);
            });

            this.botProcess.on('close', (code) => {
                this.connectionStatus = 'disconnected';
                this.botProcess = null;
                this.qrCode = null;
            });

            res.json({ success: true, message: 'Bot iniciado' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async stopBot(req, res) {
        await this.stopBotProcess();
        res.json({ success: true, message: 'Bot parado' });
    }

    async stopBotProcess() {
        return new Promise((resolve) => {
            if (this.botProcess && !this.botProcess.killed) {
                this.botProcess.kill('SIGTERM');
                setTimeout(() => {
                    if (this.botProcess && !this.botProcess.killed) {
                        this.botProcess.kill('SIGKILL');
                    }
                    resolve();
                }, 3000);
            } else {
                exec('pkill -f "bot-whatsapp"', () => resolve());
            }
            this.connectionStatus = 'disconnected';
            this.botProcess = null;
            this.qrCode = null;
        });
    }
    async getQRCode(req, res) {
    try {
        res.json({
            success: true,
            data: {
                qrCode: this.qrCode || null,
                status: this.connectionStatus || "disconnected"
            }
        });
    } catch (error) {
        res.json({
            success: true,
            data: {
                qrCode: null,
                status: this.connectionStatus || "disconnected"
            }
        });
    }
}


    async getLogs(req, res) {
        res.json({ success: true, data: { logs: this.logs } });
    }

    async restartBot(req, res) {
        await this.stopBotProcess();
        setTimeout(() => this.startBot(req, res), 2000);
    }
}

const botController = new BotController();

module.exports = {
    getStatus: (req, res) => botController.getStatus(req, res),
    startBot: (req, res) => botController.startBot(req, res),
    stopBot: (req, res) => botController.stopBot(req, res),
    getQRCode: (req, res) => botController.getQRCode(req, res),
    getLogs: (req, res) => botController.getLogs(req, res),
    restartBot: (req, res) => botController.restartBot(req, res)
};
