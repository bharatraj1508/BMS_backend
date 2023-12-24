const express = require("express");
const mongoose = require("mongoose");
const User = mongoose.model("User");
const requireToken = require("../middleware/requireToken");
const isSuperAdminOrAdmin = require("../middleware/isSuperAdminOrAdmin");

const router = express.Router();

// function to check how many true values are there in the user roles (it wont allow more than one true values)
const checkTrueRoles = (req) => {
  const roles = [
    "isSuperAdmin",
    "isAdmin",
    "isSupervisor",
    "isManager",
    "isSecurity",
    "isResident",
  ];
  const trueRoles = roles.filter((role) => JSON.parse(req.body[role]));

  return trueRoles.length !== 1;
};

// function to check is the admin does not make or update superadmin or admin accounts
const checkAdminChange = (req, adminRoles) => {
  if (
    (JSON.parse(adminRoles.isSuperAdmin) &&
      req.user.accountType !== "superadmin") ||
    (JSON.parse(adminRoles.isAdmin) && req.user.accountType !== "superadmin")
  ) {
    return true;
  }
};

// function to assign correct account type in case if its not fill by the user or wrong account type.
const correctAccountType = (accountRoles, accountType) => {
  if (JSON.parse(accountRoles.isSuperAdmin)) {
    accountType = "superadmin";
  } else if (JSON.parse(accountRoles.isAdmin)) {
    accountType = "admin";
  } else if (
    JSON.parse(accountRoles.isManager) ||
    JSON.parse(accountRoles.isSupervisor) ||
    JSON.parse(accountRoles.isSecurity) ||
    JSON.parse(accountRoles.isResident)
  ) {
    accountType = "user";
  }

  return accountType;
};

// Routes starts here

/*
@type     -   POST
@route    -   /admin/signup-user
@desc     -   Endpoint to signup any account. Admins cannot create superadmin accounts, user account has to be superadmin to create superadmin account. 
@access   -   private (only accessible to admins/superadmins)
*/

router.get("/search", requireToken, isSuperAdminOrAdmin, async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email: email }).select("-password");
    res.status(200).send({ user });
  } catch (err) {
    res.status(500).send({ error: err });
  }
});

/*
@type     -   POST
@route    -   /admin/signup-user
@desc     -   Endpoint to signup any account. Admins cannot create superadmin accounts, user account has to be superadmin to create superadmin account. 
@access   -   private (only accessible to admins/superadmins)
*/
router.post(
  "/signup-user",
  requireToken,
  isSuperAdminOrAdmin,
  async (req, res) => {
    const {
      firstName,
      lastName,
      email,
      password,
      building,
      isActive,
      isSuperAdmin,
      isAdmin,
      isSupervisor,
      isManager,
      isSecurity,
      isResident,
    } = req.body;
    let { accountType } = req.body;

    const accountRoles = {
      isSuperAdmin,
      isAdmin,
      isManager,
      isSupervisor,
      isSecurity,
      isResident,
    };

    const adminRoles = {
      isSuperAdmin,
      isAdmin,
    };

    if (checkTrueRoles(req)) {
      return res
        .status(406)
        .send({ error: "Only one role should be set to true" });
    }

    if (checkAdminChange(req, adminRoles)) {
      return res
        .status(403)
        .send({ error: "Admins cannot create superadmin or admin accounts" });
    }

    accountType = correctAccountType(accountRoles, accountType);

    try {
      const user = new User({
        firstName,
        lastName,
        email,
        password,
        accountType,
        building,
        isActive,
        isSuperAdmin,
        isAdmin,
        isSupervisor,
        isManager,
        isSecurity,
        isResident,
        userCreatedby: {
          _id: req.user._id,
          name: `${req.user.firstName} ${req.user.lastName}`,
          createdOn: new Date(),
        },
      });
      await user.save();
      res.send({ message: "Account Created Succesfully", user });
    } catch (err) {
      return res.status(500).send({ error: err.message });
    }
  }
);

/*
@type     -   PUT
@route    -   /admin/update
@desc     -   Endpoint to update an existing account. Admins cannot update account to superadmin or admin. 
@access   -   private (only accessible to admins/superadmins)
*/

router.put("/update", requireToken, isSuperAdminOrAdmin, async (req, res) => {
  const userId = req.query.id;

  const {
    isSuperAdmin,
    isAdmin,
    isSupervisor,
    isManager,
    isSecurity,
    isResident,
  } = req.body;

  const accountRoles = {
    isSuperAdmin,
    isAdmin,
    isManager,
    isSupervisor,
    isSecurity,
    isResident,
  };

  const adminRoles = {
    isSuperAdmin,
    isAdmin,
  };

  const updateFields = {};

  // Iterate through the request body and populate the updateFields object
  for (const key in req.body) {
    if (
      req.body[key] !== undefined &&
      req.body[key] !== null &&
      req.body[key] !== ""
    ) {
      updateFields[key] = req.body[key];
    }
  }

  if (checkTrueRoles(req)) {
    return res
      .status(406)
      .send({ error: "Only one role should be set to true" });
  }

  if (checkAdminChange(req, adminRoles)) {
    return res.status(403).send({
      error: "Admins cannot create or update accounts to superadmin or admin",
    });
  }

  updateFields.accountType = correctAccountType(
    accountRoles,
    updateFields.accountType
  );

  try {
    await User.updateOne(
      { _id: userId },
      {
        $set: updateFields,
        lastUpdatedBy: {
          _id: req.user._id,
          name: `${req.user.firstName} ${req.user.lastName}`,
          updatedOn: new Date(),
        },
      }
    );
    res.status(200).send({ message: "Account updated successfully" });
  } catch (err) {
    return res.status(500).send({ error: err.message });
  }
});

module.exports = router;
