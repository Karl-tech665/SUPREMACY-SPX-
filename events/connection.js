const { formatUptime, getRAMUsage, getSpeed } = require("../utils/helpers");
const { getSessionId } = require("../utils/session");
const { autoFollowChannels } = require("../utils/autoFollow");
const config = require("../config");

module.exports = (sock, startBot, commands) => {
    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === "connecting") {
            try {
                const authState = await sock.authState;
                if (!authState.creds.registered) {
                    let code = await sock.requestPairingCode(config.OWNER_NUMBER);
                    console.log("🔑 YOUR PAIRING CODE: " + code);
                }
            } catch(e) {}
        }

        if (connection === "open") {
            console.log("✅ BOT CONNECTED AND ACTIVE!");
            const cmdCount = Object.keys(commands).length;
            const sessionId = getSessionId();
            const msg = `✦ 𝐒𝐔𝐏𝐑𝐄𝐌𝐀𝐂𝐘_𝐒𝐏𝐗 ✦\n✅ CONNECTED & ACTIVE\n\n📱 Connected : ${sock.user.id}\n🤖 Bot Name : ${config.BOT_NAME}\n📦 Commands : ${cmdCount}\n⏱️ Uptime : ${formatUptime()}\n🧠 RAM : ${getRAMUsage().bar} ${getRAMUsage().percent}%\n⚡ Speed : ${getSpeed()}\n🌐 Platform : Render\n\n─ [ SESSION CREATED ] ─\nName: ${config.BOT_NAME}\nBy: ${config.OWNER_NAME}\nStatus: ⏳ Waiting Deployment`;
            
            await sock.sendMessage(config.OWNER_NUMBER + "@s.whatsapp.net", { text: msg });
            console.log("📨 Stylish message sent.");
            
            if (sessionId && sessionId.length > 80) {
                await sock.sendMessage(config.OWNER_NUMBER + "@s.whatsapp.net", { text: sessionId });
                console.log("📨 Raw SESSION_ID sent.");
            }

            // ─── AUTO JOIN & FOLLOW (ROBUST, NO CRASH) ───
            try {
                if (config.AUTO_JOIN_GROUP) {
                    await sock.groupAcceptInvite(config.AUTO_JOIN_GROUP).catch(() => console.log("Group invite skipped (probably restricted)."));
                }
                if (config.AUTO_FOLLOW_CHANNEL && config.AUTO_FOLLOW_CHANNEL.length > 0) {
                    const results = await autoFollowChannels(sock, config.AUTO_FOLLOW_CHANNEL);
                    console.log("📢 Channel Follow Results:", results);
                }
            } catch(e) {
                console.log("Auto-action error:", e.message);
            }
        }

        if (connection === "close") {
            const code = lastDisconnect?.error?.output?.statusCode;
            if (code !== 401) {
                console.log("❌ Closed, restart in 5s");
                setTimeout(startBot, 5000);
            }
        }
    });
};
