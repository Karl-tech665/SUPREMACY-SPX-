const config = require("../config");
module.exports = {
    prefix: config.PREFIX,
    mode: "public",
    antibug: true,
    antilink: true,
    antispam: true,
    botName: config.BOT_NAME
};
