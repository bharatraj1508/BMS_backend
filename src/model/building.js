const mongoose = require("mongoose");

const byUserSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  timestamp: Date,
});

const amenitiesSchema = new mongoose.Schema({
  name: {
    type: String,
    default: "",
  },
  description: {
    type: String,
    default: "",
  },
  isActive: {
    type: Boolean,
    default: false,
  },
});

// Defining the log schema
const buildingSchema = new mongoose.Schema({
  name: {
    type: String,
    default: "",
  },
  address: {
    type: String,
    default: "",
    unique: true,
  },
  numberOfUnits: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  amenities: [
    {
      type: amenitiesSchema,
      default: [],
    },
  ],
  createdBy: byUserSchema,
  lastUpdatedBy: byUserSchema,
});

// Creating the building model
mongoose.model("Building", buildingSchema);
