const jwt = require("jsonwebtoken");

const gerarToken = () => {
  const id = Math.floor(Math.random() * 1000) + 1;
  const token = jwt.sign({ id }, "chave-secreta", { expiresIn: "1h" });
  return token;
};

module.exports = gerarToken;
