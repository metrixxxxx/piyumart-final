// server.js
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  global.io = io; // accessible in all API routes

  io.on("connection", (socket) => {
    console.log("🟢 Connected:", socket.id);
    socket.onAny((event, ...args) => {
      console.log("📡 Event emitted:", event, args);
    });
    socket.on("disconnect", () => console.log("🔴 Disconnected:", socket.id));
  });

  httpServer.listen(3000, (err) => {
    if (err) throw err;
    console.log("> Ready on http://localhost:3000");
  });
});