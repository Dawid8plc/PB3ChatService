module.exports = function send(socket, arr, key = null) {
    const msg = key ? [...arr, key] : arr;
    socket.emit("m", msg.join("\t"));
};