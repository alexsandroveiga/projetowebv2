const mongoose = require("mongoose");

const usuarioSchema = new mongoose.Schema({
  email: { type: String, require: true },
  senha: { type: String, require: true },
});

module.exports = mongoose.model("User", usuarioSchema);
