const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = mongoose.model("User");

const router = express.Router();

/*
@type     -   POST
@route    -   /admin/signin
@desc     -   Endpoint to signin the accounts.
@access   -   public
*/
router.post("/signin", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(422).send({ error: "Must provide email and password" });
    }
  
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send({ error: "Invalid email or password" });
    }
    
    try {
      await user.comparePassword(password);
      const token = jwt.sign({ userId: user._id }, process.env.MY_SECRET_KEY);
      res.send({ user, token });
    } catch (err) {
      res.status(500).send({ error: err.message });
    }
  });
  
module.exports = router;
