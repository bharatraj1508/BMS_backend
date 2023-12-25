const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  email: String,
});

// Defining the log schema
const auditSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  actionBy: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: false,
  },
  action: {
    type: String,
    enum: ["insert", "update", "delete"],
    required: true,
  },
  status: {
    type: String,
    enum: ["success", "failure"],
    require: true,
  },
  impactedUser: userSchema,
  message: {
    type: String,
    require: true,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  timestamp: {
    type: Date,
    required: true,
  },
});

// Creating the Audit model
mongoose.model("Audit", auditSchema);
