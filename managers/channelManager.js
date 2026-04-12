const send = require("../utils/send");

const textChannels = new Map();
let channelIdCounter = 0;

const CHANNEL_TTL = 5 * 60 * 1000;

function createChannel() {
    const channel = {
        id: channelIdCounter++,
        members: [],
        lastActivity: Date.now()
    };

    textChannels.set(channel.id, channel);
    return channel;
}

function getChannel(id) {
    return textChannels.get(id);
}

function subscribe(channel, socket) {
    if (!channel) return null;

    if (!channel.members.includes(socket)) {
        channel.members.push(socket);
    }

    channel.lastActivity = Date.now();
    return channel;
}

function unsubscribe(channel, socket) {
    if (!channel) return;

    channel.members = channel.members.filter(s => s !== socket);
    channel.lastActivity = Date.now();
}

function touch(channel) {
    if (channel) channel.lastActivity = Date.now();
}

function cleanup() {
    const now = Date.now();

    for (const [id, channel] of textChannels.entries()) {
        const isOld = now - channel.lastActivity > CHANNEL_TTL;

        if (isOld) {
            console.log("Deleting inactive channel:", id);
            textChannels.delete(id);
        }
    }
}

function removeSocketFromAll(socket) {
    for (const channel of textChannels.values()) {
        channel.members = channel.members.filter(s => s !== socket);
    }
}

function broadcast(channelId, socket, message_counter, userId, message)
{
    const channel = textChannels.get(channelId);
    if (!channel) return null;
    
    for (let memberSocket of channel.members) {
        if (memberSocket !== socket) {
            const chatMessage = [
                "chat",
                channelId,
                message_counter,
                userId,
                message,
            ];

            send(memberSocket, chatMessage);
        }
    }
}

module.exports = {
    createChannel,
    getChannel,
    subscribe,
    unsubscribe,
    touch,
    cleanup,
    removeSocketFromAll,
    broadcast
};