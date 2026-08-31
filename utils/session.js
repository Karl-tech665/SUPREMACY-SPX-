const fs = require("fs");
const path = require("path");
const config = require("../config");

function restoreSession() {
    try {
        const credsPath = path.join(config.SESSION_DIR, 'creds.json');
        if (!fs.existsSync(credsPath)) return;
        console.log("✅ Session restored.");
    } catch(e) { console.log("❌ Session error:", e.message); }
}

function getSessionId() {
    try {
        const credsPath = path.join(config.SESSION_DIR, 'creds.json');
        if (fs.existsSync(credsPath)) {
            const buffer = fs.readFileSync(credsPath);
            return "SUPREMACY-SPX:~" + buffer.toString('base64');
        }
    } catch(e) {}
    return null;
}

module.exports = { restoreSession, getSessionId };
