const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Room = require("./models/Room");

dotenv.config();
const app = express();
app.use(cors());

// --- MONGODB SETUP ---
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/whiteboard")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  // 1. Join Room
  socket.on("join-room", async (roomId) => {
    socket.join(roomId);
    try {
      let room = await Room.findOne({ roomId });
      if (!room) {
        room = await Room.create({ roomId, elements: [] });
      }
      socket.emit("load-canvas", room.elements);
    } catch (error) {
      console.error(error);
    }
  });

  // 2. Draw / Update Element
  socket.on("draw-element", async ({ roomId, element }) => {
    socket.to(roomId).emit("element-update", element); // Optimistic UI update for others

    try {
      const room = await Room.findOne({ roomId });
      if (!room) return;

      const index = room.elements.findIndex((el) => el.id === element.id);

      if (index !== -1) {
        await Room.updateOne(
          { roomId },
          { $set: { [`elements.${index}`]: element } }
        );
      } else {
        await Room.updateOne({ roomId }, { $push: { elements: element } });
      }
    } catch (error) {
      console.error("Error saving draw:", error);
    }
  });

  // 3. Cursor Movement
  socket.on("cursor-move", ({ roomId, userId, userName, x, y }) => {
    socket.to(roomId).emit("cursor-update", { userId, userName, x, y });
  });

  // 4. UNDO (Scoped to User)
  socket.on("undo", async ({ roomId, userId }) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return;

      let indexToUndo = -1;
      // Find the last active element by this user
      for (let i = room.elements.length - 1; i >= 0; i--) {
        const el = room.elements[i];
        if (el.userId === userId && !el.isDeleted) {
          indexToUndo = i;
          break;
        }
      }

      if (indexToUndo !== -1) {
        await Room.updateOne(
          { roomId },
          {
            $set: {
              [`elements.${indexToUndo}.isDeleted`]: true,
              [`elements.${indexToUndo}.deletedAt`]: Date.now(),
            },
          }
        );
        const updatedElement = { ...room.elements[indexToUndo], isDeleted: true };
        io.to(roomId).emit("element-update", updatedElement);
      }
    } catch (error) {
      console.error("Undo Error:", error);
    }
  });

  // 5. REDO (Scoped to User)
  socket.on("redo", async ({ roomId, userId }) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return;

      let indexToRedo = -1;
      let lastDeletedTime = 0;

      // Find the most recently deleted element by this user
      room.elements.forEach((el, index) => {
        if (el.userId === userId && el.isDeleted && el.deletedAt) {
          if (el.deletedAt > lastDeletedTime) {
            lastDeletedTime = el.deletedAt;
            indexToRedo = index;
          }
        }
      });

      if (indexToRedo !== -1) {
        await Room.updateOne(
          { roomId },
          {
            $set: {
              [`elements.${indexToRedo}.isDeleted`]: false,
              [`elements.${indexToRedo}.deletedAt`]: null,
            },
          }
        );
        const updatedElement = {
          ...room.elements[indexToRedo],
          isDeleted: false,
        };
        io.to(roomId).emit("element-update", updatedElement);
      }
    } catch (error) {
      console.error("Redo Error:", error);
    }
  });

  socket.on("disconnect", () => {
    // console.log("User Disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));