const { formatUptime, getRAMUsage, getSpeed } = require("../utils/helpers");
const { getSessionId } = require("../utils/session");
const config = require("../config");

module.exports = (sock, startBot, commands) => {
    sock.ev.on("connection.update", async (update) => {
        const { connection } = update;

        if (connection === "open") {
            console.log("✅ BOT CONNECTED AND ACTIVE!");
            const cmdCount = Object.keys(commands).length;
            const sessionId = getSessionId();

            // Get the user's number (from global variable) or fallback to owner
            const targetJid = (global.pendingPairNumber || config.OWNER_NUMBER) + "@s.whatsapp.net";

            const msg = `✦ 𝐒𝐔𝐏𝐑𝐄𝐌𝐀𝐂𝐘_𝐒𝐏𝐗 ✦\n✅ CONNECTED & ACTIVE\n\n📱 Connected : ${sock.user.id}\n🤖 Bot Name : ${config.BOT_NAME}\n📦 Commands : ${cmdCount}\n⏱️ Uptime : ${formatUptime()}\n🧠 RAM : ${getRAMUsage().bar} ${getRAMUsage().percent}%\n⚡ Speed : ${getSpeed()}\n🌐 Platform : Render\n\n─ [ SESSION CREATED ] ─\nName: ${config.BOT_NAME}\nBy: ${config.OWNER_NAME}\nStatus: ⏳ Waiting Deployment`;

            // Send stylish message
            await sock.sendMessage(targetJid, { text: msg });
            console.log("📨 Stylish message sent.");

            // Send raw Session ID
            if (sessionId && sessionId.length > 80) {
                await sock.sendMessage(targetJid, { text: sessionId });
                console.log("📨 Raw SESSION_ID sent to user.");
            }

            // Reset pending number so it doesn't send to the same person again
            global.pendingPairNumber = null;
        }
    });
};
