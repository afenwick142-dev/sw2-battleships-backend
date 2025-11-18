// server.js
import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIG ---
const GRID_SIZE = 10;

// Pre-defined ships (0-based row, col):
// 3 × 2-long, 2 × 3-long, 1 × 4-long
const SHIPS = [
  // length 2
  [[0, 1], [0, 2]],
  [[2, 5], [3, 5]],
  [[6, 8], [7, 8]],
  // length 3
  [[4, 0], [5, 0], [6, 0]],
  [[9, 3], [9, 4], [9, 5]],
  // length 4
  [[1, 7], [2, 7], [3, 7], [4, 7]],
];

// --- STATE ---
let gameState = createEmptyGameState();

function createEmptyGameState() {
  return {
    // 0 = empty, 1 = hit, 2 = miss, 3 = ship sunk
    cellStates: Array.from({ length: GRID_SIZE }, () =>
      Array(GRID_SIZE).fill(0)
    ),
    // store indices of sunk ships
    sunkShips: [],
  };
}

// --- HELPERS ---

function findShipAt(row, col) {
  for (let i = 0; i < SHIPS.length; i++) {
    const ship = SHIPS[i];
    for (let j = 0; j < ship.length; j++) {
      const [r, c] = ship[j];
      if (r === row && c === col) {
        return { shipIndex: i, cellIndex: j };
      }
    }
  }
  return null;
}

function isShipSunk(shipIndex) {
  const ship = SHIPS[shipIndex];
  return ship.every(([r, c]) => gameState.cellStates[r][c] === 1);
}

function markShipAsSunk(shipIndex) {
  const ship = SHIPS[shipIndex];
  ship.forEach(([r, c]) => {
    gameState.cellStates[r][c] = 3; // sunk
  });
  if (!gameState.sunkShips.includes(shipIndex)) {
    gameState.sunkShips.push(shipIndex);
  }
}

// --- MIDDLEWARE ---
app.use(cors());           // allow all origins (for your 25 shop displays)
app.use(express.json());   // parse JSON bodies

// --- ROUTES ---

// Get current game state
app.get("/state", (req, res) => {
  res.json({ success: true, gameState });
});

// Reset board (but ships stay in same positions)
app.post("/reset", (req, res) => {
  gameState = createEmptyGameState();
  res.json({ success: true, gameState });
});

// Handle a shot
app.post("/click", (req, res) => {
  try {
    const { row, col } = req.body || {};

    if (
      typeof row !== "number" ||
      typeof col !== "number" ||
      row < 0 ||
      row >= GRID_SIZE ||
      col < 0 ||
      col >= GRID_SIZE
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid coordinates",
      });
    }

    let result = "miss";

    // If this cell was already resolved, just return current state
    const current = gameState.cellStates[row][col];
    if (current === 1 || current === 2 || current === 3) {
      // figure out a friendly message based on current value
      if (current === 2) result = "miss";
      if (current === 1) result = "hit";
      if (current === 3) result = "sunk";

      return res.json({
        success: true,
        result,
        gameState,
      });
    }

    // Work out if this shot hits a ship
    const hitInfo = findShipAt(row, col);

    if (!hitInfo) {
      // MISS
      gameState.cellStates[row][col] = 2;
      result = "miss";
    } else {
      const { shipIndex } = hitInfo;

      // mark as HIT first
      gameState.cellStates[row][col] = 1;

      // check if whole ship is now sunk
      if (isShipSunk(shipIndex)) {
        markShipAsSunk(shipIndex);
        result = "sunk";
      } else {
        result = "hit";
      }
    }

    res.json({
      success: true,
      result,
      gameState,
    });
  } catch (err) {
    console.error("Error in /click:", err);
    res.status(500).json({
      success: false,
      error: "Server error processing shot",
    });
  }
});

// Simple root
app.get("/", (req, res) => {
  res.send("SW2 Battleships Backend Running");
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`SW2 Battleships backend listening on port ${PORT}`);
});
