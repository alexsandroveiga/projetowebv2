const mongoose = require("mongoose");
const url_prod =
  "mongodb+srv://wallysson:barbosa@cluster1.cs8yfic.mongodb.net/projweb";

const conectDatabase = () => {
  mongoose
    .connect(url_prod, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Conexão com MongoDB estabelecida com sucesso!"))
    .catch((error) => console.log("Erro ao conectar com MongoDB:", error));
};

module.exports = conectDatabase;
