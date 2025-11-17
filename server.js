// server.js – SW2 Battleships backend (Render friendly)

import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

// Allow JSON bodies + CORS for all routes/methods
app.use(cors());
app.use(express.json());

const ROWS = 10;
const COLS = 10;

// 0 = hidden, 1 = miss, 2 = hit, 3 = sunk
function createEmptyState() {
  return {
    cellStates: Array.from({ length: ROWS }, () =>
      Array(COLS).fill(0)
    ),
    sunkShips: [] // kept for compatibility, not strictly needed
  };
}

let gameState = createEmptyState();

// --- ROUTES ---

// Simple root check
app.get("/", (req, res) => {
  res.send("SW2 Battleships Backend Running");
});

// Get the current board state
app.get("/state", (req, res) => {
  res.json(gameState);
});

// Record a shot from the admin board
app.post("/shot", (req, res) => {
  try {
    let { row, col, result } = req.body || {};

    // Coerce row/col to integers
    row = Number(row);
    col = Number(col);
    result = (result || "").toString().toLowerCase();

    if (
      !Number.isInteger(row) ||
      !Number.isInteger(col) ||
      row < 0 ||
      row >= ROWS ||
      col < 0 ||
      col >= COLS
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid coordinates" });
    }

    let stateValue;
    if (result === "miss") stateValue = 1;
    else if (result === "hit") stateValue = 2;
    else if (result === "sunk") stateValue = 3;
    else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid result" });
    }

    // Update the cell in the shared game state
    gameState.cellStates[row][col] = stateValue;

    return res.json({ success: true, gameState });
  } catch (err) {
    console.error("Error in /shot:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
});

// Reset the whole board
app.post("/reset", (req, res) => {
  gameState = createEmptyState();
  res.json({ success: true, gameState });
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`SW2 Battleships backend listening on port ${PORT}`);
});
