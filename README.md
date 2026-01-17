# Realtime Collaborative Canvas

A realtime collaborative whiteboard application (Excalidraw-style) where multiple users can draw, edit shapes, and collaborate in shared rooms without signing in. Built with the **MERN Stack** (MongoDB, Express, React, Node) and **Socket.io**.

## 🚀 Features

- **Infinite Canvas:** Pan and zoom capabilities.
- **Realtime Collaboration:** Instant sync of strokes and cursor positions using Socket.io.
- **Tools:** Pencil (Perfect Freehand), Line, Arrow, Rectangle, Ellipse, Star.
- **Scoped Undo/Redo:** Undo only your own actions without removing others' work.
- **Room Persistence:** Drawings are saved to MongoDB.
- **Shareable:** Generate unique room links to invite others.
- **No Auth:** Instant access.

## 🛠 Tech Stack

**Frontend (Client):**
- **Build Tool:** Vite v7
- **Framework:** React v19
- **Styling:** Tailwind CSS v4
- **Canvas:** React Konva + Perfect Freehand
- **Routing:** React Router v7

**Backend (Server):**
- **Runtime:** Node.js
- **Framework:** Express v5
- **Database:** MongoDB (Mongoose v9)
- **Realtime:** Socket.io

## 📋 Prerequisites

- **Node.js** (v18+ recommended)
- **MongoDB** (Running locally or via Atlas)

---

## ⚙️ Installation & Run Instructions

### 1. Backend Setup (Server)

1. Navigate to the server folder:
   ```bash
   cd server
2. Install dependencies:
    npm install
3. Create a .env file in the server directory:
    PORT=5000
    MONGO_URI=mongodb://127.0.0.1:27017/collaborative-canvas
4. Start the server:
    nodemon index.js

### 2. Frontend Setup (Client)

1. Open a new terminal and navigate to the client folder:
    cd client
2. Install dependencies:
    npm install
3. Start the Vite development server:
    npm run dev
4. Open the application in your browser:
    http://localhost:5173

## Project Structure

```text
/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Room.js     # Main Canvas Logic
│   │   │   └── Home.js     # Landing Page
│   │   ├── utils/
│   │   │   └── elementUtils.js # Helper functions for shapes
│   │   └── App.js
│   └── package.json
├── server/                 # Node Backend
│   ├── models/
│   │   └── Room.js         # Mongoose Schema
│   ├── index.js            # Server Entry point
│   └── package.json
└── README.md

