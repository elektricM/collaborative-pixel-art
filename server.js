// server.js
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');

const initialPixelColor = '#FFFFFF'; // Default color: White
const canvasWidth = 200;
const canvasHeight = 200;
let pixels = new Array(canvasWidth * canvasHeight).fill(initialPixelColor);
let totalPixelsPlaced = 0; // Counter for total pixels placed by everyone

// Function to save the canvas data to a JSON file
function saveCanvasToJSON() {
  const data = JSON.stringify(pixels);
  fs.writeFileSync('canvas_data.json', data, 'utf8', (err) => {
    if (err) {
      console.error('Error saving canvas data:', err);
    }
  });
}

// Function to load the canvas data from the JSON file
function loadCanvasFromJSON() {
  try {
    if (fs.existsSync('canvas_data.json')) {
      const data = fs.readFileSync('canvas_data.json', 'utf8');
      pixels = JSON.parse(data);
      totalPixelsPlaced = pixels.filter(color => color !== initialPixelColor).length;
    } else {
      // If the file does not exist, create a new one with default pixel data
      saveCanvasToJSON();
    }
  } catch (err) {
    console.error('Error loading canvas data:', err);
  }
}

app.use(express.static(__dirname + '/public'));

io.on('connection', (socket) => {
  // Send the initial pixel data to the connected client
  socket.emit('initPixels', pixels);

  // Send the total pixels count to the connected client
  socket.emit('totalPixelsCount', totalPixelsPlaced);

  socket.on('placePixel', (index, color) => {
    // Update the pixel color in the array
    pixels[index] = color;
    // Broadcast the updated pixel color to all clients
    io.emit('updatePixel', index, color);

    // Increment the total pixels counter when a pixel is placed
    totalPixelsPlaced++;
    // Broadcast the updated total count to all clients
    io.emit('totalPixelsCount', totalPixelsPlaced);

    // Save the updated canvas data to the JSON file
    saveCanvasToJSON();
  });
});

http.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
  // Load the canvas data from the JSON file when the server starts
  loadCanvasFromJSON();
});
