/**
 * Collaborative Pixel Art - Client Script
 * Handles canvas rendering and real-time updates via Socket.IO
 */

// ============================================================
// Socket Connection
// ============================================================
const socket = io();

// ============================================================
// State
// ============================================================
let currentColor = '#000000'; // Default: Black
let yourPixelsPlaced = 0;
let totalPixelsPlaced = 0;
let canvasConfig = { width: 200, height: 200 };
let isConnected = false;

// ============================================================
// Cookie Utilities
// ============================================================

/**
 * Sets a cookie with the given name, value, and expiration days
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} days - Days until expiration
 */
function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = 'expires=' + date.toUTCString();
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
}

/**
 * Gets a cookie value by name
 * @param {string} name - Cookie name
 * @returns {string} Cookie value or empty string if not found
 */
function getCookie(name) {
  const cookieName = name + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');
  
  for (let cookie of cookieArray) {
    cookie = cookie.trim();
    if (cookie.startsWith(cookieName)) {
      return cookie.substring(cookieName.length);
    }
  }
  return '';
}

// ============================================================
// Color Utilities
// ============================================================

/**
 * Converts RGB color string to hex format
 * @param {string} rgb - RGB string like "rgb(255, 0, 0)"
 * @returns {string} Hex color like "#FF0000"
 */
function rgbToHex(rgb) {
  // If already hex, return as-is (uppercased)
  if (rgb.startsWith('#')) {
    return rgb.toUpperCase();
  }
  
  // Parse RGB format
  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!match) {
    return '#000000'; // Fallback to black
  }
  
  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// ============================================================
// Canvas Management
// ============================================================

const canvasDiv = document.getElementById('canvas');

/**
 * Creates the pixel canvas dynamically
 */
function createCanvas() {
  const totalPixels = canvasConfig.width * canvasConfig.height;
  const fragment = document.createDocumentFragment();
  
  for (let i = 0; i < totalPixels; i++) {
    const pixel = document.createElement('div');
    pixel.classList.add('pixel');
    pixel.dataset.index = i;
    fragment.appendChild(pixel);
  }
  
  canvasDiv.innerHTML = '';
  canvasDiv.appendChild(fragment);
  
  // Update CSS grid
  canvasDiv.style.gridTemplateColumns = `repeat(${canvasConfig.width}, 10px)`;
  canvasDiv.style.gridTemplateRows = `repeat(${canvasConfig.height}, 10px)`;
}

/**
 * Updates a single pixel's color
 * @param {number} index - Pixel index
 * @param {string} color - Hex color
 */
function updatePixel(index, color) {
  const pixels = document.getElementsByClassName('pixel');
  if (pixels[index]) {
    pixels[index].style.backgroundColor = color;
  }
}

/**
 * Sends a pixel placement to the server
 * @param {number} index - Pixel index
 * @param {string} color - Hex color
 */
function placePixel(index, color) {
  socket.emit('placePixel', index, color);
}

// ============================================================
// UI Updates
// ============================================================

/**
 * Updates the pixel count display
 */
function updatePixelCount() {
  const pixelCountElement = document.getElementById('pixel-count');
  if (pixelCountElement) {
    const connectionStatus = isConnected ? '' : ' (Connecting...)';
    pixelCountElement.textContent = `Total Pixels: ${totalPixelsPlaced} | Your Pixels: ${yourPixelsPlaced}${connectionStatus}`;
  }
}

/**
 * Shows an error message to the user
 * @param {string} message - Error message
 */
function showError(message) {
  console.warn('Server error:', message);
  // Could add toast notification here
}

// ============================================================
// Color Selector
// ============================================================

const colorOptions = document.querySelectorAll('.color-option');

colorOptions.forEach(option => {
  option.addEventListener('click', () => {
    // Convert browser's RGB format to hex
    currentColor = rgbToHex(option.style.backgroundColor);
    
    // Update selection UI
    colorOptions.forEach(opt => opt.classList.remove('selected'));
    option.classList.add('selected');
  });
});

// ============================================================
// Canvas Interaction
// ============================================================

canvasDiv.addEventListener('click', (event) => {
  if (!event.target.classList.contains('pixel')) {
    return;
  }
  
  if (!isConnected) {
    showError('Not connected to server. Please wait...');
    return;
  }
  
  const index = parseInt(event.target.dataset.index, 10);
  
  if (isNaN(index)) {
    return;
  }
  
  // Optimistically update UI
  updatePixel(index, currentColor);
  placePixel(index, currentColor);
  
  // Update local counter
  yourPixelsPlaced++;
  updatePixelCount();
  setCookie('yourPixelsPlaced', yourPixelsPlaced, 365);
});

// ============================================================
// Socket Event Handlers
// ============================================================

socket.on('connect', () => {
  console.log('Connected to server');
  isConnected = true;
  updatePixelCount();
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
  isConnected = false;
  updatePixelCount();
});

socket.on('canvasConfig', (config) => {
  canvasConfig = config;
  createCanvas();
});

socket.on('initPixels', (pixels) => {
  console.log(`Received ${pixels.length} pixels`);
  for (let i = 0; i < pixels.length; i++) {
    updatePixel(i, pixels[i]);
  }
});

socket.on('updatePixel', (index, color) => {
  updatePixel(index, color);
});

socket.on('totalPixelsCount', (count) => {
  totalPixelsPlaced = count;
  updatePixelCount();
});

socket.on('error', (data) => {
  showError(data.message);
});

// ============================================================
// Initialization
// ============================================================

// Load saved pixel count from cookie
const savedPixelCount = parseInt(getCookie('yourPixelsPlaced'), 10);
if (!isNaN(savedPixelCount)) {
  yourPixelsPlaced = savedPixelCount;
}

// Create initial canvas (will be recreated when config received)
createCanvas();
updatePixelCount();

// Handle intro animation
document.addEventListener('DOMContentLoaded', () => {
  const intro = document.getElementById('intro');
  if (intro) {
    intro.classList.add('fadeout');
    setTimeout(() => {
      intro.style.display = 'none';
    }, 800);
  }
});
