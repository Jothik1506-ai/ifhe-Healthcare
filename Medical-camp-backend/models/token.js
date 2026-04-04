const mongoose = require("mongoose")

const tokenSchema = new mongoose.Schema({
  bookNumber: String,
  gender: String,
  tokenNumber: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});
const Token = mongoose.model('Token', tokenSchema);

module.exports = Token
