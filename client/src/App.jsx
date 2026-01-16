import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Room from "./pages/Room";
import Home from "./pages/Home"; // Import the new Home page

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Root Route -> Landing Page */}
        <Route path="/" element={<Home />} />
        
        {/* Room Route -> Canvas */}
        <Route path="/room/:roomId" element={<Room />} />
      </Routes>
    </Router>
  );
};

export default App;