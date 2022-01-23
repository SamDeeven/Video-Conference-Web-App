const app = require('express')();
const server = require('http').createServer(app);
const cors = require("cors");
const io = require('socket.io')(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})

app.use(cors());
const PORT = process.env.PORT || 5000;


app.get("/", (req, res) => {
    res.send("Server is running");
})

// Setting socket.io  --> data transmission
//Connecting to socket
io.on("connection", (socket) => {
    //emiting self socket id --> "me"
    //gives my id
    socket.emit("me", socket.id);

    //if disconnects, then sending a message "call-ended"
    socket.on("disconnect", () => {
        socket.broadcast.emit("call-ended");
    })

    //calling user, if that happens, it calls a function
    socket.on("call-user", ({ userToCall, signalData, from, name }) => {
        // passing data of the user
        io.to(userToCall).emit("call-user", { signal: signalData, from, name })
    })

    //answering call
    socket.on("answer-call", (data) => {
        io.to(data.to).emit("call-accepted", data.signal)
    })
})

server.listen(PORT, () => {
    console.log(`Server is connected on Port: ${PORT}`)
})