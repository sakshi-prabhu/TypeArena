import { io } from "socket.io-client";

// Determine backend URL based on environment
const getBackendURL = () => {
  if (import.meta.env.MODE === 'development') {
    return 'http://localhost:5000';
  }
  return import.meta.env.VITE_BACKEND_URL || 'https://typearena-production.up.railway.app';
};

export const socket = io(getBackendURL(), {
  transports: ["websocket", "polling"],
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

// Debug logs
socket.on("connect", () => {
  console.log("✅ Connected:", socket.id);
});

socket.on("connect_error", (err) => {
  console.log("❌ Error:", err.message);
});