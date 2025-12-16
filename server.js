const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000; // Use a higher port number

app.use(cors());
app.use(express.json());

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Simple file-based storage
const COUNTER_FILE = path.join(__dirname, 'counter.json');

// Initialize counter file if it doesn't exist
async function initializeCounter() {
  try {
    await fs.access(COUNTER_FILE);
  } catch (error) {
    // File doesn't exist, create it
    await fs.writeFile(COUNTER_FILE, JSON.stringify({ count: 0, lastUpdated: new Date().toISOString() }));
    console.log('Counter file initialized');
  }
}

// Get current count
app.get('/api/counter', async (req, res) => {
  try {
    const data = await fs.readFile(COUNTER_FILE, 'utf8');
    const counter = JSON.parse(data);
    res.json(counter);
  } catch (error) {
    console.error('Error reading counter:', error);
    res.json({ count: 0, lastUpdated: new Date().toISOString() });
  }
});

// Also handle without /api prefix for Plesk routing
app.get('/counter', async (req, res) => {
  try {
    const data = await fs.readFile(COUNTER_FILE, 'utf8');
    const counter = JSON.parse(data);
    res.json(counter);
  } catch (error) {
    console.error('Error reading counter:', error);
    res.json({ count: 0, lastUpdated: new Date().toISOString() });
  }
});

// Increment counter
app.post('/api/counter/increment', async (req, res) => {
  try {
    const { playerId } = req.body; // Get player ID from request body
    
    let data;
    try {
      data = await fs.readFile(COUNTER_FILE, 'utf8');
    } catch {
      data = '{"count": 0, "players": {}}';
    }
    
    const counter = JSON.parse(data);
    counter.count += 1;
    counter.lastUpdated = new Date().toISOString();
    
    // Track individual player contributions
    if (!counter.players) {
      counter.players = {};
    }
    
    if (playerId) {
      counter.players[playerId] = (counter.players[playerId] || 0) + 1;
    }
    
    await fs.writeFile(COUNTER_FILE, JSON.stringify(counter, null, 2));
    console.log(`Counter incremented to: ${counter.count}${playerId ? ` (Player ${playerId}: ${counter.players[playerId]})` : ''}`);
    
    // Return both global and player-specific counts
    res.json({
      count: counter.count,
      lastUpdated: counter.lastUpdated,
      playerCount: playerId ? counter.players[playerId] : 0
    });
  } catch (error) {
    console.error('Error incrementing counter:', error);
    res.status(500).json({ error: 'Failed to increment counter' });
  }
});

// Also handle without /api prefix for Plesk routing
app.post('/counter/increment', async (req, res) => {
  try {
    const { playerId } = req.body; // Get player ID from request body
    
    let data;
    try {
      data = await fs.readFile(COUNTER_FILE, 'utf8');
    } catch {
      data = '{"count": 0, "players": {}}';
    }
    
    const counter = JSON.parse(data);
    counter.count += 1;
    counter.lastUpdated = new Date().toISOString();
    
    // Track individual player contributions
    if (!counter.players) {
      counter.players = {};
    }
    
    if (playerId) {
      counter.players[playerId] = (counter.players[playerId] || 0) + 1;
    }
    
    await fs.writeFile(COUNTER_FILE, JSON.stringify(counter, null, 2));
    console.log(`Counter incremented to: ${counter.count}${playerId ? ` (Player ${playerId}: ${counter.players[playerId]})` : ''}`);
    
    // Return both global and player-specific counts
    res.json({
      count: counter.count,
      lastUpdated: counter.lastUpdated,
      playerCount: playerId ? counter.players[playerId] : 0
    });
  } catch (error) {
    console.error('Error incrementing counter:', error);
    res.status(500).json({ error: 'Failed to increment counter' });
  }
});

// Get player-specific count
app.get('/api/counter/player/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const data = await fs.readFile(COUNTER_FILE, 'utf8');
    const counter = JSON.parse(data);
    
    const playerCount = counter.players && counter.players[playerId] ? counter.players[playerId] : 0;
    
    res.json({
      count: counter.count,
      lastUpdated: counter.lastUpdated,
      playerCount: playerCount,
      playerId: playerId
    });
  } catch (error) {
    console.error('Error reading player counter:', error);
    res.json({ count: 0, lastUpdated: new Date().toISOString(), playerCount: 0, playerId });
  }
});

// Also handle without /api prefix for Plesk routing
app.get('/counter/player/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const data = await fs.readFile(COUNTER_FILE, 'utf8');
    const counter = JSON.parse(data);
    
    const playerCount = counter.players && counter.players[playerId] ? counter.players[playerId] : 0;
    
    res.json({
      count: counter.count,
      lastUpdated: counter.lastUpdated,
      playerCount: playerCount,
      playerId: playerId
    });
  } catch (error) {
    console.error('Error reading player counter:', error);
    res.json({ count: 0, lastUpdated: new Date().toISOString(), playerCount: 0, playerId });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Also handle without /api prefix for Plesk routing
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Debug endpoint to confirm Node.js is handling requests
app.get('/debug', (req, res) => {
  res.json({ 
    message: 'NODE.JS SERVER IS WORKING!', 
    timestamp: new Date().toISOString(),
    server: 'Express.js Pokemon Counter API'
  });
});

// Serve React app for all other routes (must be last!)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Initialize and start server
initializeCounter().then(() => {
  app.listen(PORT, () => {
    console.log(`Pokemon counter server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`Counter API: http://localhost:${PORT}/api/counter`);
    console.log(`Debug endpoint: http://localhost:${PORT}/debug`);
  });
}).catch(error => {
  console.error('Failed to initialize server:', error);
});
