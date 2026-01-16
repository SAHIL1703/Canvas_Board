import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import Room from "./pages/Room";

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Redirect root to a random room */}
        <Route path="/" element={<Navigate to={`/room/${uuidv4()}`} />} />
        {/* The actual Room component */}
        <Route path="/room/:roomId" element={<Room />} />
      </Routes>
    </Router>
  );
};

export default App;