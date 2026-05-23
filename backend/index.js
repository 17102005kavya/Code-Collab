require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const debounce = require("lodash.debounce");
const { createClient } = require("@supabase/supabase-js");
const { pub, sub } = require("./redis/client");

const app = express();
app.use(cors());
app.use(express.json());

const executeRoutes = require("./routes/execute");
const roomsRoutes = require("./routes/rooms");

app.use("/api/execute", executeRoutes);
app.use("/api/rooms", roomsRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const rawUrl = (process.env.SUPABASE_URL || "").trim();
const supabaseUrl = rawUrl.startsWith("http") ? rawUrl : "https://placeholder.supabase.co";
const supabaseKey = (process.env.SUPABASE_KEY || "placeholder-key").trim();
const supabase = createClient(supabaseUrl, supabaseKey);

const saveToDb = debounce(async (roomId, code) => {
  if (!process.env.SUPABASE_URL) return;
  try {
    await supabase
      .from("rooms")
      .upsert({ room_id: roomId, code, updated_at: new Date() });
  } catch (err) {
    console.error("DB Save Error:", err.message);
  }
}, 3000);

const rooms = {};

// Global Redis subscription handler
sub.on("message", (channel, message) => {
  if (channel.startsWith("room:")) {
    const roomId = channel.split(":")[1];
    const data = JSON.parse(message);
    
    if (data.type === "code-change") {
      // Broadcast to local clients in this room except sender (handled client side via flags)
      // Actually we broadcast to everyone, and client ignores if they sent it
      io.to(roomId).emit("code-update", { code: data.code, senderId: data.senderId });
    } else if (data.type === "cursor-move") {
      io.to(roomId).emit("cursor-update", data);
    }
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", async ({ roomId, username }) => {
    socket.join(roomId);
    
    if (!rooms[roomId]) {
      let initialCode = "// Start coding...\n";
      if (process.env.SUPABASE_URL) {
        try {
          const { data } = await supabase.from("rooms").select("code").eq("room_id", roomId).single();
          if (data && data.code) initialCode = data.code;
        } catch (e) {}
      }
      rooms[roomId] = { code: initialCode, users: [] };
    }
    
    const existingUserIndex = rooms[roomId].users.findIndex(u => u.id === socket.id);
    let user;
    if (existingUserIndex !== -1) {
      user = rooms[roomId].users[existingUserIndex];
      user.username = username || user.username;
    } else {
      const userColor = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"][Math.floor(Math.random() * 5)];
      user = { id: socket.id, username: username || "Anonymous", color: userColor };
      rooms[roomId].users.push(user);
    }

    socket.emit("room-state", { code: rooms[roomId].code, users: rooms[roomId].users });
    
    sub.subscribe(`room:${roomId}`);
    
    socket.to(roomId).emit("user-joined", user);
    io.to(roomId).emit("users-update", rooms[roomId].users);
  });

  socket.on("code-change", ({ roomId, code }) => {
    if (rooms[roomId]) rooms[roomId].code = code;
    pub.publish(`room:${roomId}`, JSON.stringify({ type: "code-change", code, senderId: socket.id }));
    saveToDb(roomId, code);
  });

  socket.on("cursor-move", ({ roomId, position, username }) => {
    pub.publish(`room:${roomId}`, JSON.stringify({
      type: "cursor-move",
      userId: socket.id,
      position,
      username
    }));
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (const roomId in rooms) {
      const room = rooms[roomId];
      const userIndex = room.users.findIndex(u => u.id === socket.id);
      if (userIndex !== -1) {
        room.users.splice(userIndex, 1);
        io.to(roomId).emit("users-update", room.users);
      }
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
