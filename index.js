const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
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

const ytdl = require("@zorner/ytdl-core");
const sharp = require("sharp");
const ffmpeg = require("@ffmpeg-installer/ffmpeg");
global.ytdl = ytdl;
global.sharp = sharp;
global.ffmpegPath = ffmpeg.path;

let globalSock = null;
let globalPaired = false;

// Store the user's phone number who is currently requesting the code
global.pendingPairNumber = null;

// ─── HTTP SERVER (PUBLIC PAIRING PORTAL) ───
const server = http.createServer((req, res) => {
    const filePath = path.join(__dirname, 'public', 'index.html');

    // Serve the HTML page
    if (req.method === 'GET' && req.url === '/') {
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Page not found');
            } else {
                const html = data.toString().replace(/{{MENU_IMAGE}}/g, config.MENU_IMAGE);
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(html);
            }
        });
    }

    // Handle the Pairing Code Generation
    if (req.method === 'POST' && req.url === '/pair') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const { phone } = JSON.parse(body);
                
                // Simple validation
                if (!phone || phone.length < 10) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: false, message: "Please enter a valid phone number." }));
                }

                // Store this user's number to send them the Session ID later
                global.pendingPairNumber = phone;

                if (globalSock && !globalPaired) {
                    setTimeout(async () => {
                        try {
                            const code = await globalSock.requestPairingCode(phone);
                            
                            // Return the code to the site so they can see it
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: true, code: code }));

                            // Also send the code to their WhatsApp DM immediately
                            await globalSock.sendMessage(phone + "@s.whatsapp.net", { 
                                text: `🔑 Your Pairing Code is: *${code}*\n\nEnter this code on WhatsApp > Linked Devices > Link with phone number.`
                            });

                        } catch (e) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ success: false, message: e.message }));
                        }
                    }, 3000); // The 3-second wait
                } else {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, message: "Bot is already paired or not ready. Please wait." }));
                }
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: "Invalid request" }));
            }
        });
    }
});

server.listen(process.env.PORT || 3000, () => console.log(`🚀 HTTP on ${process.env.PORT || 3000}`));

// ─── RESTORE SESSION & LOAD COMMANDS ───
restoreSession();
const commands = loadCommands(path.join(__dirname, "commands"));
console.log("📦 Loaded " + Object.keys(commands).length + " commands");

// ─── START BOT ───
let startBot = async function() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(config.SESSION_DIR);
        const sock = makeWASocket({
            auth: state,
            logger: pino({ level: "silent" }),
            printQRInTerminal: false,
            browser: ["Ubuntu", "Chrome", "20.0.04"],
            connectTimeoutMs: 60000
        });
        globalSock = sock;

        sock.ev.on("creds.update", saveCreds);

        sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === "connecting" && !globalPaired && !state.creds.registered) {
                console.log("Waiting for user to request a pairing code...");
            }

            if (connection === "open") {
                console.log("✅ BOT CONNECTED SUCCESSFULLY as " + sock.user.id);
                globalPaired = true;
                
                // Register events
                registerConnectionHandler(sock, startBot, commands);
                registerMessageHandler(sock, commands);
                registerCallHandler(sock);
                registerGroupHandler(sock);
            }

            if (connection === "close") {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                if (statusCode !== DisconnectReason.loggedOut) {
                    console.log("Retrying in 5s...");
                    setTimeout(startBot, 5000);
                }
            }
        });
    } catch (e) {
        console.error("Start error:", e.message);
        setTimeout(startBot, 10000);
    }
};

console.log("===============================================");
console.log("   ✦ 𝐒𝐔𝐏𝐑𝐄𝐌𝐀𝐂𝐘_𝐒𝐏𝐗 ✦");
console.log("   🚀 MODULAR BOT");
console.log("===============================================\n");
startBot();

process.on("uncaughtException", (e) => console.error("uncaughtException:", e));
process.on("unhandledRejection", (e) => console.error("unhandledRejection:", e));
