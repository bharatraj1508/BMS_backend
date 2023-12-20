const mongoose = require("mongoose");

// Defining the user schema
const securitySchema = new mongoose.Schema({
  fname: {
    type: String,
    required: true,
  },
  lname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  accountType: {
    type: String,
    default: "user"
  },
  role: {
    type: String,
    required: true
  }
});

// Creating the User model
mongoose.model("Security", securitySchema);