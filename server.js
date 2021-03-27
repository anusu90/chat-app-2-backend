const express = require('express');
const socketio = require("socket.io");
const http = require("http");
require('dotenv').config(path.join(__dirname, ".env"))

const { addUser, removeUser, getUser, getUsersInRoom } = require("./users")

const router = require("./router");
const { Socket } = require('dgram');


const app = express()
const server = http.createServer(app)
const io = socketio(server, {
    cors: {
        origin: "http://localhost:3000",
    }
})

const port = process.env.PORT || 5000
app.use(router)

app.use(function (req, res, next) {
    let allowedOrigin = ["http://localhost:3000", "https://keen-kalam-6de5f7.netlify.app"]
    console.log(allowedOrigin.indexOf(req.headers.origin));
    if (allowedOrigin.indexOf(req.headers.origin) !== -1) {
        res.header("Access-Control-Allow-Origin", req.headers.origin)
    }
    res.setHeader("Access-Control-Allow-Credentials", true);
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Set-Cookie");
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    next();
});



io.on("connection", (socket) => {

    console.log("new user connected", socket.id)

    socket.on("newUser", ({ name, room }, callback) => {
        const { user, error } = addUser({ id: socket.id, name, room });
        if (error) return callback(error);

        socket.emit('message', { user: "admin", text: `Welcome ${user.name} to the room- ${user.room}` })
        socket.broadcast.to(user.room).emit('message', { user: "admin", text: `${user.name} has joined the room- ${user.name}` });
        socket.join(user.room);
        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) })
        callback();
    })

    socket.on("sendMessage", (msg, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit("message", { user: user.name, text: msg })
        callback();

    })

    socket.on("disconnect", (message) => {
        console.log(message)
    })

})



server.listen(port, () => { console.log(`Server started at port: ${port}`) })
