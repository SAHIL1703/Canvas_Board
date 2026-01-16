const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const Room = require("./models/Room");

dotenv.config();
connectDB();

const app = express();
app.use(cors());

const server = http.createServer(app);

// Initialize Socket.io with CORS allowed
const io = new Server(server, {
  cors: {
    origin: "*", // Allow connections from React frontend
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // 1. JOIN ROOM
  socket.on("join-room", async (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);

    try {
      // Find room or create if it doesn't exist
      let room = await Room.findOne({ roomId });
      
      if (!room) {
        room = await Room.create({ roomId, elements: [] });
      }

      // Send the entire drawing history to the new user
      // We send EVERYTHING (even deleted ones) so client can manage its own redo stack if needed
      socket.emit("load-canvas", room.elements);
    } catch (error) {
      console.error("Error loading room:", error);
    }
  });

  // 2. REALTIME DRAWING (Performance Optimized)
  socket.on("draw-element", async ({ roomId, element }) => {
    // 1. Broadcast immediately to others (Optimistic UI)
    socket.to(roomId).emit("element-update", element);

    // 2. Save to Database
    try {
      const room = await Room.findOne({ roomId });
      if (room) {
        // Check if this element ID already exists (editing/moving)
        const existingIndex = room.elements.findIndex((el) => el.id === element.id);
        
        if (existingIndex !== -1) {
          // Update existing
          room.elements[existingIndex] = element;
        } else {
          // Add new
          room.elements.push(element);
        }
        await room.save();
      }
    } catch (error) {
      console.error("Error saving element:", error);
    }
  });

  // 3. CURSOR TRACKING (Bonus Feature)
  socket.on("cursor-move", ({ roomId, userId, userName, x, y }) => {
    // Broadcast cursor position to everyone else in the room
    // We do NOT save this to DB (it's transient)
    socket.to(roomId).emit("cursor-update", { userId, userName, x, y });
  });

  // 4. PER-USER UNDO (The Tricky Part)
  socket.on("undo", async ({ roomId, userId }) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return;

      // Find the LAST element created by THIS user that is NOT deleted
      // We iterate backwards to find the most recent one
      let lastElementIndex = -1;
      
      for (let i = room.elements.length - 1; i >= 0; i--) {
        if (room.elements[i].userId === userId && !room.elements[i].isDeleted) {
          lastElementIndex = i;
          break;
        }
      }

      if (lastElementIndex !== -1) {
        // Mark as deleted (Soft Delete)
        room.elements[lastElementIndex].isDeleted = true;
        await room.save();

        // Broadcast the specific updated element to clients
        // The client will replace its local version with this "deleted" version
        io.to(roomId).emit("element-update", room.elements[lastElementIndex]);
      }
    } catch (error) {
      console.error("Error executing undo:", error);
    }
  });

  // 5. PER-USER REDO (Similar logic)
  socket.on("redo", async ({ roomId, userId }) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return;

      // Find the "oldest" deleted element that comes AFTER the last visible element
      // For simplicity in this assignment: Find the most recently deleted item by this user
      // that we want to bring back.
      let lastDeletedIndex = -1;

      for (let i = room.elements.length - 1; i >= 0; i--) {
        if (room.elements[i].userId === userId && room.elements[i].isDeleted) {
           // We found the most recent deleted item.
           // In a complex app, we'd need a stricter "stack" check, 
           // but for this assignment, this logic suffices.
           lastDeletedIndex = i;
           break;
        }
      }

      if (lastDeletedIndex !== -1) {
        room.elements[lastDeletedIndex].isDeleted = false;
        await room.save();
        io.to(roomId).emit("element-update", room.elements[lastDeletedIndex]);
      }
    } catch (error) {
      console.error("Error executing redo:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});