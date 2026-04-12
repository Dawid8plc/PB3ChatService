const matchesById = new Map();
const pendingMatches = new Map();

const pendingJoinRequests = new Map();

function createMatch(userData, data) {
    const matchUID = Math.floor(Math.random() * 1e9);

    let info = data.information_for_host;

    if (typeof info === "string") {
        try {
            info = JSON.parse(info);
        } catch {
            info = {};
        }
    }

    const hostPassword = info.password?.trim();

    const matchObj = {
        initiator: userData.socket,
        match_uid: matchUID,
        ...data,
        matchDetails: {},
        has_password: hostPassword ? '1' : ''
    };

    userData.match_uid_initiator = matchUID;

    matchesById.set(matchUID, matchObj);
    pendingMatches.set(userData.userId, matchObj);

    return matchObj;
}

function deleteMatch(userData) {
    if (userData.match_uid_initiator !== -1) {
        pendingMatches.delete(userData.userId);
        matchesById.delete(userData.match_uid_initiator);
        userData.match_uid_initiator = -1;
    }
}

function getPendingMatchByUser(userData) {
    return pendingMatches.get(userData.userId);
}

function getMatch(match_uid) {
    return matchesById.get(match_uid);
}

function registerHost(userData) {
    const matchObj = pendingMatches.get(userData.userId);
    if (!matchObj) return null;

    const host_instance_key = Math.floor(Math.random() * 1e6);

    matchObj.host_instance_key = host_instance_key;

    return {
        match_uid: matchObj.match_uid,
        settings: matchObj.information_for_host,
        host_instance_key
    };
}

function setMatchDetails(userData, parts) {
    const matchObj = pendingMatches.get(userData.userId);
    if (!matchObj) return null;

    const newInfo = {};

    for (let i = 3; i < parts.length; i += 2) {
        const key = parts[i];
        const value = parts[i + 1];
        newInfo[key] = value;
    }

    let existingInfo = {};

    try {
        existingInfo = typeof matchObj.matchDetails === "string"
            ? JSON.parse(matchObj.matchDetails)
            : matchObj.matchDetails || {};
    } catch {
        existingInfo = {};
    }

    matchObj.matchDetails = {
        ...existingInfo,
        ...newInfo
    };

    return matchObj.matchDetails;
}

function cleanupUserMatch(userData) {
    if (userData.match_uid_initiator !== -1) {
        userData.match_uid = -1;
        pendingMatches.delete(userData.userId);
        matchesById.delete(userData.match_uid_initiator);
        userData.match_uid_initiator = -1;
    }
}

function listMatches(getUserBySocket) {
    const matches = [];

    for (let match of pendingMatches.values()) {
        const hostUserData = getUserBySocket(match.initiator);

        if (!hostUserData) continue;

        const details = match.matchDetails || {};

        matches.push({
            uid: match.match_uid,
            ping: match.my_max_ping_to_host || 999,
            players_now: details.players_now ?? 0,
            tags: details.tags || "",
            real_user_counter: details.players_now ?? 0,
            players_max: details.players_max ?? 0,
            map_user_data_uid: details.map_user_data_uid,
            game_mode: details.game_mode,
            host_location: match.expected_location || "unknown",
            mode_title: details.mode_title || "Unknown Mode",
            initiator_user_uid: hostUserData.userId,
            host_user_uid: hostUserData.userId,
            title: details.title,
            password: match.has_password
        });
    }

    return matches;
}

function requestJoin(userData, socket, match_uid, match_password) {
    if (match_uid === -1) {
        userData.match_uid = -1;

        if (userData.match_uid_initiator !== -1) {
            pendingMatches.delete(userData.userId);
            matchesById.delete(userData.match_uid_initiator);
            userData.match_uid_initiator = -1;
        }

        return { type: "left" };
    }

    const match = matchesById.get(match_uid);
    if (!match) {
        return { error: "Match not found" };
    }

    let info = match.information_for_host;

    if (typeof info === "string") {
        try {
            info = JSON.parse(info);
        } catch {
            info = {};
        }
    }

    const hostPassword = info.password?.trim();
    const clientPassword = (match_password || "").trim();

    if (hostPassword && clientPassword !== hostPassword) {
        return { error: "Bad password" };
    }

    userData.match_uid = match_uid;

    return {
        type: "join_request",
        match,
    };
}

function createJoinRequest(match_uid, playerSocket, hostSocket) {
    pendingJoinRequests.set(match_uid, {
        playerSocket,
        hostSocket,
        createdAt: Date.now()
    });
}

function handleJoinResponse(match_uid, connection_uid, data) {
    const req = pendingJoinRequests.get(match_uid);
    if (!req) return null;

    let response_struct;

    if (data.accept) {
        response_struct = {
            accept: true,
            peer: data.peer || "dummy-peer",
            invite_code: data.invite_code || "dummy-code",
            connection_uid: connection_uid
        };
    } else {
        response_struct = {
            reject: true,
            message: "Rejected by host"
        };
    }

    pendingJoinRequests.delete(match_uid);

    return {
        playerSocket: req.playerSocket,
        hostSocket: req.hostSocket,
        match_uid,
        response_struct
    };
}

module.exports = {
    createMatch,
    deleteMatch,
    getMatch,
    getPendingMatchByUser,
    registerHost,
    matchesById,
    pendingMatches,
    setMatchDetails,
    cleanupUserMatch,
    listMatches,
    requestJoin,
    createJoinRequest,
    handleJoinResponse
};