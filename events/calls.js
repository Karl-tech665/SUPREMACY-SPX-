module.exports = (sock) => {
    sock.ev.on("call", async (calls) => {
        for (const call of calls) {
            await sock.rejectCall(call.id, call.from).catch(() => {});
            console.log("📵 Rejected call from " + call.from);
        }
    });
};
