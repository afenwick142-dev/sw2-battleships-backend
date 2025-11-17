// server.js – SW2 Battleships backend

import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

// Allow JSON bodies + CORS from your EdgeOne site
app.use(cors());
app.use(express.json());

// ----- GAME STATE -----
const ROWS = 10;
const COLS = 10;

function makeEmptyState() {
  return {
    cellStates: Array.from({ length: ROWS }, () => Array(COLS).fill(0)), // 0=empty,1=hit,2=miss,3=sunk
    sunkShips: [],
  };
}

let gameState = makeEmptyState();

// ----- ROUTES -----

// Simple root check
app.get("/", (req, res) => {
  res.send("SW2 Battleships Backend Running");
});

// Get current board
app.get("/state", (req, res) => {
  res.json({ success: true, gameState });
});

// Record a shot
app.post("/shot", (req, res) => {
  const { row, col, result } = req.body || {};

  // Basic validation
  if (
    typeof row !== "number" ||
    typeof col !== "number" ||
    !["hit", "miss", "sunk"].includes(result)
  ) {
    return res
      .status(400)
      .json({ success: false, error: "Invalid payload (row/col/result)." });
  }

  if (
    row < 0 ||
    row >= ROWS ||
    col < 0 ||
    col >= COLS ||
    !gameState.cellStates[row]
  ) {
    return res.status(400).json({ success: false, error: "Out of bounds." });
  }

  let code = 0;
  if (result === "hit") code = 1;
  if (result === "miss") code = 2;
  if (result === "sunk") code = 3;

  gameState.cellStates[row][col] = code;

  if (code === 3) {
    const id = `${row}-${col}`;
    if (!gameState.sunkShips.includes(id)) {
      gameState.sunkShips.push(id);
    }
  }

  return res.json({ success: true, gameState });
});

// Reset the whole board
app.post("/reset", (req, res) => {
  gameState = makeEmptyState();
  return res.json({ success: true, gameState });
});

// ----- START SERVER -----
app.listen(PORT, () => {
  console.log(`SW2 Battleships backend listening on port ${PORT}`);
});
