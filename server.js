import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ----- GAME STATE -----
const ROWS = 10;
const COLS = 10;

function createEmptyGameState() {
  return {
    // 0 = empty, 1 = hit, 2 = miss, 3 = ship sunk
    cellStates: Array.from({ length: ROWS }, () => Array(COLS).fill(0)),
    sunkShips: [] // optional extra info if you ever want it
  };
}

let gameState = createEmptyGameState();

// ----- HELPERS -----
function coordLabel(row, col) {
  const colLetter = String.fromCharCode('A'.charCodeAt(0) + col);
  const rowNumber = row + 1;
  return `${colLetter}${rowNumber}`;
}

// ----- ROUTES -----

// Root – simple health check
app.get('/', (req, res) => {
  res.send('SW2 Battleships Backend Running');
});

// Current board state
app.get('/state', (req, res) => {
  res.json({ success: true, gameState });
});

// Record a shot
app.post('/shot', (req, res) => {
  try {
    const { row, col, result } = req.body;

    // Basic validation
    if (
      typeof row !== 'number' ||
      typeof col !== 'number' ||
      row < 0 || row >= ROWS ||
      col < 0 || col >= COLS
    ) {
      return res.status(400).json({ success: false, error: 'Invalid coordinates' });
    }

    // Map result string -> numeric value
    let value;
    if (result === 'hit') {
      value = 1;
    } else if (result === 'miss') {
      value = 2;
    } else if (result === 'sunk') {
      value = 3;
    } else {
      return res.status(400).json({ success: false, error: 'Invalid result type' });
    }

    // Store in cellStates
    gameState.cellStates[row][col] = value;

    // Optionally track sunk ship squares separately
    if (value === 3) {
      const label = coordLabel(row, col);
      if (!gameState.sunkShips.includes(label)) {
        gameState.sunkShips.push(label);
      }
    }

    console.log(`Recorded ${result.toUpperCase()} at ${coordLabel(row, col)}`);

    return res.json({ success: true, gameState });
  } catch (err) {
    console.error('Error in /shot:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Reset board
app.post('/reset', (req, res) => {
  gameState = createEmptyGameState();
  console.log('Board reset');
  res.json({ success: true, gameState });
});

// ----- START SERVER -----
app.listen(PORT, () => {
  console.log(`SW2 Battleships backend listening on port ${PORT}`);
});
