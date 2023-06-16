const express = require("express");
const router = express.Router();
const Usuario = require("../models/User");
const Moeda = require("../models/Moeda");
const jwt = require("jsonwebtoken");
const gerarToken = require("../services/gerarToken");
const rabbitmq = require("../rabbitmq");
const bcrypt = require("bcrypt");

module.exports = (io) => {
  // io.on("connection", (socket) => {
  //   console.log("Novo cliente conectado");

  //   socket.on("atualizacao", (mensagem) => {
  //     console.log("Cliente recebeu uma atualização:", mensagem);
  //   });

  //   socket.on("disconnect", () => {
  //     console.log("Cliente desconectado");
  //   });
  // });

  // Rota para listar todas as moedas com Redis cache
  router.get("/moedas", async (req, res) => {
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
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ mensagem: "Erro ao obter as moedas" });
    }
  });
  // Rota para gerar um token
  router.get("/token", (req, res) => {
    const token = gerarToken();
    res.json({ token });
  });

  // Rota para autenticação
  router.post("/authenticate", async (req, res) => {
    const { email, senha } = req.body;
    try {
      const user = await Usuario.findOne({ email: email });
      if (user) {
        const match = await bcrypt.compare(senha, user.senha);
        if (match) {
<<<<<<< HEAD
          const token = jwt.sign({ id: user._id }, "abobrinha123", {
=======
          const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
>>>>>>> 4756e88716ead5137e1bfc99e6a31baad03a02a4
            expiresIn: "1h",
          });
          res.status(200).json({ token });
        } else {
          res.status(401).json({ mensagem: "E-mail ou senha incorretos" });
        }
      } else {
        res.status(401).json({ mensagem: "E-mail ou senha incorretos" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ mensagem: "Erro ao realizar a autenticação" });
    }
  });

  router.post("/users", async (req, res) => {
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
  });

  // Rota para cadastrar uma moeda
  router.post("/moedas", async (req, res) => {
    const { nome, alta, baixa } = req.body;

    const moeda = new Moeda({ nome, alta, baixa });
    try {
      await moeda.save();
      const redis = req.redisClient;
      redis.del("moedas");

      // Emita uma atualização para os clientes conectados
      io.emit("atualizacao", "Nova moeda cadastrada!");

      res.status(200).json({ mensagem: "Moeda cadastrada com sucesso" });
    } catch (err) {
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

      const redis = req.redisClient;
      redis.del("moedas");

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
      await Moeda.findByIdAndDelete(id);

      const redis = req.redisClient;
      redis.del("moedas");

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