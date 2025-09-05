const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const port = process.env.PORT || 3000;

// HTTP server to serve client.html
const server = http.createServer((req, res) => {
  if (req.url === "/" || req.url === "/client.html") {
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

// WebSocket server attached to HTTP server
const wss = new WebSocket.Server({ server });

// Broadcast function
function broadcast(message, sender) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client !== sender) {
      client.send(message);
    }
  });
}

// When a client connects
wss.on("connection", (socket) => {
  console.log("New player connected");
  socket.send("Welcome to the multiplayer server!");

  socket.on("message", (message) => {
    console.log("Received:", message.toString());
    // Send message to all other clients
    broadcast(message.toString(), socket);
  });

  socket.on("close", () => console.log("Player disconnected"));
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
