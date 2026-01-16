import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Stage, Layer, Rect, Path, Circle, Group, Text, Label, Tag, Ellipse, Line, RegularPolygon, Arrow
} from "react-konva";
import { v4 as uuidv4 } from "uuid";
import io from "socket.io-client";
import { getStroke } from "perfect-freehand";
import toast, { Toaster } from "react-hot-toast";

// Icons
import {
  MdPanTool, MdEdit, MdOutlineRectangle, MdOutlineCircle,
  MdUndo, MdRedo, MdShare, MdZoomIn, MdZoomOut,
  MdTimeline, MdStart, MdStarBorder, MdFormatColorFill
} from "react-icons/md";
import { FaLongArrowAltRight } from "react-icons/fa"; // Alternative icon for arrow
import { createElement, getSvgPathFromStroke } from "../utils/elementUtils";

const SOCKET_URL = "http://localhost:5000"; 
const socket = io(SOCKET_URL);

const COLORS = ["#1e1e1e", "#e03131", "#2f9e44", "#1971c2", "#f08c00", "#862e9c"];
const STROKE_WIDTHS = [2, 4, 6];

const Room = () => {
  const { roomId } = useParams();
  
  // --- STATE ---
  const [elements, setElements] = useState([]);
  const [action, setAction] = useState("none");
  const [tool, setTool] = useState("pencil");
  const [color, setColor] = useState(COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState(STROKE_WIDTHS[0]);
  const [fillShape, setFillShape] = useState(false); // New: Toggle Fill
  const [cursors, setCursors] = useState({});
  
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [stageScale, setStageScale] = useState(1);

  const [userId] = useState(() => {
    const stored = localStorage.getItem("canvas_userId");
    if (stored) return stored;
    const newId = uuidv4();
    localStorage.setItem("canvas_userId", newId);
    return newId;
  });
  
  const [myUserName] = useState("User " + Math.floor(Math.random() * 100));
  const isDrawing = useRef(false);
  const stageRef = useRef(null);

  // --- SOCKETS (Keep existing logic) ---
  useEffect(() => {
    socket.emit("join-room", roomId);

    const handleLoadCanvas = (serverElements) => {
      const uniqueMap = new Map();
      serverElements.forEach((el) => uniqueMap.set(el.id, el));
      setElements(Array.from(uniqueMap.values()));
    };

    const handleElementUpdate = (updatedElement) => {
      setElements((prev) => {
        const index = prev.findIndex((el) => el.id === updatedElement.id);
        if (index === -1) {
            if(updatedElement.isDeleted) return prev; 
            return [...prev, updatedElement];
        }
        const copy = [...prev];
        copy[index] = updatedElement;
        return copy;
      });
    };

    const handleCursorUpdate = (cData) => {
      if (cData.userId !== userId) {
        setCursors((prev) => ({ ...prev, [cData.userId]: cData }));
      }
    };

    socket.on("load-canvas", handleLoadCanvas);
    socket.on("element-update", handleElementUpdate);
    socket.on("cursor-update", handleCursorUpdate);

    return () => {
      socket.off("load-canvas");
      socket.off("element-update");
      socket.off("cursor-update");
    };
  }, [roomId, userId]);

  // --- MOUSE LOGIC ---
  const getPointerPos = () => {
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    const x = (pointer.x - stagePos.x) / stageScale;
    const y = (pointer.y - stagePos.y) / stageScale;
    return { x, y };
  };

  const handleMouseDown = () => {
    if (tool === "hand") return;
    isDrawing.current = true;
    setAction("drawing");

    const { x, y } = getPointerPos();
    const id = uuidv4();

    // Determine fill color based on toggle
    const fillStyle = fillShape ? `${color}40` : "transparent"; // 40 = 25% opacity hex

    const newElement = createElement(id, x, y, x, y, tool, {
      strokeColor: color,
      strokeWidth,
      userId,
      fillStyle
    });

    setElements((prev) => [...prev, newElement]);
  };

  const handleMouseMove = () => {
    const { x, y } = getPointerPos();
    socket.emit("cursor-move", { roomId, userId, userName: myUserName, x, y });

    if (action === "drawing" && isDrawing.current) {
      const index = elements.length - 1;
      const element = { ...elements[index] };

      if (tool === "pencil") {
        element.points = [...element.points, { x, y }];
      } else if (tool === "line" || tool === "arrow") {
        element.x2 = x;
        element.y2 = y;
      } else {
        // Shapes (Rect, Ellipse, Star)
        element.width = x - element.x;
        element.height = y - element.y;
      }

      const elementsCopy = [...elements];
      elementsCopy[index] = element;
      setElements(elementsCopy);
      socket.emit("draw-element", { roomId, element });
    }
  };

  const handleMouseUp = () => {
    if (action === "drawing") {
      const lastElement = elements[elements.length - 1];
      if (lastElement) {
        socket.emit("draw-element", { roomId, element: lastElement });
      }
    }
    isDrawing.current = false;
    setAction("none");
  };

  // --- ZOOM & PAN (Keep existing logic) ---
  const handleWheel = (e) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const stage = stageRef.current;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    if (newScale < 0.1 || newScale > 10) return;
    setStageScale(newScale);
    setStagePos({ x: pointer.x - mousePointTo.x * newScale, y: pointer.y - mousePointTo.y * newScale });
  };

  const undo = () => socket.emit("undo", { roomId, userId });
  const redo = () => socket.emit("redo", { roomId, userId });
  const handleCopyLink = () => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); };

  // --- RENDERERS ---
  const FreehandShape = ({ element }) => {
    if (!element.points || element.points.length < 2) return null;
    const pairs = element.points.map((p) => [p.x, p.y]);
    const stroke = getStroke(pairs, { size: element.strokeWidth * 1.5, thinning: 0.5, smoothing: 0.5 });
    return <Path data={getSvgPathFromStroke(stroke)} fill={element.strokeColor} />;
  };

  return (
    <div className="relative w-screen h-screen bg-gray-50 overflow-hidden text-gray-800 font-sans selection:bg-none">
      <Toaster position="top-center" />
      
      {/* Grid Background */}
      <div className="absolute inset-0 pointer-events-none opacity-10"
        style={{
             backgroundImage: 'radial-gradient(#444 1px, transparent 1px)',
             backgroundSize: `${20 * stageScale}px ${20 * stageScale}px`,
             backgroundPosition: `${stagePos.x}px ${stagePos.y}px`,
        }}
      />

      {/* --- FLOATING TOOLBAR --- */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 p-2 bg-white rounded-2xl shadow-xl border border-gray-100">
          <ToolButton icon={MdPanTool} active={tool === "hand"} onClick={() => setTool("hand")} tooltip="Hand" />
          <div className="w-px h-6 bg-gray-200 mx-1" />
          
          <ToolButton icon={MdEdit} active={tool === "pencil"} onClick={() => setTool("pencil")} tooltip="Pencil" />
          <ToolButton icon={MdTimeline} active={tool === "line"} onClick={() => setTool("line")} tooltip="Line" />
          <ToolButton icon={FaLongArrowAltRight} active={tool === "arrow"} onClick={() => setTool("arrow")} tooltip="Arrow" />
          <ToolButton icon={MdOutlineRectangle} active={tool === "rect"} onClick={() => setTool("rect")} tooltip="Rectangle" />
          <ToolButton icon={MdOutlineCircle} active={tool === "ellipse"} onClick={() => setTool("ellipse")} tooltip="Ellipse" />
          <ToolButton icon={MdStarBorder} active={tool === "star"} onClick={() => setTool("star")} tooltip="Star" />

          <div className="w-px h-6 bg-gray-200 mx-1" />
          <ToolButton icon={MdUndo} onClick={undo} tooltip="Undo" />
          <ToolButton icon={MdRedo} onClick={redo} tooltip="Redo" />
        </div>

        {/* Properties Dock */}
        {tool !== "hand" && (
          <div className="flex items-center gap-4 px-4 py-2 bg-white/90 backdrop-blur rounded-full shadow-lg border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Colors */}
            <div className="flex items-center gap-2">
                {COLORS.map(c => (
                    <button key={c} onClick={() => setColor(c)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                    />
                ))}
            </div>
            <div className="w-px h-5 bg-gray-300" />
            
            {/* Stroke Widths */}
            <div className="flex items-center gap-2">
                {STROKE_WIDTHS.map(w => (
                     <button key={w} onClick={() => setStrokeWidth(w)}
                        className={`p-1.5 rounded-lg hover:bg-gray-100 transition-colors ${strokeWidth === w ? 'bg-gray-100' : ''}`}>
                        <div className="bg-gray-800 rounded-full" style={{ width: w * 2, height: w * 2 }} />
                     </button>
                ))}
            </div>
            
            {/* Only show Fill Option for closed shapes */}
            {["rect", "ellipse", "star"].includes(tool) && (
               <>
                 <div className="w-px h-5 bg-gray-300" />
                 <button onClick={() => setFillShape(!fillShape)} 
                   className={`p-2 rounded-lg transition-colors ${fillShape ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:bg-gray-100"}`}>
                    <MdFormatColorFill size={18} />
                 </button>
               </>
            )}
          </div>
        )}
      </div>

      {/* --- SHARE & ZOOM UI (Same as before) --- */}
      <div className="fixed top-6 right-6 z-30 flex items-center gap-3">
        <button onClick={handleCopyLink} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg font-medium">
          <MdShare /> Share
        </button>
      </div>
      <div className="fixed bottom-6 left-6 z-30 flex items-center gap-2 bg-white p-1.5 rounded-lg shadow-lg border border-gray-100">
         <button onClick={() => setStageScale(s => Math.max(s/1.2, 0.1))} className="p-2 hover:bg-gray-100 text-gray-600"><MdZoomOut size={20}/></button>
         <span className="text-xs font-mono w-12 text-center text-gray-500">{Math.round(stageScale * 100)}%</span>
         <button onClick={() => setStageScale(s => Math.min(s*1.2, 10))} className="p-2 hover:bg-gray-100 text-gray-600"><MdZoomIn size={20}/></button>
      </div>

      <Stage
        ref={stageRef} width={window.innerWidth} height={window.innerHeight}
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onWheel={handleWheel}
        draggable={tool === "hand"} x={stagePos.x} y={stagePos.y} scaleX={stageScale} scaleY={stageScale}
        onDragEnd={(e) => setStagePos({ x: e.target.x(), y: e.target.y() })}
        style={{ cursor: tool === "hand" ? "grab" : "crosshair" }}
      >
        <Layer>
          {elements.map((el) => {
            if (el.isDeleted) return null;

            if (el.type === "pencil") return <FreehandShape key={el.id} element={el} />;
            
            if (el.type === "line") {
              return <Line key={el.id} points={[el.x1, el.y1, el.x2, el.y2]} stroke={el.strokeColor} strokeWidth={el.strokeWidth} lineCap="round" lineJoin="round" />;
            }

            if (el.type === "arrow") {
               return <Arrow key={el.id} points={[el.x1, el.y1, el.x2, el.y2]} stroke={el.strokeColor} strokeWidth={el.strokeWidth} fill={el.strokeColor} pointerLength={10} pointerWidth={10} />;
            }

            if (el.type === "rect") {
              return <Rect key={el.id} x={el.x} y={el.y} width={el.width} height={el.height} stroke={el.strokeColor} strokeWidth={el.strokeWidth} fill={el.fillStyle} cornerRadius={4} />;
            }
            
            if (el.type === "ellipse") {
              return <Ellipse key={el.id} x={el.x + el.width/2} y={el.y + el.height/2} radiusX={Math.abs(el.width)/2} radiusY={Math.abs(el.height)/2} stroke={el.strokeColor} strokeWidth={el.strokeWidth} fill={el.fillStyle} />;
            }

            if (el.type === "star") {
               // Calculate radius based on drag distance
               const radius = Math.sqrt(Math.pow(el.width, 2) + Math.pow(el.height, 2)) / 2;
               return <RegularPolygon key={el.id} x={el.x + el.width/2} y={el.y + el.height/2} sides={5} radius={radius} innerRadius={radius / 2} stroke={el.strokeColor} strokeWidth={el.strokeWidth} fill={el.fillStyle} />;
            }

            return null;
          })}
          
          {Object.entries(cursors).map(([cUserId, cursor]) => (
            <Group key={cUserId} x={cursor.x} y={cursor.y}>
              <Path data="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19169L11.7841 12.3673H5.65376Z" fill={COLORS[1]} stroke="white" strokeWidth={1} />
              <Label x={14} y={14} opacity={0.75}><Tag fill={COLORS[1]} cornerRadius={4} /><Text text={cursor.userName || "User"} fill="#fff" padding={4} fontSize={11} /></Label>
            </Group>
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

const ToolButton = ({ icon: Icon, active, onClick, tooltip }) => (
    <div className="group relative">
        <button onClick={onClick} className={`p-3 rounded-xl transition-all duration-200 outline-none ${active ? "bg-blue-50 text-blue-600 shadow-inner" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"}`}>
            <Icon size={22} />
        </button>
        <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 px-2 py-1 text-[10px] text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">{tooltip}</span>
    </div>
);

export default Room;