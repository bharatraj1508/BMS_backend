require("dotenv").config();
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Admin = mongoose.model("Admin");

// Middleware function to check if the user is authenticated
module.exports = (req, res, next) => {
  const { authorization } = req.headers;

  // Check if authorization header is present
  if (!authorization) {
    return res.status(401).send({ error: "You must be logged in." });
  }

  // Extract the token from the authorization header
  const token = authorization.replace("Bearer ", "");

  // Verify the token
  jwt.verify(token, "19GT", async (err, payload) => {
    if (err) {
      return res.status(401).send({ error: "You must be logged in." });
    }
    // Extract the userId from the payload
    const { userId } = payload;
    console.log(userId)
    // Find the user in the database using the userId
    const user = await Admin.findById(userId);
    
    // Assign the user object to the req object for further use in the route handlers
    req.user = user;

    // Call the next middleware or route handler
    next();
  });
};
