require('dotenv').config()
require("./src/model/admin")
require("./src/model/resident")
require("./src/model/security")
require("./src/model/account")

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require('cors')
const authRoutes = require("./src/routes/authenticationRoutes")


const app = express();

//Middleware for allowing cross-origin HTTP requests
app.use(cors())

// Middleware for parsing JSON requests
app.use(bodyParser.json());

app.use(authRoutes);

// MongoDB connection URI
const mongoUri = process.env.MONGOURI

// Connecting to MongoDB
mongoose.connect(mongoUri);

// Event handler for successful MongoDB connection
mongoose.connection.on("connected", () => {
  console.log("Connected to mongo instance");
});

// Event handler for MongoDB connection error
mongoose.connection.on("error", (err) => {
  console.error("Error connecting to mongo", err);
});

// Starting the server
app.listen(3000, () => {
  console.log("listening on port 3000");
});
