import express from "express";
import cors from "cors";

const app = express();

// ===== CORS SETUP =====
// This is your admin / player app URL:
const FRONTEND_ORIGIN = "https://vivid-aquamarine-5q2zz8qag5.edgeone.app";

// Allow that origin (and handle preflight)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Also fine to keep cors() for safety
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
  })
);

app.use(express.json());

// ===== GAME STATE =====
const ROWS = 10;
const COLS = 10;

// 0 = empty, 1 = hit, 2 = sunk, 3 = miss
function createEmptyBoard() {
  return {
    cellStates: Array.from({ length: ROWS }, () => Array(COLS).fill(0)),
    sunkShips: [],
  };
}

let gameState = createEmptyBoard();

// ===== ROUTES =====

// Get full board state
app.get("/state", (req, res) => {
  res.json({ success: true, gameState });
});

// Record a shot
app.post("/shot", (req, res) => {
  const { row, col, result } = req.body;

  if (
    typeof row !== "number" ||
    typeof col !== "number" ||
    row < 0 ||
    row >= ROWS ||
    col < 0 ||
    col >= COLS
  ) {
    return res.status(400).json({ success: false, message: "Invalid coords" });
  }

  const resultMap = {
    hit: 1,
    sunk: 2,
    miss: 3,
  };

  const value = resultMap[result];
  if (!value) {
    return res.status(400).json({ success: false, message: "Invalid result" });
  }

  // Update cell with the correct value
  gameState.cellStates[row][col] = value;

  // Track sunk ships (optional, but kept for completeness)
  if (result === "sunk") {
    if (!gameState.sunkShips.some((s) => s.row === row && s.col === col)) {
      gameState.sunkShips.push({ row, col });
    }
  }

  return res.json({ success: true, gameState });
});

// Reset whole board
app.post("/reset", (req, res) => {
  gameState = createEmptyBoard();
  res.json({ success: true, gameState });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SW2 Battleships backend listening on port ${PORT}`);
});
