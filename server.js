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

// In-memory accounts and online tracking
let accounts = {};      // { email: { password, username } }
let onlineUsers = {};   // { socket.id: username }

// Helper: broadcast to all clients
function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

// Generate simple socket IDs
let nextId = 1;

// Handle new connections
wss.on("connection", (socket) => {
  const socketId = nextId++;
  console.log("New connection:", socketId);

  socket.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      console.log("Invalid JSON:", raw);
      return;
    }

    // Handle events
    if (msg.type === "register") {
      const { email, password } = msg;
      if (accounts[email]) {
        socket.send(JSON.stringify({ type: "registerResult", success: false, message: "Email already registered" }));
      } else {
        accounts[email] = { password, username: null };
        socket.send(JSON.stringify({ type: "registerResult", success: true }));
      }
    }

    else if (msg.type === "login") {
      const { email, password } = msg;
      const account = accounts[email];
      if (!account || account.password !== password) {
        socket.send(JSON.stringify({ type: "loginResult", success: false, message: "Invalid credentials" }));
      } else {
        socket.email = email; // attach email to socket
        if (!account.username) {
          socket.send(JSON.stringify({ type: "loginResult", success: true, needsUsername: true }));
        } else {
          onlineUsers[socketId] = account.username;
          broadcast({ type: "updatePlayers", players: Object.values(onlineUsers) });
          socket.send(JSON.stringify({ type: "loginResult", success: true, needsUsername: false, username: account.username }));
        }
      }
    }

    else if (msg.type === "setUsername") {
      const { username } = msg;
      const email = socket.email;
      if (!email || !accounts[email]) return;

      // check if taken
      if (Object.values(accounts).some(acc => acc.username === username)) {
        socket.send(JSON.stringify({ type: "setUsernameResult", success: false, message: "Username taken" }));
        return;
      }

      accounts[email].username = username;
      onlineUsers[socketId] = username;

      broadcast({ type: "updatePlayers", players: Object.values(onlineUsers) });
      socket.send(JSON.stringify({ type: "setUsernameResult", success: true, username }));
    }
  });

  socket.on("close", () => {
    delete onlineUsers[socketId];
    broadcast({ type: "updatePlayers", players: Object.values(onlineUsers) });
    console.log("Disconnected:", socketId);
  });
});

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
