const socketIOServer = require("socket.io").Server;
const http = require("http");

const initSocketServer = (server) => {
    const io = new socketIOServer(server);
    io.on("connection", (socket) => {
        console.log("A user is connected");
        socket.on("notification",(data)=>{
            io.emit("newNotification",data)
        })
        socket.on("disconnect",()=>{
            console.log("A user is disconnected")
        })
    });
};

module.exports = { initSocketServer };
