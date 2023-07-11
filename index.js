const http = require("http");
const socketIO = require("socket.io");
// const port = require("./config");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*", // Cambia esto a la URL permitida de tu aplicación cliente
    methods: ["GET", "POST"], // Cambia esto según los métodos que necesites permitir
    credentials: true, // Si necesitas enviar cookies en las solicitudes, establece esto en true
  },
});

const port = process.env.PORT || 3000;
app.use(cors());

app.get("/", (req, res) => {
  const data = [
    { id: 1, name: "Objeto 1" },
    { id: 2, name: "Objeto 2" },
    { id: 3, name: "Objeto 3" },
  ];

  res.json(data);
});

io.on("connection", (socket) => {
  console.log("Un cliente se ha conectado");
  // Enviar mensaje de bienvenida al cliente
  socket.emit("welcome", "¡Bienvenido al servidor Socket.io!");
});

server.listen(port, () => {
  console.log(`API escuchando en el puerto ${port}`);
});
