const express = require("express");
const router = express.Router();
const Usuario = require("../models/User");
const Moeda = require("../models/Moeda");
const jwt = require("jsonwebtoken");
const gerarToken = require("../services/gerarToken");
const verificarToken = require("../../middleware/authMiddleware");

router.get("/gerar-token", (req, res) => {
  const token = gerarToken();
  res.json({ token });
});

router.post("/authenticate", async (req, res) => {
  const { email, senha } = req.body;
  const data = await Usuario.findOne({ email: email, senha: senha });
  if (data) {
    const token = jwt.sign({ id: data._id }, "secret", { expiresIn: "1h" });
    res.status(200).json({ token }); // Retornando o token no corpo da resposta
  } else {
    res.status(401).json({ mensagem: "E-mail ou senha incorretos" });
  }
});

router.post("/cadastro", async (req, res) => {
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

router.post("/cadastroMoeda", async (req, res) => {
  const { nome, alta, baixa } = req.body;

  const moeda = new Moeda({ nome, alta, baixa });

  try {
    await moeda.save();
    res.status(200).json({ mensagem: "Moeda cadastrada com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensagem: "Erro ao cadastrar a moeda" });
  }
});

router.get("/listarMoeda", async (req, res) => {
  try {
    const moedas = await Moeda.find();
    res.json(moedas);
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao buscar moedas");
  }
});

router.get("/listarMoeda/:nome", verificarToken, async (req, res) => {
  try {
    const nome = req.params.nome;
    const moedas = await Moeda.find({ nome: nome }).exec();
    res.json(moedas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Rota PUT para editar uma moeda existente por ID
router.put("/editarMoeda/:id", async (req, res) => {
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

// Rota DELETE para excluir uma moeda por ID
router.delete("/excluirMoeda/:id", async (req, res) => {
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
