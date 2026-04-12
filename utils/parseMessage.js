module.exports = function parseMessage(msg) {
    const parts = msg.split("\t");
    const cmd = parts[0];

    let key = null;
    if (parts.length > 1 && !isNaN(parts[parts.length - 1])) {
        key = parts.pop();
    }

    return { cmd, parts, key };
};