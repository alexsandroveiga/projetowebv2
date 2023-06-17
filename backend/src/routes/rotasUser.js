const express = require("express");
const router = express.Router();
const Usuario = require("../models/User");
const Moeda = require("../models/Moeda");
const jwt = require("jsonwebtoken");
const rabbitmq = require("../rabbitmq");
const bcrypt = require("bcrypt");
const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");
const winston = require("winston");
const { body } = require("express-validator");
const authMiddleware = require("../middleware/authMiddleware");

// Configuração do limite de taxa (Rate Limiting)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 solicitações por IP
});

// Configuração de desaceleração (Slow Down)
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutos
  delayAfter: 100, // após 100 solicitações, começa a atrasar
  delayMs: 500, // cada solicitação atrasada em 500ms
});

// Configuração do logger para registro de segurança
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.File({ filename: "security.log" })],
});

const auth = (req, res, next) => {
  if (req.headers.authorization) {
    try {
      const [, token] = req.headers.authorization.split(' ')
      const isValid = jwt.verify(token, "abobrinha123")
      if (isValid) {
        console.log("Senha correta")
        console.log("a")
        next()
      } else {
        res.status(403).json({
          "error": "Token inválido"
        })
      }
    } catch (error) {
      res.status(403).json({
        "error": "Token inválido"
      })
    }    
  } else {
    res.status(401).json({
      "error": "Token não recebido"
    })
  }
}

module.exports = (io) => {
  // Rota para listar todas as moedas com Redis cache
  router.get("/moedas", authMiddleware, async (req, res) => {
    try {
      const redisClient = req.redisClient;

      // Verifica se os dados estão no cache do Redis
      const reply = await redisClient.get("moedas");

      if (reply) {
        const moedas = JSON.parse(reply);
        res.json(moedas);
      } else {
        const moedas = await Moeda.find();
        redisClient.set("moedas", JSON.stringify(moedas), "EX", 60);
        res.json(moedas);

        // Registro da busca
        logger.info("Busca de moedas realizada");
      }
    } catch (error) {
      logger.error("Erro ao obter as moedas:", error);
      console.error(error);
      res.status(500).json({ mensagem: "Erro ao obter as moedas" });
    }
  });

  // Rota para autenticação
  router.post(
    "/authenticate",
    limiter, // Aplicação do limite de taxa
    speedLimiter, // Aplicação da desaceleração
    [body("email").trim(), body("senha").trim()],
    async (req, res) => {
      let { email, senha } = req.body;

      // Remover caracteres indesejados do email e senha
      email = email.replace(/[^\w@.-]/g, "");
      senha = senha.replace(/[^\w]/g, "");

      console.log("Email sanitizado:", email);
      console.log("Senha sanitizada:", senha);

      try {
        const user = await Usuario.findOne({ email: email });

        if (user) {
          const match = await bcrypt.compare(senha, user.senha);
          if (match) {
            const token = jwt.sign({ id: user._id }, "abobrinha123", {
              expiresIn: 3600
            });
            res.status(200).json({ token });
          } else {
            logger.error("Erro de autenticação: E-mail ou senha incorretos");
            res.status(401).json({ mensagem: "E-mail ou senha incorretos" });
          }
        } else {
          logger.error("Erro de autenticação: E-mail ou senha incorretos");
          res.status(401).json({ mensagem: "E-mail ou senha incorretos" });
        }
      } catch (error) {
        logger.error("Erro ao realizar a autenticação:", error);
        console.error(error);
        res.status(500).json({ mensagem: "Erro ao realizar a autenticação" });
      }
    }
  );

  router.post(
    "/users",
    limiter, // Aplicação do limite de taxa
    speedLimiter, // Aplicação da desaceleração
    [body("email").trim(), body("senha").trim()],
    async (req, res) => {
      const { email, senha } = req.body;

      try {
        // Gerar o hash da senha
        const hashedSenha = await bcrypt.hash(senha, 10);

        const user = new Usuario({ email, senha: hashedSenha });

        await user.save();
        res.status(200).json({ mensagem: "Usuário cadastrado com sucesso" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ mensagem: "Erro ao cadastrar o usuário" });
      }
    }
  );

  // Rota para cadastrar uma moeda
  router.post("/moedas", async (req, res, next) => {
    const { nome, alta, baixa } = req.body;
    console.log("Token recebido:", req.headers.authorization);

    const moeda = new Moeda({ nome, alta, baixa });
    try {
      await moeda.save();
      const redisClient = req.redisClient;
      redisClient.del("moedas");

      // Registro da postagem
      logger.info("Moeda cadastrada:", { nome });

      // Emita uma atualização para os clientes conectados
      io.emit("atualizacao", "Nova moeda cadastrada!");

      res.status(200).json({ mensagem: "Moeda cadastrada com sucesso" });

      next(); // Chama o próximo middleware ou rota após a resposta ser enviada
    } catch (err) {
      logger.error("Erro ao cadastrar a moeda:", err);
      console.error(err);
      res.status(500).json({ mensagem: "Erro ao cadastrar a moeda" });
    }
  });

  // Rota para atualizar uma moeda
  router.put("/moedas/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const { nome, alta, baixa } = req.body;

      const moeda = await Moeda.findByIdAndUpdate(
        id,
        { nome, alta, baixa },
        { new: true }
      );

      const redisClient = req.redisClient;
      redisClient.del("moedas");

      // Emita uma atualização para os clientes conectados
      io.emit("atualizacao", "Moeda atualizada!");

      res.status(200).json({ mensagem: "Moeda editada com sucesso", moeda });
    } catch (error) {
      console.error(error);
      res.status(500).json({ mensagem: "Erro ao editar a moeda" });
    }
  });

  // Rota para excluir uma moeda
  router.delete("/moedas/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const moeda = await Moeda.findByIdAndDelete(id);

      if (!moeda) {
        return res.status(404).json({ mensagem: "Moeda não encontrada" });
      }

      const redisClient = req.redisClient;
      redisClient.del("moedas");

      // Registro da exclusão da moeda
      logger.info("Moeda excluída:", { nome: moeda.nome });

      // Emita uma atualização para os clientes conectados
      io.emit("atualizacao", "Moeda excluída!");

      res.status(200).json({ mensagem: "Moeda excluída com sucesso" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ mensagem: "Erro ao excluir a moeda" });
    }
  });

  // Rota para enviar e-mail utilizando RabbitMQ
  router.post("/emailPage", (req, res) => {
    const { destinatario, assunto, conteudo } = req.body;
    const tarefa = { destinatario, assunto, conteudo };

    rabbitmq
      .enviarTarefaParaFila(tarefa)
      .then(() => {
        res.status(200).json({
          message: "Tarefa de envio de e-mail enfileirada com sucesso.",
        });
      })
      .catch((error) => {
        console.error("Erro ao enfileirar a tarefa de envio de e-mail:", error);
        res
          .status(500)
          .json({ error: "Erro ao enfileirar a tarefa de envio de e-mail." });
      });
  });

  return router;
};
