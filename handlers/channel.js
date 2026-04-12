const send = require("../utils/send");
const channelManager = require("../managers/channelManager");

function make_channel({ socket, userData, parts, key }) {
    let channel = channelManager.createChannel();

    send(socket, ["channel_created", channel.id], key)

    console.log("Created text channel: ", channel);
}

function chat({ socket, userData, parts, key }) {
    const channelId = parseInt(parts[1]);
    const message = parts[2];
    const message_counter = parts[3];

    if (!message) {
        console.log("Invalid message");

        send(socket, ["invalid_message"], key);
        return;
    }

    let channel = channelManager.getChannel(channelId);
    if (!channel) {
        console.log("Channel not found:", channelId);

        send(socket, ["channel_not_found"], key)
        return;
    }

    channelManager.touch(channel);

    send(socket, ["chat sent"], key)

    channelManager.broadcast(channelId, socket, message_counter, userData.userId, message)
}

function keep_alive({ socket, userData, parts, key }) {
    const channelId = parseInt(parts[1]);

    let channel = channelManager.getChannel(channelId);

    if (!channel) {
        console.log("Channel not found for keep_alive:", channelId);
        send(socket, ["channel_not_found"], key)
        return;
    }

    channelManager.touch(channel);

    send(socket, ["sure"], key);
}

function subscribe({ socket, userData, parts, key }) {
    const channelId = parseInt(parts[1]);

    let channel = channelManager.getChannel(channelId);
    if (!channel) {
        console.log("Channel not found for subscribe:", channelId);
        send(socket, ["Error:"], key)
        return;
    }

    channelManager.subscribe(channel, socket);

    send(socket, ["subscribed"], key);
}

function unsubscribe({ socket, userData, parts, key }) {
    const channelId = parseInt(parts[1]);

    let channel = channelManager.getChannel(channelId);
    if (!channel) {
        console.log("Channel not found for unsubscribe:", channelId);
        send(socket, ["Error:"], key)
        return;
    }

    channelManager.unsubscribe(channel, socket);

    send(socket, ["unsubscribed"], key);
}

function invite({ socket, userData, parts, key }){
    send(socket, ["success maybe"], key);
}

function uninvite({ socket, userData, parts, key }){
    send(socket, ["success maybe"], key);
}

module.exports = {
    make_channel,
    chat,
    keep_alive,
    subscribe,
    unsubscribe,
    invite,
    uninvite
};