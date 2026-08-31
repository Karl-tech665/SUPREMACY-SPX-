function formatUptime() {
    const u = process.uptime();
    const d = Math.floor(u / 86400);
    const h = Math.floor((u % 86400) / 3600);
    const m = Math.floor((u % 3600) / 60);
    const s = Math.floor(u % 60);
    if (d > 0) return d + "d " + h + "h " + m + "m " + s + "s";
    if (h > 0) return h + "h " + m + "m " + s + "s";
    if (m > 0) return m + "m " + s + "s";
    return s + "s";
}
function getRAMUsage() {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    const total = require('os').totalmem() / 1024 / 1024;
    const percent = Math.round((used / total) * 100);
    const bars = '█'.repeat(Math.round(percent / 10)) + '░'.repeat(10 - Math.round(percent / 10));
    return { used: used.toFixed(1), total: total.toFixed(1), percent, bar: bars };
}
function getSpeed() {
    return Date.now() % 1000 + " ms";
}
async function animateMessage(sock, from, frames, delay = 500) {
    let { key } = await sock.sendMessage(from, { text: frames[0] });
    for (let i = 1; i < frames.length; i++) {
        await new Promise(r => setTimeout(r, delay));
        await sock.sendMessage(from, { text: frames[i], edit: key });
    }
}
module.exports = { formatUptime, getRAMUsage, getSpeed, animateMessage };
