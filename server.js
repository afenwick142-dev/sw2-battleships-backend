import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// --- GAME CONFIG ---
const ROWS = 10;
const COLS = 10;

// 0 = empty, 1 = hit, 2 = miss, 3 = sunk
let gameState;

// Create a fresh, empty board
function createEmptyState() {
  return {
    cellStates: Array.from({ length: ROWS }, () => Array(COLS).fill(0)),
    sunkShips: [], // optional, for later
  };
}

function resetState() {
  gameState = createEmptyState();
}

resetState();

// --- ROUTES ---

// Simple root message so you know it's alive
app.get("/", (req, res) => {
  res.send("SW2 Battleships Backend Running");
});

// Get current state
app.get("/state", (req, res) => {
  res.json({ success: true, gameState });
});

// Record a shot
app.post("/shot", (req, res) => {
  const { row, col, result } = req.body || {};

  // Validate row/col
  if (
    typeof row !== "number" ||
    typeof col !== "number" ||
    row < 0 ||
    row >= ROWS ||
    col < 0 ||
    col >= COLS
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid row/col" });
  }

  // Validate result
  const normalized = (result || "").toLowerCase();
  const allowed = ["hit", "miss", "sunk"];
  if (!allowed.includes(normalized)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid result" });
  }

  // Map result -> numeric value
  let val = 0;
  if (normalized === "hit") val = 1;
  if (normalized === "miss") val = 2;
  if (normalized === "sunk") val = 3;

  // Update the cell
  gameState.cellStates[row][col] = val;

  // Track sunk squares nicely if you want to
  if (val === 3) {
    const coordLabel = String.fromCharCode(65 + col) + (row + 1);
    if (!gameState.sunkShips.includes(coordLabel)) {
      gameState.sunkShips.push(coordLabel);
    }
  }

  return res.json({ success: true, gameState });
});

// Reset the entire board
app.post("/reset", (req, res) => {
  resetState();
  return res.json({ success: true, gameState });
});

// --- START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SW2 Battleships backend listening on port ${PORT}`);
});
