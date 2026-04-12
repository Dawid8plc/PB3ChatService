const send = require("../utils/send");
const matchManager = require("../managers/matchManager");
const userManager = require("../managers/userManager");

function mp_request_new_match({ socket, userData, parts, key }) {

    let info = parts[3];

    if (typeof info === "string") {
        try {
            info = JSON.parse(info);
        } catch {
            info = {};
        }
    }

    if(info.__server_location !== "this_pc")
    {
        send(socket, ["host location not supported, selfhosting only allowed "], key);
        return;
    }

    const match = matchManager.createMatch(userData, {
        host_target: parts[1],
        connection_target: parts[2],
        information_for_host: parts[3],
        my_max_ping_to_host: parts[4],
        expected_location: parts[5]
    });

    send(socket, ["match_requested", match.match_uid], key);
}

function mp_request_host_mode({ socket, userData, parts, key }) {
    send(socket, ["host_mode_set"], key);
}

function mp_get_host_request_queue({ socket, userData, parts, key }) {
    const responseParts = [
        "host_options",
        `${userData.userId}=1=50` // user_uid = myUserUID, host_request_uid = 1, ping = 50
    ];

    console.log("Sent host queue:", responseParts);
    send(socket, responseParts, key)
}

function mp_can_i_host({ socket, userData, parts, key }) {
    const result = matchManager.registerHost(userData);

    if (!result) {
        console.log("No pending match found for user. Cannot host.");
        return;
    }

    const responseParts = [
        "host_match_registered_for_you",
        result.match_uid,
        result.settings,
        result.host_instance_key
    ];

    console.log("Sent self-host match:", responseParts);

    send(socket, responseParts, key);
}

function whois({ socket, userData, parts, key }) {
    const targetUserUID = parts[1];

    const foundUser = userManager.getUserById(targetUserUID);

    if (!foundUser) {
        console.log("User not found for whois:", targetUserUID);
        const responseParts = [
            "whois",
            "user_not_found"
        ];

        send(socket, responseParts, key);
        return;
    }

    const responseParts = [
        "whois",
        foundUser.playerName,
    ];

    console.log("Sent whois response:", responseParts);

    send(socket, responseParts, key);
}

function mp_set_match_details({ socket, userData, parts, key }) {
    console.log("Got mp_set_match_details:", parts);

    const result = matchManager.setMatchDetails(userData, parts);

    if (!result) {
        console.log("No pending match found for user. Cannot set match details.");
        return;
    }

    send(socket, ["ok"], key);
}

function mp_list_matches_v2({ socket, userData, parts, key }) {
    matchManager.cleanupUserMatch(userData);

    let filter;
    try {
        filter = JSON.parse(parts[1]);
    } catch {
        filter = {};
    }

    const matches = matchManager.listMatches(
        (socket) => userManager.getUser(socket)
    );

    const res = [
        "match_list",
        JSON.stringify(matches)
    ];

    send(socket, res, key);

    console.log("Sent match list:", res);
}

function mp_join({ socket, userData, parts, key }) {
    const result = matchManager.requestJoin(
        userData,
        socket,
        parseInt(parts[1]),
        parts[2]
    );

    if (result.type === "left") {
        return send(socket, ["ok"], key);
    }

    if (result.error) {
        return send(socket, ["join_to_match_reject_once", result.error], key);
    }

    const match = result.match;

    matchManager.createJoinRequest(
        match.match_uid,
        socket,
        match.initiator
    );

    send(socket, ["join_to_match_request_sent"], key);

    const joinRequest = [
        "join_to_match_request",
        userData.userId || 0,
        userData.connectionUID,
        match.match_uid,
        userData.playerName,
        userData.skin
    ];

    send(match.initiator, joinRequest);

    console.log("Forwarded join request to host:", joinRequest);
}

function mp_join_response({ socket, userData, parts, key }) {
    const connection_uid = parts[2];
    const match_uid = parseInt(parts[3]);
    const json = parts[4];

    let data;
    try {
        data = JSON.parse(json);
    } catch {
        data = {};
    }

    const result = matchManager.handleJoinResponse(
        match_uid,
        connection_uid,
        data
    );

    if (!result) {
        console.warn("No pending join request");
        return;
    }

    send(result.playerSocket, [
        "join_response",
        result.match_uid,
        JSON.stringify(result.response_struct)
    ]);

    console.log("Sent join_response:", result.response_struct);

    send(result.hostSocket, ["join_response_sent"], key)
}

module.exports = {
    mp_request_new_match,
    mp_request_host_mode,
    mp_get_host_request_queue,
    whois,
    mp_set_match_details,
    mp_list_matches_v2,
    mp_join,
    mp_join_response,
    mp_can_i_host
};