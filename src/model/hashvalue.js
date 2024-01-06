const mongoose = require("mongoose");

// Defining the hashSchema schema
const hashSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
  },
  hash: {
    type: String,
    required: true,
  },
});

// Creating the Hash model
mongoose.model("Hash", hashSchema);
