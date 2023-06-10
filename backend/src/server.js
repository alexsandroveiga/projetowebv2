const express = require("express");
const app = express();
const conectDatabase = require("./database/db");
const usuarioRouter = require("./routes/rotasUser");
const bodyParser = require("body-parser");
const cors = require("cors");
const redis = require("redis");
const client = redis.createClient();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configurar o CORS com opções específicas
app.use(
  cors({
    origin: "http://localhost:3000", // Defina a origem permitida do cliente
    credentials: true, // Permitir o envio de cookies de autenticação (se aplicável)
  })
);

app.use(usuarioRouter);
app.use(express.json());

client.on("connect", () => {
  console.log("Conectado ao Redis");
});

client.on("error", (err) => {
  console.error("Erro de conexão com o Redis:", err);
});

app.use((req, res, next) => {
  req.redisClient = client; // Adiciona o cliente Redis ao objeto `req`
  next();
});

conectDatabase();

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
