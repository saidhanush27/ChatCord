const path = require('path');
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require("./utils/users");


 


const app = express();
const server = http.createServer(app);
const io = socketio(server);

// set static folder
app.use(express.static(path.join(__dirname, "public")));


const botName = "ChatCord Bot";

// Run when client connects
io.on('connection', (socket) => {
  socket.on('joinRoom', ({ username , room }) =>{
   const user = userJoin(socket.id, username, room);
    socket.join(user.room);


     // Welcome current user
     socket.emit('message', formatMessage(botName,'Welcome to ChatCord!'));

     // Broadcast when a user connects
     socket.broadcast
     .to(user.room)
     .emit('message', formatMessage(botName, `${user.username} has joined the chat`));
 
    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });

  });

   // Listen for chat messages
    socket.on('chat message', (msg) => { 
      const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg)); 
    });

    // Runs when user disconnects
    socket.on('disconnect', () => {
      const user =userLeave(socket.id);

      if (user){
        io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`)
      );
       // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
      }
    });
});

const PORT = process.env.PORT || 3000; // ✅ FIXED PORT ASSIGNMENT

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
