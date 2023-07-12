const http = require("http");
const socketIO = require("socket.io");
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
  socket.emit("welcome", "¡Bienvenido al servidor Socket.io! Lluvia");
});

server.listen(port, () => {
  console.log(`API escuchando en el puerto ${port}`);
});

const rooms = new Map(); // Mapa para almacenar los rooms y sus jugadores
let turnPlayer1 = true;
let turnPlayer2 = false;

let board = Array(9).fill(null);

const updateBoard = ({ index, turn, winner }) => {
  if (board[index] || winner) {
    console.log("retornamos aqui porque deberia de ser null");
    return false;
  }
  console.log("continuamos con la ejecucion");
  board[index] = turn;
  return true;
};

const changeTurns = () => {
  console.log("changing turns");
  turnPlayer1 = !turnPlayer1;
  turnPlayer2 = !turnPlayer2;
};

const handleUpdateBoard = ({ index, turn, winner, room }) => {
  const isValidSelection = updateBoard({ index, turn, winner });
  if (isValidSelection) {
    changeTurns();
    room.player1.emit("changingTurns", {
      turnState: turnPlayer1,
      board: board,
    });
    room.player2.emit("changingTurns", {
      turnState: turnPlayer2,
      board: board,
    });
  }
};

io.on("connection", (socket) => {
  socket.emit("welcome", "¡Bienvenido al servidor Socket.io! Lluvia");

  socket.on("joinRoom", (roomName) => {
    socket.join(roomName);
    console.log(`Jugador se unió al room: ${roomName}`);

    const currentRoom = io.sockets.adapter.rooms.get(roomName);
    const numPlayers = currentRoom ? currentRoom.size : 0;
    if (numPlayers === 1) {
      // Primer jugador en unirse al room
      rooms.set(roomName, {
        player1: socket,
        player2: null,
      });

      socket.emit("roomJoined", {
        success: true,
        message: `Te has unido al room exitosamente`,
        turn: "🦖",
        roomName,
        activeTurn: turnPlayer1,
        board,
      });
    } else if (numPlayers === 2) {
      // Segundo jugador en unirse al room
      const room = rooms.get(roomName);
      room.player2 = socket;

      rooms.set(roomName, room);

      socket.emit("roomJoined", {
        success: true,
        message: `Te has unido al room exitosamente`,
        turn: "🎸",
        roomName,
        activeTurn: turnPlayer2,
        board,
      });
      room.player1.emit(
        "message",
        "El segundo jugador ha llegado. Comienza la partida."
      );
    } else {
      // Room lleno
      socket.emit(
        "message",
        "El room está lleno. Por favor, intenta más tarde."
      );
      socket.disconnect(true);
    }
  });

  socket.on("playerEvent", ({ roomName, turn, index, winner }) => {
    const room = rooms.get(roomName);
    console.log("QUE ESTA PASANDO", room, rooms, roomName);

    if (room) {
      if (room.player1 === socket) {
        handleUpdateBoard({ index, turn, winner, room });
      } else if (room.player2 === socket) {
        handleUpdateBoard({ index, turn, winner, room });
      }
    }
  });

  socket.on("resetGame", (roomName) => {
    const room = rooms.get(roomName);
    if (room) {
      turnPlayer1 = true;
      turnPlayer2 = false;
      board = Array(9).fill(null);
      room.player1.emit("changingTurns", {
        turnState: turnPlayer1,
        board: board,
      });
      room.player2.emit("changingTurns", {
        turnState: turnPlayer2,
        board: board,
      });
    }
  });
});

server.listen(port, () => {
  console.log(`API escuchando en el puerto ${port}`);
});
