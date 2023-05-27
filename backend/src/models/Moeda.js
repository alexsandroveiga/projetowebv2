const mongoose = require("mongoose");

const MoedaSchema = new mongoose.Schema({
  nome: { type: String, require: true },
  alta: { type: String, require: true },
  baixa: { type: String, require: true },
});

module.exports = mongoose.model("Moeda", MoedaSchema);
