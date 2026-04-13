const parseMessage = require("./utils/parseMessage");
const handlers = require("./handlers");

const userManager = require("./managers/userManager");
const matchManager = require("./managers/matchManager");
const lobbyManager = require("./managers/lobbyManager");
const channelManager = require("./managers/channelManager");

module.exports = function handleSocket(socket) {

    socket.on("disconnect", () => {
        const user = userManager.removeUser(socket);
        if (!user) return;

        matchManager.deleteMatch(user, true);
        lobbyManager.leaveLobby(user.lobby, socket);
        channelManager.removeSocketFromAll(socket);

        console.log(user.playerName, " disconnected");
    });

    socket.on("m", (msg) => {
        const { cmd, parts, key } = parseMessage(msg);
        const userData = userManager.getUser(socket);

        if (!userData && cmd !== "auth") return;

        if(!userData)
        {
            console.log("Raw:", msg);
        }else{
            console.log("From:", userData.playerName, "Raw:", msg);
        }

        const handler = handlers[cmd];

        if (!handler) {
            console.log("Unknown command:", cmd);
            return;
        }

        try {
            handler({ socket, userData, parts, key });
        } catch (err) {
            console.error("Error handling command:", cmd, err);
        }
    });
};