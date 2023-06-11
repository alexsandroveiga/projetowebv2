const express = require("express");
const app = express();
const conectDatabase = require("./database/db");
const usuarioRouter = require("./routes/rotasUser");
const bodyParser = require("body-parser");
const cors = require("cors");
const redis = require("redis");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configurar o CORS com opções específicas
app.use(
  cors({
    origin: "http://localhost:3000", // Defina a origem permitida do cliente
    credentials: true, // Permitir o envio de cookies de autenticação (se aplicável)
  })
);

let redisClient;

(async () => {
  redisClient = redis.createClient();

  redisClient.on("connect", () => console.log(`Redis Connected`));

  await redisClient.connect();

  redisClient.on("error", (error) => console.error(`Error : ${error}`));
})();

app.use((req, res, next) => {
  req.redisClient = redisClient; // Adiciona o cliente Redis ao objeto `req`
  next();
});

app.use(usuarioRouter);
app.use(express.json());

conectDatabase();

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
