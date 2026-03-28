const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

// ✅ Allow all (for now)
app.use(cors({
  origin: "*"
}));

app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

const server = http.createServer(app);

// ✅ Socket.io
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// ----------------------
// 🔥 WORD POOL (BIG LIST)
// ----------------------
const wordPool = [
  "time","people","world","life","day","night","year","work","system","data",
  "code","logic","array","string","function","variable","object","value",
  "input","output","event","render","update","component","state","hook",
  "react","node","express","socket","server","client","network","latency",
  "speed","typing","keyboard","practice","focus","accuracy","skill",
  "improve","learn","challenge","battle","competition","player","winner",
  "random","generate","text","words","display","screen","monitor","task",
  "goal","result","performance","fast","slow","efficient","optimize",
  "debug","error","fix","build","project","design","frontend","backend",
  "database","query","index","memory","cache","process","thread","loop",
  "condition","true","false","start","end","progress","level","score",
  "rank","match","game","play","round","timer","clock","second","minute"
];

// ----------------------
// 🔥 TEXT GENERATOR (120 WORDS)
// ----------------------
function generateText(wordCount = 120) {
  let result = [];

  for (let i = 0; i < wordCount; i++) {
    let word;

    // ❌ avoid consecutive repeat
    do {
      word = wordPool[Math.floor(Math.random() * wordPool.length)];
    } while (result[result.length - 1] === word);

    result.push(word);
  }

  return result.join(" ");
}

// ----------------------
// ROOMS
// ----------------------
const rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // CREATE ROOM
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
    socket.emit("room-created", roomId);
    io.to(roomId).emit("room-update", rooms[roomId]);
  });

  // JOIN ROOM
  socket.on("join-room", (roomId) => {
    if (!rooms[roomId]) return;

    rooms[roomId].guest = socket.id;
    socket.join(roomId);

    io.to(roomId).emit("room-update", rooms[roomId]);
  });

  // READY
  socket.on("ready", ({ roomId, role }) => {
    if (!rooms[roomId]) return;

    if (role === "host") rooms[roomId].hostReady = true;
    if (role === "guest") rooms[roomId].guestReady = true;

    io.to(roomId).emit("room-update", rooms[roomId]);
  });

  // 🔥 START BATTLE (FIXED)
  socket.on("start", (roomId) => {
    if (!rooms[roomId]) return;

    const text = generateText(120); // ✅ BIG TEXT
    rooms[roomId].text = text;

    io.to(roomId).emit("battle-start", text);
  });

  // PROGRESS
  socket.on("progress", ({ roomId, progress }) => {
    socket.to(roomId).emit("opponent-progress", progress);
  });

  // FINISH
  socket.on("finish", ({ roomId, wpm }) => {
    socket.to(roomId).emit("opponent-finished", wpm);
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
  });
});

// ----------------------
// SERVER START
// ----------------------
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});