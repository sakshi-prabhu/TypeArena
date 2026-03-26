const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();



const allowedOrigins = [
  "http://localhost:5173",
  "https://type-arena-puce.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST"],
  credentials: true
}));

const server = http.createServer(app);



const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});




const wordList = [
  "time","people","world","life","day",
  "practice","typing","speed","focus","skill",
  "give","fun","which","what","know",
  "learn","improve","keyboard","accuracy","game",
  "the","her","because"
];




function generateText(wordCount = 150) {
  let result = [];

  for (let i = 0; i < wordCount; i++) {
    const randomIndex = Math.floor(Math.random() * wordList.length);
    result.push(wordList[randomIndex]);
  }

  return result.join(" ");
}




const rooms = {};




io.on("connection", (socket) => {

  console.log("User connected:", socket.id);


  socket.on("create-room", () => {

    const roomId = Math.random().toString(36).substring(2, 8);

    rooms[roomId] = {
      host: socket.id,
      guest: null,
      hostReady: false,
      guestReady: false,
      text: ""
    };

    socket.join(roomId);

    console.log("Room created:", roomId);

    socket.emit("room-created", roomId);

    io.to(roomId).emit("room-update", rooms[roomId]);

  });


 

  socket.on("join-room", (roomId) => {

    if (!rooms[roomId]) return;

    rooms[roomId].guest = socket.id;

    socket.join(roomId);

    io.to(roomId).emit("room-update", rooms[roomId]);

  });




  socket.on("ready", ({ roomId, role }) => {

    if (!rooms[roomId]) return;

    if (role === "host") rooms[roomId].hostReady = true;
    if (role === "guest") rooms[roomId].guestReady = true;

    io.to(roomId).emit("room-update", rooms[roomId]);

  });


 

  socket.on("start", (roomId) => {

    if (!rooms[roomId]) return;

    const text = generateText(80);

    rooms[roomId].text = text;

    io.to(roomId).emit("battle-start", text);

  });


  

  socket.on("progress", ({ roomId, progress }) => {

    if (!rooms[roomId]) return;

    socket.to(roomId).emit("opponent-progress", progress);

  });




  socket.on("finish", ({ roomId, wpm }) => {

    if (!rooms[roomId]) return;

    socket.to(roomId).emit("opponent-finished", { wpm });

  });




  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });

});




const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});