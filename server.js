import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// ====== GAME STATE (Stored in backend memory) ======
let gameState = {
  cellStates: Array.from({ length: 10 }, () => Array(10).fill(0)),
  sunkShips: [],
};

// ====== SHIP LAYOUT (STATIC — SAME AS FRONTEND) ======
const ships = [
  [[0, 0], [0, 1]],
  [[2, 3], [2, 4]],
  [[5, 7], [5, 8]],
  [[7, 1], [7, 2], [7, 3]],
  [[1, 8], [2, 8], [3, 8]],
  [[1, 0], [2, 0], [3, 0], [4, 0]]
];

// ===== UTIL =====
const checkIfShipSunk = (shipIndex) => {
  return ships[shipIndex].every(([r, c]) => gameState.cellStates[r][c] === 2);
};

// ===== ROUTES =====

// Get full state
app.get("/state", (req, res) => {
  res.json(gameState);
});

// Reveal a cell
app.post("/reveal", (req, res) => {
  const { row, col } = req.body;

  if (gameState.cellStates[row][col] !== 0) {
    return res.json({ message: "Already revealed", gameState });
  }

  const isShip = ships.some(ship =>
    ship.some(([r, c]) => r === row && c === col)
  );

  if (isShip) {
    gameState.cellStates[row][col] = 2; // hit
  } else {
    gameState.cellStates[row][col] = 1; // miss
  }

  ships.forEach((ship, index) => {
    if (!gameState.sunkShips.includes(index)) {
      if (checkIfShipSunk(index)) {
        gameState.sunkShips.push(index);
        ship.forEach(([r, c]) => {
          gameState.cellStates[r][c] = 3;
        });
      }
    }
  });

  res.json({ success: true, gameState });
});

// Reset board
app.post("/reset", (req, res) => {
  gameState = {
    cellStates: Array.from({ length: 10 }, () => Array(10).fill(0)),
    sunkShips: []
  };

  res.json({ success: true, gameState });
});

// Root message
app.get("/", (req, res) => {
  res.send("SW2 Battleships Backend Running");
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
