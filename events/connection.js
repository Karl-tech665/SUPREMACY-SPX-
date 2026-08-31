const { formatUptime, getRAMUsage, getSpeed } = require("../utils/helpers");
const { getSessionId } = require("../utils/session");
const config = require("../config");

async function autoFollowChannels(sock, channelJids = []) {
    const channels = [...new Set(channelJids.filter(jid => typeof jid === 'string' && jid.endsWith('@newsletter')))];
    for (const channelJid of channels) {
        try {
            const meta = await sock.newsletterMetadata('jid', channelJid);
            const role = meta?.viewer_metadata?.role || meta?.viewerMeta?.role || meta?.role;
            if (role && role !== 'GUEST') continue;
            try { await sock.newsletterFollow(channelJid); } catch {}
        } catch(e) { console.log("Skip follow:", e.message); }
    }
}

module.exports = (sock, startBot, commands) => {
    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === "connecting") {
            // Pairing Logic
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

            // Auto Join/Follow (Safe)
            try {
                if (config.AUTO_JOIN_GROUP) await sock.groupAcceptInvite(config.AUTO_JOIN_GROUP).catch(()=>{});
                if (config.AUTO_FOLLOW_CHANNEL) await autoFollowChannels(sock, [config.AUTO_FOLLOW_CHANNEL + "@newsletter"]);
            } catch(e) {}
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
