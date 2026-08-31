const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");
const pino = require("pino");
const http = require("http");
const config = require("./config");
const { restoreSession } = require("./utils/session");
const { loadCommands } = require("./utils/commandLoader");
const registerConnectionHandler = require("./events/connection");
const registerMessageHandler = require("./events/messages");
const registerCallHandler = require("./events/calls");
const registerGroupHandler = require("./events/group");

// Load Media Dependencies Globally
const ytdl = require("@zorner/ytdl-core");
const sharp = require("sharp");
const ffmpeg = require("@ffmpeg-installer/ffmpeg");
global.ytdl = ytdl;
global.sharp = sharp;
global.ffmpegPath = ffmpeg.path;

// HTTP Server (Dynamic HTML)
const server = http.createServer((req, res) => {
    const filePath = path.join(__dirname, 'public', 'index.html');
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Page not found');
        } else {
            // Replace the placeholder with the actual MENU_IMAGE from config
            const html = data.toString().replace(/{{MENU_IMAGE}}/g, config.MENU_IMAGE);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
        }
    });
});
server.listen(process.env.PORT || 3000, () => console.log(`🚀 HTTP on ${process.env.PORT || 3000}`));

// Restore Session
restoreSession();

// Load Commands
const commands = loadCommands(path.join(__dirname, "commands"));
console.log("📦 Loaded " + Object.keys(commands).length + " commands");

// Start Bot
let startBot = async function() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(config.SESSION_DIR);
        const sock = makeWASocket({
            auth: state,
            logger: pino({ level: "silent" }),
            browser: ["Ubuntu", "Chrome", "20.0.04"],
            markOnlineOnConnect: true,
            connectTimeoutMs: 30000
        });
        sock.ev.on("creds.update", saveCreds);

        registerConnectionHandler(sock, startBot, commands);
        registerMessageHandler(sock, commands);
        registerCallHandler(sock);
        registerGroupHandler(sock);
        global.botSock = sock;
    } catch (e) {
        console.error("Start error:", e.message);
        setTimeout(startBot, 10000);
    }
};

console.log("===============================================");
console.log("   ✦ 𝐒𝐔𝐏𝐑𝐄𝐌𝐀𝐂𝐘_𝐒𝐏𝐗 ✦");
console.log("   🚀 MODULAR BOT");
console.log("   Waiting for connection...");
console.log("===============================================\n");
startBot();

process.on("uncaughtException", function(e) { console.error("Error:", e); });
process.on("unhandledRejection", function(e) { console.error("Rejection:", e); });
