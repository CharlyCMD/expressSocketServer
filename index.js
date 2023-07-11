const express = require("express");
const cors = require("cors");

const app = express();
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

app.listen(port, () => {
  console.log(`API escuchando en el puerto ${port}`);
});
