const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  // We store all drawing actions here
  elements: [
    {
      id: { type: String, required: true }, // UUID from frontend
      type: { type: String, required: true }, // 'pencil', 'rect', 'text', 'image'
      
      // Pencil (Freehand) specific
      points: [Number],
      
      // Shapes / Text / Image specific
      x: Number,
      y: Number,
      width: Number,
      height: Number,
      
      // Styling
      strokeColor: String,
      backgroundColor: String,
      strokeWidth: Number,
      
      // Text specific
      text: String,
      
      // Image specific (Base64 string or URL)
      src: String,

      // CRITICAL: For Per-User Undo
      userId: { type: String, required: true },
      
      // CRITICAL: Soft Delete for Undo/Redo
      isDeleted: { type: Boolean, default: false },
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model("Room", RoomSchema);