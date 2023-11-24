// script.js
const socket = io();

let yourPixelsPlaced = 0; // Counter for pixels placed by you

// Function to set a cookie
function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "expires=" + date.toUTCString();
  document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

// Function to get a cookie
function getCookie(name) {
  const cookieName = name + "=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');
  for (let i = 0; i < cookieArray.length; i++) {
    let cookie = cookieArray[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1);
    }
    if (cookie.indexOf(cookieName) === 0) {
      return cookie.substring(cookieName.length, cookie.length);
    }
  }
  return "";
}

const colorOptions = document.querySelectorAll('.color-option');
let currentColor = '#000000'; // Default: Black

// Set the current color when a color option is clicked
colorOptions.forEach(option => {
  option.addEventListener('click', () => {
    currentColor = option.style.backgroundColor;
    // Remove the 'selected' class from all color options
    colorOptions.forEach(opt => opt.classList.remove('selected'));
    // Add the 'selected' class to the clicked color option
    option.classList.add('selected');
  });
});

// Update the current color of the pixel and place it on the canvas
function placePixel(index, color) {
  socket.emit('placePixel', index, color);
}

// Create the canvas
const canvasDiv = document.getElementById('canvas');
const canvasWidth = 100;
const canvasHeight = 100;

function createCanvas() {
  for (let i = 0; i < canvasWidth * canvasHeight; i++) {
    const pixel = document.createElement('div');
    pixel.classList.add('pixel');
    canvasDiv.appendChild(pixel);
  }
}

// Update a pixel on the canvas
function updatePixel(index, color) {
  const pixel = document.getElementsByClassName('pixel')[index];
  pixel.style.backgroundColor = color;
}

// Function to update the pixel count display
function updatePixelCount() {
  const pixelCountElement = document.getElementById('pixel-count');
  pixelCountElement.textContent = `Total Pixels: ${totalPixelsPlaced}, Your Pixels: ${yourPixelsPlaced}`;
}

// Retrieve yourPixelsPlaced value from the cookie
const savedPixelCount = parseInt(getCookie('yourPixelsPlaced'));
if (!isNaN(savedPixelCount)) {
  yourPixelsPlaced = savedPixelCount;
}

// Handle initial pixel data from the server
socket.on('initPixels', (pixels) => {
  for (let i = 0; i < pixels.length; i++) {
    updatePixel(i, pixels[i]);
  }
});

// Handle pixel placement from the client
canvasDiv.addEventListener('click', (event) => {
  if (event.target.classList.contains('pixel')) {
    const index = Array.prototype.indexOf.call(canvasDiv.children, event.target);
    updatePixel(index, currentColor);
    placePixel(index, currentColor);

    // Increment yourPixelsPlaced when you place a pixel
    yourPixelsPlaced++;
    updatePixelCount();
    // Save yourPixelsPlaced value to the cookie
    setCookie('yourPixelsPlaced', yourPixelsPlaced, 365); // Cookie expires in 365 days
  }
});

// Handle updates from other clients
socket.on('updatePixel', (index, color) => {
  updatePixel(index, color);
});

// Receive the total pixels count from the server
socket.on('totalPixelsCount', (count) => {
  totalPixelsPlaced = count;
  updatePixelCount();
});

createCanvas();
updatePixelCount(); // Call to initialize the pixel count display
