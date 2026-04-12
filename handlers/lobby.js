const send = require("../utils/send");
const lobbyManager = require("../managers/lobbyManager");
const userManager = require("../managers/userManager");

function lobby_set({ socket, userData, parts, key }) {
    const channel = parts[1];

    let lobby = lobbyManager.getLobby(channel);
    if (!lobby) {
        console.log("Lobby not found:", channel);
        return;
    }

    let oldLobby = lobbyManager.getLobby(userData.lobby);
    if (oldLobby) {
        lobbyManager.leaveLobby(userData.lobby, socket)
    }

    userData.lobby = channel;
    lobbyManager.joinLobby(userData.lobby, socket);

    send(socket, ["lobby channel set"], key)
}

function lobby_chat({ socket, userData, parts, key }) {
    const message = parts[1];

    let lobby = lobbyManager.getLobby(userData.lobby);
    if (!lobby) {
        console.log("Lobby not found for chat message:", userData.lobby);
        return;
    }

    const responseParts = [
        "lobby",
        userData.playerName, //message_from_user_nickname
        message, //message_text_Safe
        0, //message_from_user_recently_met_secret
        userData.userId.toString(), //message_from_user_uid_str
        2 //message_type
    ];

    for (let a of lobby.players) {
        let player = userManager.getUser(a);
        if (player) {
            console.log("Sending lobby message to user:", player.userId);
            send(player.socket, responseParts, key);
        }
    }

    const confirm = [
        "lobby chat sent"
    ];

    send(socket, confirm, key);
}

module.exports = {
    lobby_set,
    lobby_chat
};