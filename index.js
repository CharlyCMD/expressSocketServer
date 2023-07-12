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

const updateBoard = ({ index, turn, winner, board }) => {
  if (board[index] || winner) {
    return false;
  }
  board[index] = turn;
  return {
    updatedBoard: board,
    isValidSelection: true,
  };
};

const newHandleUpdateBoard = ({ roomName, index, turn, winner, room }) => {
  const { updatedBoard, isValidSelection } = updateBoard({
    index,
    turn,
    winner,
    board: room.board,
  });
  if (isValidSelection) {
    room.player1.activeTurn = !room.player1.activeTurn;
    room.player2.activeTurn = !room.player2.activeTurn;
    room.board = updatedBoard;
    rooms.set(roomName, room);
    room.player1.socket.emit("changingTurns", {
      turnState: room.player1.activeTurn,
      board: room.board,
    });
    room.player2.socket.emit("changingTurns", {
      turnState: room.player2.activeTurn,
      board: room.board,
    });
  }
};

const rooms = new Map(); // Mapa para almacenar los rooms y sus jugadores

io.on("connection", (socket) => {
  socket.emit("welcome", "¡Bienvenido al servidor Socket.io! Lluvia");
  socket.on("joinRoom", (roomName) => {
    const primerRoom = rooms.get(roomName);
    if (typeof primerRoom === "undefined") {
      socket.join(roomName);
      rooms.set(roomName, {
        player1: {
          socket,
          activeTurn: true,
          turn: "🦖",
          playerType: "player1",
        },
        player2: null,
        board: Array(9).fill(null),
      });
      const room = rooms.get(roomName);
      socket.emit("roomJoined", {
        success: true,
        message: `Te has unido al room exitosamente`,
        roomName,
        turn: room.player1.turn,
        activeTurn: room.player1.activeTurn,
        board: room.board,
        playerType: room.player1.playerType,
      });
    } else if (
      typeof primerRoom !== "undefined" &&
      primerRoom.player2 === null
    ) {
      socket.join(roomName);
      primerRoom.player2 = {
        socket,
        activeTurn: false,
        turn: "🎸",
        playerType: "player2",
      };
      rooms.set(roomName, primerRoom);
      socket.emit("roomJoined", {
        success: true,
        message: `Te has unido al room exitosamente`,
        roomName,
        turn: primerRoom.player2.turn,
        activeTurn: primerRoom.player2.activeTurn,
        board: primerRoom.board,
        playerType: primerRoom.player2.playerType,
      });
    } else {
      socket.emit(
        "message",
        "El room está lleno. Por favor, intenta más tarde."
      );

      // socket.disconnect(true);
    }
  });

  socket.on("leaveRoom", ({ currentRoom }) => {
    const primerRoom = rooms.get(currentRoom);
    if (primerRoom) {
      primerRoom?.player1?.socket?.emit("clearGame", "limpiando juego");
      primerRoom?.player2?.socket?.emit("clearGame", "limpiando juego");
      rooms.delete(currentRoom);
    }
  });

  socket.on("playerEvent", ({ roomName, turn, index, winner }) => {
    const room = rooms.get(roomName);

    if (room) {
      if (room.player1.socket === socket) {
        newHandleUpdateBoard({
          roomName,
          index,
          turn,
          winner,
          room,
        });
      } else if (room.player2.socket === socket) {
        newHandleUpdateBoard({
          roomName,
          index,
          turn,
          winner,
          room,
        });
      }
    }
  });

  socket.on("resetGame", (roomName) => {
    const room = rooms.get(roomName);
    if (room) {
      room.player1 = {
        socket,
        activeTurn: true,
        turn: "🦖",
        playerType: "player1",
      };
      room.player2 = {
        socket,
        activeTurn: false,
        turn: "🎸",
        playerType: "player2",
      };
      (room.board = Array(9).fill(null)), rooms.set(roomName, room);
      room.player1.emit("changingTurns", {
        turnState: room.player1.activeTurn,
        board: room.board,
      });
      room.player2.emit("changingTurns", {
        turnState: room.player2.activeTurn,
        board: room.board,
      });
    }
  });
});

server.listen(port, () => {
  console.log(`API escuchando en el puerto ${port}`);
});
