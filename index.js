require('dotenv').config()
require("./src/model/users")

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require('cors')
const adminRoutes = require("./src/routes/adminRoutes")


const app = express();

//Middleware for allowing cross-origin HTTP requests
app.use(cors())

// Middleware for parsing JSON requests
app.use(bodyParser.json());

// MongoDB connection URI
const mongoUri = process.env.MONGOURI

// Connecting to MongoDB
mongoose.connect(mongoUri);

// Event handler for successful MongoDB connection
mongoose.connection.on("connected", () => {
  console.log("Connected to mongo instance");
});

app.get("/", (req, res) => {
  res.send('BMS server is online');
});

app.use("/admin", adminRoutes);

// Event handler for MongoDB connection error
mongoose.connection.on("error", (err) => {
  console.error("Error connecting to mongo", err);
});

// Starting the server
app.listen(3000, () => {
  console.log("listening on port 3000");
});