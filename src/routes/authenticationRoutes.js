const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Admin = mongoose.model("Admin");
const Security = mongoose.model("Security");
const Resident = mongoose.model("Resident");
const Account = mongoose.model("Account")
const requireToken = require("../middleware/requireToken")
const isAdmin = require("../middleware/isAdmin")

const router = express.Router();

/*
@type     -   POST
@route    -   /signup
@desc     -   Endpoint to singup a admin account only
@access   -   public
*/
router.post("/admin/signup", async (req, res) => {
  const { fname, lname, email, password, role } = req.body;
  try {
    const admin = new Admin({ fname, lname, email, password, role });
    await admin.save().then(async () => {
        const account = new Account({
            userId: admin._id,
          email: admin.email,
          password: admin.password
        });
        await account.save();
    });
    res.send({ message: "Account Created Succesfully" });
  } catch (err) {
    return res.status(422).send({error: err.message});
  }
});

/*
@type     -   POST
@route    -   /signin/
@desc     -   Endpoint to signin
@access   -   public
*/
router.post("/signin", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(422).send({ error: "Must provide email and password" });
    }
  
    const user = await Account.findOne({ email });
  
    if (!user) {
      return res.status(404).send({ error: "Invalid email or password" });
    }
    try {
      await user.comparePassword(password);
      const token = jwt.sign({ userId: user.userId }, process.env.MY_SECRET_KEY);
      res.send({ user, token });
    } catch (err) {
      res.status(404).send({ error: err.message });
    }
  });
  
/*
@type     -   POST
@route    -   /account/register
@desc     -   Endpoint to register an acocunt
@access   -   private
*/
router.post("/account/register", requireToken, isAdmin, async (req, res) => {
    const { fname, lname, email, password, role } = req.body;
    if (!email || !password || !fname || !lname || !role) {
      return res.status(422).send({ error: "Must provide all values" });
    }
  
    try {
        if(role === "security") {
            const security = new Security({fname, lname, email, password, role})
            await security.save().then(async () => {
                const account = new Account({
                  userId: security._id,
                  email: security.email
                });
                await account.save();
            });
        } else {
            const resident = new Resident({fname, lname, email, password, role})
            await resident.save().then(async () => {
                const account = new Account({
                  userId: resident._id,
                  email: resident.email
                });
                await account.save();
            });
        }

        res.status(200).send({ message: "Account Created Successfully" });
    } catch (err) {
      res.status(404).send({ error: err.message });
    }
  });


module.exports = router;
