/**
 * Collaborative Pixel Art Server
 * A real-time multiplayer pixel canvas inspired by r/place
 */

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  port: process.env.PORT || 3000,
  canvasWidth: 200,
  canvasHeight: 200,
  initialPixelColor: '#FFFFFF',
  dataDir: path.join(__dirname, 'data'),
  canvasFile: 'canvas_data.json',
  saveDebounceMs: 1000,
  rateLimitMs: 50, // Minimum time between pixel placements per user
};

// Derived values
const CANVAS_SIZE = CONFIG.canvasWidth * CONFIG.canvasHeight;
const CANVAS_PATH = path.join(CONFIG.dataDir, CONFIG.canvasFile);

// Validation helpers
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

/**
 * Validates a pixel index
 * @param {number} index - The pixel index to validate
 * @returns {boolean} True if valid
 */
function isValidIndex(index) {
  return Number.isInteger(index) && index >= 0 && index < CANVAS_SIZE;
}

/**
 * Validates a hex color string
 * @param {string} color - The color to validate
 * @returns {boolean} True if valid hex color
 */
function isValidColor(color) {
  return typeof color === 'string' && HEX_COLOR_REGEX.test(color);
}

/**
 * Normalizes a color to uppercase hex format
 * @param {string} color - The color to normalize
 * @returns {string} Normalized color
 */
function normalizeColor(color) {
  return color.toUpperCase();
}

// Canvas state
let pixels = new Array(CANVAS_SIZE).fill(CONFIG.initialPixelColor);
let totalPixelsPlaced = 0;
let saveTimeout = null;

// Rate limiting map: socketId -> lastPlacementTime
const rateLimitMap = new Map();

/**
 * Ensures the data directory exists
 */
function ensureDataDir() {
  if (!fs.existsSync(CONFIG.dataDir)) {
    fs.mkdirSync(CONFIG.dataDir, { recursive: true });
    console.log(`Created data directory: ${CONFIG.dataDir}`);
  }
}

/**
 * Saves the canvas data to JSON file (debounced)
 */
function saveCanvasDebounced() {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  saveTimeout = setTimeout(async () => {
    try {
      await fs.promises.writeFile(CANVAS_PATH, JSON.stringify(pixels), 'utf8');
      console.log('Canvas saved to disk');
    } catch (err) {
      console.error('Error saving canvas data:', err);
    }
  }, CONFIG.saveDebounceMs);
}

/**
 * Loads the canvas data from the JSON file
 * @returns {boolean} True if loaded successfully
 */
function loadCanvas() {
  ensureDataDir();
  
  try {
    if (fs.existsSync(CANVAS_PATH)) {
      const data = fs.readFileSync(CANVAS_PATH, 'utf8');
      const loadedPixels = JSON.parse(data);
      
      // Validate loaded data
      if (Array.isArray(loadedPixels) && loadedPixels.length === CANVAS_SIZE) {
        pixels = loadedPixels;
        totalPixelsPlaced = pixels.filter(color => color !== CONFIG.initialPixelColor).length;
        console.log(`Loaded canvas with ${totalPixelsPlaced} non-white pixels`);
        return true;
      } else {
        console.warn('Invalid canvas data format, using fresh canvas');
      }
    }
  } catch (err) {
    console.error('Error loading canvas data:', err);
  }
  
  // Initialize with fresh canvas
  pixels = new Array(CANVAS_SIZE).fill(CONFIG.initialPixelColor);
  totalPixelsPlaced = 0;
  return false;
}

/**
 * Checks rate limit for a socket
 * @param {string} socketId - The socket ID to check
 * @returns {boolean} True if allowed to place pixel
 */
function checkRateLimit(socketId) {
  const now = Date.now();
  const lastPlacement = rateLimitMap.get(socketId) || 0;
  
  if (now - lastPlacement < CONFIG.rateLimitMs) {
    return false;
  }
  
  rateLimitMap.set(socketId, now);
  return true;
}

// Initialize Express app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    canvasSize: `${CONFIG.canvasWidth}x${CONFIG.canvasHeight}`,
    totalPixelsPlaced,
    connectedClients: io.engine.clientsCount,
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  // Send initial canvas state to the connected client
  socket.emit('initPixels', pixels);
  socket.emit('totalPixelsCount', totalPixelsPlaced);
  socket.emit('canvasConfig', {
    width: CONFIG.canvasWidth,
    height: CONFIG.canvasHeight,
  });

  // Handle pixel placement
  socket.on('placePixel', (index, color) => {
    // Validate input
    if (!isValidIndex(index)) {
      socket.emit('error', { message: 'Invalid pixel index' });
      return;
    }
    
    if (!isValidColor(color)) {
      socket.emit('error', { message: 'Invalid color format. Use hex format: #RRGGBB' });
      return;
    }
    
    // Check rate limit
    if (!checkRateLimit(socket.id)) {
      socket.emit('error', { message: 'Too fast! Please wait a moment.' });
      return;
    }
    
    const normalizedColor = normalizeColor(color);
    const previousColor = pixels[index];
    
    // Update the pixel
    pixels[index] = normalizedColor;
    
    // Update counter (only if changing from initial color)
    if (previousColor === CONFIG.initialPixelColor && normalizedColor !== CONFIG.initialPixelColor) {
      totalPixelsPlaced++;
    } else if (previousColor !== CONFIG.initialPixelColor && normalizedColor === CONFIG.initialPixelColor) {
      totalPixelsPlaced--;
    }
    
    // Broadcast updates to all clients
    io.emit('updatePixel', index, normalizedColor);
    io.emit('totalPixelsCount', totalPixelsPlaced);
    
    // Save (debounced)
    saveCanvasDebounced();
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    rateLimitMap.delete(socket.id);
  });
});

// Clean up rate limit map periodically
setInterval(() => {
  const now = Date.now();
  for (const [socketId, lastTime] of rateLimitMap.entries()) {
    if (now - lastTime > 60000) { // Remove entries older than 1 minute
      rateLimitMap.delete(socketId);
    }
  }
}, 60000);

// Start server
loadCanvas();

httpServer.listen(CONFIG.port, () => {
  console.log(`🎨 Collaborative Pixel Art server running at http://localhost:${CONFIG.port}`);
  console.log(`   Canvas size: ${CONFIG.canvasWidth}x${CONFIG.canvasHeight}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  // Save immediately on shutdown
  fs.writeFileSync(CANVAS_PATH, JSON.stringify(pixels), 'utf8');
  console.log('Canvas saved. Goodbye!');
  process.exit(0);
});

module.exports = { app, io, CONFIG };
