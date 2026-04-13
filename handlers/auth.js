const send = require("../utils/send");
const userManager = require("../managers/userManager");

let conId = 0;

function auth({ socket, userData, parts, key }) {
    const userId = parts[1];
    const playerName = parts[2];
    const skin = parts[3];

    let connectionUID = conId++;

    const user = {
        userId,
        playerName,
        skin,
        socket,
        match_uid: -1,
        match_uid_initiator: -1,
        connectionUID
    };

    userManager.addUser(socket, user);

    send(socket, ["Authenticated", connectionUID, JSON.stringify([])], key);
}

function update_cache_profile({socket, userData, parts, key})
{
    const userId = parts[1];
    const playerName = parts[2];
    const skin = parts[3];
    let user = userManager.getUser(socket);

    if(user)
    {
        user.playerName = playerName;
        user.skin = skin;
    }
}

module.exports = {
    auth,
    update_cache_profile
};