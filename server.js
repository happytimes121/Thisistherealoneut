// server.js
const http = require("http");
const WebSocket = require("ws");

// Railway provides the port via environment variable
const port = process.env.PORT || 3000;

// Create a basic HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("WebSocket server running\n");
});

// Attach WebSocket server to HTTP server
const wss = new WebSocket.Server({ server });

// Handle new connections
wss.on("connection", (socket) => {
  console.log("New player connected");

  // Send welcome message to the new client
  socket.send("Welcome to the multiplayer server!");

  // Listen for messages from clients
  socket.on("message", (message) => {
    console.log("Received:", message.toString());

    // Broadcast the message to all connected clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });

  // Handle client disconnect
  socket.on("close", () => {
    console.log("Player disconnected");
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
