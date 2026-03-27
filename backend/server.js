const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

// ----------------------
// CORS
// ----------------------
const allowedOrigins = [
  "http://localhost:5173",
  "https://type-arena-puce.vercel.app"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// ----------------------
// HTTP SERVER
// ----------------------
const server = http.createServer(app);

// ----------------------
// SOCKET.IO (🔥 FIX HERE)
// ----------------------
const io = new Server(server, {
  path: "/socket.io/",            // ✅ IMPORTANT
  transports: ["websocket"],      // ✅ FORCE WEBSOCKET
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ----------------------
// ROOMS
// ----------------------
const rooms = {};

// ----------------------
// SOCKET CONNECTION
// ----------------------
io.on("connection", (socket) => {

  console.log("Connected:", socket.id);

  socket.on("create-room", () => {

    const roomId = Math.random().toString(36).substring(2, 8);

    rooms[roomId] = {
      host: socket.id,
      guest: null
    };

    socket.join(roomId);

    socket.emit("room-created", roomId);
  });

});

// ----------------------
// PORT (RAILWAY)
// ----------------------
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});