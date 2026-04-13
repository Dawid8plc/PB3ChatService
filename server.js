const express = require("express");
const https = require("https");
const { Server } = require("socket.io");
const { readFileSync } = require("fs");

const handleSocket = require("./handleSocket");
const channelManager = require("./managers/channelManager");
const matchManager = require("./managers/matchManager");

const app = express();

const server = https.createServer({
    key: readFileSync("key.pem"),
    cert: readFileSync("cert.pem"),
}, app);

const io = new Server(server, {
    cors: { origin: "*" },
    transports: ["polling", "websocket"]
});

io.on("connection", (socket) => {
    console.log("Client connected");
    handleSocket(socket);
});

server.listen(2346);
console.log("Custom Chat Service server running on port 2346");

setInterval(() => {
    console.log("Running periodic channel and match cleanup...");
    channelManager.cleanup();
    matchManager.cleanup();
}, 5 * 60 * 1000);