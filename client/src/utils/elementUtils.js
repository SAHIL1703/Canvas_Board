import { getStroke } from "perfect-freehand";

export const getSvgPathFromStroke = (stroke) => {
  if (!stroke.length) return "";
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y1 + y0) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"]
  );
  d.push("Z");
  return d.join(" ");
};

export const createElement = (id, x1, y1, x2, y2, type, options) => {
  const { strokeColor, strokeWidth, userId, fillStyle } = options;

  const base = {
    id,
    type,
    strokeColor,
    strokeWidth,
    userId,
    fillStyle: fillStyle || "transparent", // New fill property
    isDeleted: false,
    deletedAt: null,
  };

  switch (type) {
    case "pencil":
      return {
        ...base,
        points: [{ x: x1, y: y1 }],
      };
    case "line":
    case "arrow":
      return {
        ...base,
        x1, y1, x2, y2, // Store exact start/end points
      };
    case "rect":
    case "ellipse":
    case "star":
      return {
        ...base,
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        width: Math.abs(x2 - x1),
        height: Math.abs(y2 - y1),
      };
    default:
      return null;
  }
};