const config = require("../config");
const state = require("../utils/botSettings");

module.exports = (sock, commands) => {
    sock.ev.on("messages.upsert", async ({ messages }) => {
        for (const msg of messages) {
            try {
                if (!msg.message || msg.key.fromMe) continue;
                const from = msg.key.remoteJid;
                const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
                if (!body) continue;
                if (body.startsWith(state.prefix)) {
                    let args = body.slice(state.prefix.length).trim().split(/ +/);
                    let cmdName = args.shift().toLowerCase();
                    let cmd = commands[cmdName];
                    if (cmd) await cmd.execute(sock, from, args, msg, { commands: commands });
                }
            } catch (e) { console.error("Message error:", e.message); }
        }
    });
};
