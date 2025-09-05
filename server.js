const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const port = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer((req, res) => {
  if (req.url === "/" || req.url === "/client.html") {
    // Serve the client.html file
    const filePath = path.join(__dirname, "client.html");
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end("Error loading client.html");
      } else {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(data);
      }
    });
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

// WebSocket server
const wss = new WebSocket.Server({ server });

wss.on("connection", (socket) => {
  console.log("New player connected");
  socket.send("Welcome to the multiplayer server!");

  socket.on("message", (message) => {
    console.log("Received:", message.toString());
    // Broadcast to all clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });

  socket.on("close", () => console.log("Player disconnected"));
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
