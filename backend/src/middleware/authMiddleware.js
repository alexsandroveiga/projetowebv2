const jwt = require("jsonwebtoken");

// Middleware de autenticação
const authMiddleware = (req, res, next) => {
  // Verifica se há um token de autenticação no cabeçalho da solicitação
  const token = req.headers.authorization;

  if (!token) {
    return res
      .status(401)
      .json({ mensagem: "Token de autenticação não fornecido" });
  }

  try {
    // Verifica e decodifica o token
    const decodedToken = jwt.verify(token, "abobrinha123");

    // Adiciona o ID do usuário decodificado ao objeto de solicitação para uso posterior
    req.userId = decodedToken.id;

    // Chama o próximo middleware ou rota
    next();
  } catch (error) {
    return res.status(401).json({ mensagem: "Token de autenticação inválido" });
  }
};

module.exports = authMiddleware;
