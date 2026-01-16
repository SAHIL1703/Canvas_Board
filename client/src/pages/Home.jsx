import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import toast, { Toaster } from "react-hot-toast";
import { FiPlus, FiLogIn, FiClock, FiArrowRight } from "react-icons/fi";

const Home = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");
  const [recentRooms, setRecentRooms] = useState([]);

  useEffect(() => {
    // Load recent rooms from local storage
    const storedRooms = JSON.parse(localStorage.getItem("recent_rooms") || "[]");
    setRecentRooms(storedRooms);
  }, []);

  const createRoom = () => {
    const newId = uuidv4();
    saveToRecent(newId);
    navigate(`/room/${newId}`);
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (!roomId.trim()) {
      toast.error("Please enter a valid Room ID");
      return;
    }
    saveToRecent(roomId);
    navigate(`/room/${roomId}`);
  };

  const saveToRecent = (id) => {
    const existing = JSON.parse(localStorage.getItem("recent_rooms") || "[]");
    // Filter out duplicates and keep top 5
    const updated = [
      { id, date: new Date().toLocaleDateString() },
      ...existing.filter((r) => r.id !== id),
    ].slice(0, 5);
    localStorage.setItem("recent_rooms", JSON.stringify(updated));
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800 font-sans overflow-hidden">
      <Toaster position="top-center" />

      {/* Background Grid Animation */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
             backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
             backgroundSize: '40px 40px',
        }}
      />

      {/* Main Container */}
      <div className="z-10 w-full max-w-lg px-6">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30 text-white">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">CollabBoard</h1>
          <p className="text-gray-500 text-lg">Real-time collaboration without the friction.</p>
        </div>

        {/* Action Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          
          {/* Create New Button */}
          <button 
            onClick={createRoom}
            className="group w-full flex items-center justify-between p-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl transition-all shadow-lg shadow-blue-600/20 mb-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
                <FiPlus size={24} />
              </div>
              <div className="text-left">
                <div className="font-bold text-lg">New Whiteboard</div>
                <div className="text-blue-100 text-sm">Create a fresh space</div>
              </div>
            </div>
            <FiArrowRight size={20} className="opacity-60 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Divider */}
          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-semibold uppercase tracking-wider">Or join existing</span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>

          {/* Join Input */}
          <form onSubmit={joinRoom} className="flex gap-2">
            <input 
              type="text" 
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter Room ID..." 
              className="flex-1 px-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-500 rounded-xl outline-none transition-all font-mono text-sm text-gray-600"
            />
            <button type="submit" className="px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-medium transition-colors shadow-lg">
              Join
            </button>
          </form>
        </div>

        {/* Recent Rooms List */}
        {recentRooms.length > 0 && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 text-gray-400 text-sm font-semibold uppercase tracking-wider mb-4 px-2">
              <FiClock /> Recent Boards
            </div>
            <div className="space-y-2">
              {recentRooms.map((room) => (
                <div 
                  key={room.id}
                  onClick={() => {
                    saveToRecent(room.id); // Update timestamp/order
                    navigate(`/room/${room.id}`);
                  }}
                  className="group flex items-center justify-between p-4 bg-white hover:bg-blue-50 border border-gray-100 hover:border-blue-200 rounded-2xl cursor-pointer transition-all shadow-sm hover:shadow-md"
                >
                  <div className="flex flex-col">
                    <span className="font-mono text-sm text-gray-600 group-hover:text-blue-600 font-medium">#{room.id.slice(0, 8)}...</span>
                    <span className="text-xs text-gray-400">Opened on {room.date}</span>
                  </div>
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 group-hover:bg-blue-100 text-gray-400 group-hover:text-blue-600 transition-colors">
                    <FiLogIn size={14} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Footer Info */}
        <p className="text-center text-gray-400 text-sm mt-12">
          No sign-up required. Secure & Private.
        </p>

      </div>
    </div>
  );
};

export default Home;