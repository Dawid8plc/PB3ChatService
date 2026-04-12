const lobbys = new Map();

function initLobbies() {
    lobbys.set("_g-s", { name: "Global chat lobby", players: [] });
    lobbys.set("us-s", { name: "US English chat lobby", players: [] });
}

function getLobby(id) {
    return lobbys.get(id);
}

function joinLobby(lobbyId, socket) {
    const lobby = lobbys.get(lobbyId);
    if (!lobby) return null;

    if (!lobby.players.includes(socket)) {
        lobby.players.push(socket);
    }

    return lobby;
}

function leaveLobby(lobbyId, socket) {
    const lobby = lobbys.get(lobbyId);
    if (!lobby) return;

    lobby.players = lobby.players.filter(s => s !== socket);
}

function getAll() {
    return lobbys;
}

initLobbies();

module.exports = {
    initLobbies,
    getLobby,
    joinLobby,
    leaveLobby,
    getAll
};