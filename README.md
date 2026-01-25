# Collaborative Pixel Art

A real-time collaborative pixel art canvas inspired by [r/place](https://www.reddit.com/r/place/). Multiple users can draw together on a shared 200×200 canvas without login — just open and start creating!

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## Features

- 🎨 **Real-time collaboration** — See other users' changes instantly via WebSockets
- 🖼️ **200×200 pixel canvas** — 40,000 pixels of creative space
- 🎯 **21 color palette** — Carefully selected colors for pixel art
- 💾 **Persistent canvas** — Your art is saved and survives server restarts
- 📱 **Responsive design** — Works on desktop and mobile
- 🌙 **Dark mode** — Automatic dark theme support
- 🚀 **No login required** — Just open and draw

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/elektricM/collaborative-pixel-art.git
cd collaborative-pixel-art

# Install dependencies
npm install

# Start the server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Development

```bash
# Start with auto-reload (Node.js 18+)
npm run dev

# Run linter
npm run lint
```

## Configuration

The server can be configured via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `CORS_ORIGIN` | `*` | CORS allowed origins |

## API

### Health Check

```
GET /health
```

Returns server status, canvas dimensions, and connected clients.

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `initPixels` | Server → Client | Initial canvas state (array of hex colors) |
| `canvasConfig` | Server → Client | Canvas dimensions |
| `totalPixelsCount` | Server → Client | Total non-white pixels on canvas |
| `placePixel` | Client → Server | Place a pixel (index, color) |
| `updatePixel` | Server → Client | Broadcast pixel update |
| `error` | Server → Client | Error message |

## Project Structure

```
collaborative-pixel-art/
├── server.js           # Express + Socket.IO server
├── public/
│   ├── index.html      # Main HTML page
│   ├── script.js       # Client-side JavaScript
│   └── styles.css      # Styling
├── data/               # Canvas data (auto-created, git-ignored)
│   └── canvas_data.json
├── package.json
└── README.md
```

## How It Works

1. **Server** runs Express with Socket.IO for real-time WebSocket communication
2. **Canvas state** is stored in memory and persisted to `data/canvas_data.json`
3. **Clients** connect via WebSocket and receive the full canvas on join
4. **Pixel placements** are broadcast to all connected clients instantly
5. **Rate limiting** prevents spam (50ms minimum between placements per user)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Author

Made with ❤️ by Dolez M.

---

*Inspired by Reddit's r/place experiment*
