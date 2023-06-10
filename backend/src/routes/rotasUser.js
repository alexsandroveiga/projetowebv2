const express = require("express");
const router = express.Router();
const Usuario = require("../models/User");
const Moeda = require("../models/Moeda");
const jwt = require("jsonwebtoken");
const gerarToken = require("../services/gerarToken");

const redis = require("redis");

// Rota para listar todas as moedas com Redis cache
router.get("/moedas", async (req, res) => {
  const redisClient = redis.createClient({
    host: "localhost",
    port: 6379,
  });

  redisClient.on("error", (err) => {
    console.error("Erro de conexão com o Redis:", err);
  });

  try {
    const moedas = await new Promise((resolve, reject) => {
      // Verifica se os dados estão no cache do Redis
      redisClient.get("moedas", (err, reply) => {
        if (err) {
          console.error(err);
          reject(err);
        } else if (reply) {
          // Se os dados estiverem no cache, retorna a resposta do cache
          const moedas = JSON.parse(reply);
          resolve(moedas);
        } else {
          // Se os dados não estiverem no cache, busca no banco de dados
          Moeda.find()
            .then((moedas) => {
              // Armazena os dados no cache do Redis por 1 minuto (por exemplo)
              redisClient.setex("moedas", 60, JSON.stringify(moedas));
              resolve(moedas);
            })
            .catch((err) => {
              console.error(err);
              reject(err);
            });
        }
      });
    });

    res.json(moedas);
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao buscar moedas");
  } finally {
    redisClient.quit(); // Encerra o cliente Redis somente após a conclusão das operações
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
  const data = await Usuario.findOne({ email: email, senha: senha });
  if (data) {
    const token = jwt.sign({ id: data._id }, "secret", { expiresIn: "1h" });
    res.status(200).json({ token });
  } else {
    res.status(401).json({ mensagem: "E-mail ou senha incorretos" });
  }
});

// Rota para cadastrar um usuário
router.post("/users", async (req, res) => {
  const { email, senha } = req.body;

  const user = new Usuario({ email, senha });

  try {
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
  console.log("Rota de cadastro de moeda acionada");

  const moeda = new Moeda({ nome, alta, baixa });
  try {
    await moeda.save();
    res.status(200).json({ mensagem: "Moeda cadastrada com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensagem: "Erro ao cadastrar a moeda" });
  }
});

// // Rota para listar todas as moedas com Redis cache
// router.get("/moedas", async (req, res) => {
//   try {
//     // Verifica se os dados estão no cache do Redis
//     redisClient.get("moedas", async (err, reply) => {
//       if (err) {
//         console.error(err);
//         res.status(500).send("Erro ao buscar moedas");
//       } else if (reply) {
//         // Se os dados estiverem no cache, retorna a resposta do cache
//         const moedas = JSON.parse(reply);
//         res.json(moedas);
//       } else {
//         // Se os dados não estiverem no cache, busca no banco de dados
//         const moedas = await Moeda.find();

//         // Armazena os dados no cache do Redis por 1 minuto (por exemplo)
//         redisClient.setex("moedas", 60, JSON.stringify(moedas));

//         res.json(moedas);
//       }
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Erro ao buscar moedas");
//   }
// });

// // Rota para buscar uma moeda por nome
// router.get("/moedas/:nome", async (req, res) => {
//   const nome = req.params.nome;

//   // Verifica se a resposta está em cache
//   redisClient.get(nome, async (err, cachedData) => {
//     if (err) {
//       console.error("Erro ao buscar dados em cache:", err);
//     }

//     if (cachedData) {
//       console.log("Dados recuperados do cache");
//       res.json(JSON.parse(cachedData));
//     } else {
//       try {
//         const moedas = await Moeda.find({ nome: nome }).exec();
//         redisClient.setex(nome, 3600, JSON.stringify(moedas)); // Armazena os dados em cache por 1 hora
//         res.json(moedas);
//       } catch (error) {
//         res.status(500).json({ message: error.message });
//       }
//     }
//   });
// });

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

    res.status(200).json({ mensagem: "Moeda excluída com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: "Erro ao excluir a moeda" });
  }
});

module.exports = router;
