# AI Coding Assistant Log (PROMPTS.md)

**Project:** Realtime Collaborative Canvas
**Tools Used:** ChatGPT (GPT-4o), GitHub Copilot
**Date:** January 2026

## Session 1: Architecture & Setup

**Prompt:**
> "I need to build a realtime collaborative whiteboard similar to Excalidraw. The tech stack should be MERN (MongoDB, Express, React, Node) with Socket.io for realtime communication. Can you outline a folder structure and the basic server boilerplate to handle socket connections?"

**Result:**
The AI suggested a clean folder structure separating `client` (frontend) and `server` (backend). It provided the basic `index.js` boilerplate for Express and Socket.io, including the CORS configuration needed to allow the frontend to connect.

**Follow-up Prompt:**
> "How do I set up the MongoDB schema to store a room that contains an array of drawing elements? It needs to be persistent so if I refresh, the data is still there."

**Result:**
The AI generated a Mongoose schema named `Room` with a `roomId` string and an `elements` array. It explained how to use `Room.findOne()` to check if a room exists and `Room.create()` to make a new one when a user joins.

## Session 2: The Canvas & Drawing Logic

**Prompt:**
> "I want to use `react-konva` for the canvas. Can you write a React component that allows me to draw freehand lines using the mouse? I also need to handle 'shapes' like rectangles and circles."

**Result:**
The output was a functional React component using Konva's `Stage` and `Layer`. It included `onMouseDown`, `onMouseMove`, and `onMouseUp` handlers to track mouse coordinates and update a state array for freehand lines and shapes.

**Refinement Prompt:**
> "The freehand lines look jagged. I heard about a library called `perfect-freehand`. How do I integrate that with Konva `Path` to make the lines look like smooth ink?"

**Result:**
The AI provided a utility function to convert `perfect-freehand` stroke points into SVG path data. It updated the component to render an SVG `<Path>` instead of a simple `<Line>`, making the strokes look much smoother and more organic.

**Prompt:**
> "Implement a 'zoom and pan' feature for the Konva stage using the mouse wheel and dragging. The canvas should feel infinite."

**Result:**
The solution involved tracking the Stage's `scale` and `position` in the component state. It added a handler for the mouse wheel to calculate the new scale based on the pointer position, creating a "zoom-to-cursor" effect.

## Session 3: Realtime Synchronization

**Prompt:**
> "Now I need to sync this. On the server side, listen for 'draw-element'. When a user draws, broadcast it to everyone else in the `roomId`. On the client side, how do I update the state without overwriting the current user's active drawing?"

**Result:**
The AI wrote the Socket.io backend listeners to receive `draw-element` and broadcast it using `socket.to(roomId).emit`. On the frontend, it implemented a socket listener that updates the local elements array only if the incoming element ID doesn't match the current user's active drawing.

**Prompt:**
> "I want to see other users' cursors. How do I track mouse movement on the client, emit it to the socket, and render a custom cursor with the user's name on other clients?"

**Result:**
The AI added a `mousemove` event that emits the user's X/Y coordinates and username to the server. It then added a rendering loop in the React component to display small cursor icons and labels for every other connected user in the room.

## Session 4: Complex Logic (Undo/Redo)

**Prompt:**
> "I need a specific Undo/Redo behavior. If User A draws a circle, and User B draws a line, and then User A hits 'Undo', it should ONLY remove User A's circle. It must not touch User B's line. How do I implement this 'scoped' undo/redo logic in the Backend?"

**Result:**
The AI explained that a simple history stack wouldn't work for multiplayer and suggested a "soft delete" approach. It modified the logic to filter elements by `userId` to find the last action performed specifically by the user requesting the undo.

**Refinement Prompt:**
> "Instead of actually deleting the data from the array, can we just mark it as `isDeleted: true`? That way Redo is easier to implement. Please update the Mongoose update logic to handle this."

**Result:**
The AI updated the Mongoose query to use `$set` to toggle an `isDeleted` flag instead of removing the document. It also updated the frontend render logic to simply ignore/hide any elements where `isDeleted` is true.

## Session 5: UI/UX Polish

**Prompt:**
> "I need a professional-looking floating toolbar for the canvas using Tailwind CSS. It should have icons for Pen, Line, Rect, Ellipse, Undo, Redo, and Share. Use `react-icons`. Also, create a landing page where I can create a new room (generating a UUID) or join an existing one."

**Result:**
The output was a clean, floating UI component styled with Tailwind classes like `fixed`, `z-50`, and `shadow-lg`. It also provided a `Home.js` component with a simple form to enter a Room ID or generate a new UUID for a fresh session.

**Prompt:**
> "Add a 'toast' notification system using `react-hot-toast` for when a user copies the room URL."

**Result:**
The AI integrated `react-hot-toast` into the main app layout. It added a small function to the "Share" button that copies the URL to the clipboard and immediately triggers a `toast.success("Link copied!")` alert.
