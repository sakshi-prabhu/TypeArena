const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

// 🔥 GLOBAL ERROR HANDLER (IMPORTANT)
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

// ----------------------
// CORS
// ----------------------
app.use(cors({
  origin: true,
  credentials: true
}));

// ----------------------
// HEALTH ROUTE
// ----------------------
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// ----------------------
// SERVER
// ----------------------
const server = http.createServer(app);

// ----------------------
// SOCKET.IO
// ----------------------
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ----------------------
// ROOMS
// ----------------------
const rooms = {};

// ----------------------
// SAFE SOCKET HANDLER
// ----------------------
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  try {

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

      const text = "typing game test text";
      rooms[roomId].text = text;

      io.to(roomId).emit("battle-start", text);
    });

  } catch (err) {
    console.error("Socket Error:", err);
  }

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
  });
});

// ----------------------
// PORT (🔥 IMPORTANT)
// ----------------------
const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});