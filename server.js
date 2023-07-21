// server.js
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const initialPixelColor = '#FFFFFF'; // Default color: White
const canvasWidth = 50;
const canvasHeight = 50;
let pixels = new Array(canvasWidth * canvasHeight).fill(initialPixelColor);
let totalPixelsPlaced = 0; // Counter for total pixels placed by everyone

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
  });
});

// Function to clear the "yourPixelsPlaced" cookie
function clearYourPixelsCookie(res) {
  res.clearCookie('yourPixelsPlaced');
}

http.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});

// Clear "yourPixelsPlaced" cookie when the server starts
app.get('/', (req, res) => {
  clearYourPixelsCookie(res);
  res.sendFile(__dirname + '/public/index.html');
});