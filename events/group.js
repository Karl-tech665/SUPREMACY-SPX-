module.exports = (sock) => {
    sock.ev.on("group-participants.update", async (update) => {
        if (update.action === "add") {
            for (const p of update.participants) {
                await sock.sendMessage(update.id, {
                    text: "👋 Welcome @" + p.split("@")[0] + "!",
                    mentions: [p]
                });
            }
        }
    });
};
