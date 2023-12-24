const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = mongoose.model("User");
const requireToken = require("../middleware/requireToken");
const isSuperAdminOrAdmin = require("../middleware/isSuperAdminOrAdmin")

const router = express.Router();

/*
@type     -   POST
@route    -   /admin/signup-user
@desc     -   Endpoint to signup any account. Admins cannot create superadmin accounts, user account has to be superadmin to create superadmin account. 
@access   -   private (only accessible to admins)
*/
router.post("/signup-user", requireToken, isSuperAdminOrAdmin, async (req, res) => {
  const { firstName, lastName, email, password, building, isSuperAdmin, isAdmin, isSupervisor, isManager, isSecurity, isResident  } = req.body;
  let { accountType } = req.body;

  // checking that more than one value should not be true 
  const roles = ["isSuperAdmin", "isAdmin", "isSupervisor", "isManager", "isSecurity", "isResident"];
  const trueRoles = roles.filter(role => JSON.parse(req.body[role]) );

  if (trueRoles.length !== 1) {
    return res.status(406).send({error: "Only one role should be set to true"})
  }

  if ((JSON.parse(isSuperAdmin) && req.user.accountType !== "superadmin") || (JSON.parse(isAdmin) && (req.user.accountType !== "superadmin"))) {
      return res.status(403).send({ error: "Admins cannot create superadmin or admin accounts" });
  }


  // make sure the account type should be same according to the role assign
  if(JSON.parse(isSuperAdmin)) {
    accountType = "superadmin"
  }
  else if(JSON.parse(isAdmin)) {
    accountType = "admin"
  }
  else if ((JSON.parse(isManager)) || (JSON.parse(isSupervisor)) || (JSON.parse(isSecurity)) || (JSON.parse(isResident))) {
    accountType = "user"
  }
  
  try {
    const user = new User({ firstName, lastName, email, password, accountType, building, isSuperAdmin, isAdmin, isSupervisor, isManager, isSecurity, isResident, userCreatedby: {
      _id: req.user._id,
      name: `${req.user.firstName} ${req.user.lastName}`,
      createdOn: new Date()
    }});
    await user.save();
    res.send({ message: "Account Created Succesfully"});
  } catch (err) {
    return res.status(500).send({error: err.message});
  }
});

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
