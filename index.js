const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");
const config = require("./config");

let paired = false;

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(config.SESSION_DIR);

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        connectTimeoutMs: 60000
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        console.log("connection.update ->", JSON.stringify(update));

        if (connection === "connecting" && !paired && !state.creds.registered) {
            try {
                await new Promise(r => setTimeout(r, 3000));
                const code = await sock.requestPairingCode(config.OWNER_NUMBER);
                console.log("\n\n🔑 PAIRING CODE: " + code + "\n\n");
                paired = true;
            } catch (e) {
                console.log("❌ Pairing request failed:", e);
            }
        }

        if (connection === "open") {
            console.log("✅✅✅ CONNECTED SUCCESSFULLY as " + sock.user.id);
        }

        if (connection === "close") {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            console.log("❌ Connection closed. Status code:", statusCode, "Full error:", lastDisconnect?.error);
            if (statusCode !== DisconnectReason.loggedOut) {
                console.log("Retrying in 5s...");
                setTimeout(startBot, 5000);
            }
        }
    });
}

startBot();

process.on("uncaughtException", (e) => console.error("uncaughtException:", e));
process.on("unhandledRejection", (e) => console.error("unhandledRejection:", e));
