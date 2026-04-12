const users = new Map();
const usersById = new Map();

function addUser(socket, data) {
    users.set(socket, data);
    usersById.set(data.userId, data);
}

function removeUser(socket) {
    const user = users.get(socket);
    if (!user) return null;

    users.delete(socket);
    usersById.delete(user.userId);

    return user;
}

function getUser(socket) {
    return users.get(socket);
}

function getUserById(id) {
    return usersById.get(id);
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUserById
};