const fs = require("fs");
const path = require("path");

function loadCommands(commandsPath) {
    let commands = {};
    if (!fs.existsSync(commandsPath)) return commands;
    const files = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of files) {
        try {
            const cmdModule = require(path.join(commandsPath, file));
            const cmdArray = Array.isArray(cmdModule) ? cmdModule : [cmdModule];
            for (const cmd of cmdArray) {
                if (cmd && cmd.name) {
                    commands[cmd.name] = cmd;
                    if (cmd.aliases) {
                        cmd.aliases.forEach(alias => commands[alias] = cmd);
                    }
                }
            }
        } catch (e) {
            console.error("❌ Failed to load command file:", file, e.message);
        }
    }
    return commands;
}

module.exports = { loadCommands };
