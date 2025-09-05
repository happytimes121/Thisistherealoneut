const WebSocket = require("ws");

const port = process.env.PORT || 3000; // Railway gives you a port
const server = new WebSocket.Server({ port });

console.log(`Server running on port ${port}`);

server.on("connection", (socket) => {
  console.log("New player connected");

  // Send welcome message
  socket.send("Welcome to the multiplayer server!");

  // Handle messages from players
  socket.on("message", (message) => {
    console.log("Received:", message.toString());

    // Broadcast to all players
    server.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });

  socket.on("close", () => {
    console.log("Player disconnected");
  });
});
