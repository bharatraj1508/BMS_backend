const express = require("express");
const mongoose = require("mongoose");
const User = mongoose.model("User");
const Audit = mongoose.model("Audit");
const requireToken = require("../middleware/requireToken");
const isSuperAdminOrAdmin = require("../middleware/isSuperAdminOrAdmin");
const isSuperAdmin = require("../middleware/isSuperAdminOrAdmin");

const router = express.Router();

router.use(requireToken);
router.use(isSuperAdminOrAdmin);

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

  const adminRoles = ["isSuperAdmin", "isAdmin"];
  const userRoles = ["isSupervisor", "isManager", "isSecurity", "isResident"];

  const trueRoles = roles.filter((role) => JSON.parse(req.body[role]));

  var adminFlag = false;
  var userFlag = false;

  for (let role of trueRoles) {
    if (adminRoles.includes(role)) {
      adminFlag = true;
    } else if (userRoles.includes(role)) {
      userFlag = true;
    } else {
      adminFlag = false;
      userFlag = false;
    }
  }

  if (adminFlag && userFlag) {
    return true;
  }

  return false;
};

// function to check if the admin does not create or update superadmin or admin accounts
const checkAdminChange = (req, adminRoles) => {
  if (
    (JSON.parse(adminRoles.isSuperAdmin) &&
      req.user.accountType !== "superadmin") ||
    (JSON.parse(adminRoles.isAdmin) && req.user.accountType !== "superadmin")
  ) {
    return true;
  }
};

// function to assign correct account type in case if its null or wrong account type.
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
@type     -   GET
@route    -   /admin/user/search
@desc     -   Endpoint to search any account by providing email. 
@access   -   private (only accessible to admins/superadmins)
*/

router.get("/user/search/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await User.findById(userId).select("-password");
    res.status(200).send({ user });
  } catch (err) {
    res.status(500).send({ error: err });
  }
});

/*
@type     -   POST
@route    -   /admin//user/signup-user
@desc     -   Endpoint to signup any account. Admins cannot create superadmin accounts, user account has to be superadmin to create superadmin account. 
@access   -   private (only accessible to admins/superadmins)
*/
router.post("/user/signup", async (req, res) => {
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

  try {
    if (!req.user.isSuperAdmin) {
      if (checkTrueRoles(req)) {
        throw new Error(
          "An account cannot have admin and user access type both."
        );
      }

      if (checkAdminChange(req, adminRoles)) {
        throw new Error("Admins cannot create superadmin or admin accounts");
      }
    }

    accountType = correctAccountType(accountRoles, accountType);

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
        timestamp: new Date(),
      },
    });

    const savedUser = await user.save();

    const audit = new Audit({
      userId: req.user._id,
      actionBy: `${req.user.firstName} ${req.user.lastName}`,
      email: req.user.email,
      action: "insert",
      status: "success",
      message: `created an account with email ${savedUser.email}`,
      timestamp: new Date(),
    });

    await audit.save();

    res.send({ message: "Account Created Successfully", user: savedUser });
  } catch (err) {
    const audit = new Audit({
      userId: req.user._id,
      actionBy: `${req.user.firstName} ${req.user.lastName}`,
      email: req.user.email,
      action: "insert",
      status: "failure",
      message: err.message,
      timestamp: new Date(),
    });

    await audit.save();
    return res.status(500).send({ error: err.message });
  }
});

/*
@type     -   PUT
@route    -   /admin//user/update
@desc     -   Endpoint to update an existing account. Admins cannot update account to superadmin or admin. 
@access   -   private (only accessible to admins/superadmins)
*/

router.put("/user/update", async (req, res) => {
  const userId = req.query.id;

  let {
    firstName,
    lastName,
    building,
    isActive,
    isSuperAdmin,
    isAdmin,
    isSupervisor,
    isManager,
    isSecurity,
    isResident,
  } = req.body;

  const updateFields = {
    firstName,
    lastName,
    building,
    isActive,
    isSuperAdmin,
    isAdmin,
    isSupervisor,
    isManager,
    isSecurity,
    isResident,
  };

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

  let accountType = correctAccountType(accountRoles, "");

  const user = await User.findById(userId);

  try {
    if (!req.user.isSuperAdmin) {
      if (checkTrueRoles(req)) {
        throw new Error(
          "An account cannot have admin and user access type both."
        );
      }

      if (checkAdminChange(req, adminRoles)) {
        throw new Error("Admins cannot create superadmin or admin accounts");
      }
    }

    await User.updateOne(
      { _id: userId },
      {
        $set: updateFields,
        accountType: accountType,
        lastUpdatedBy: {
          _id: req.user._id,
          name: `${req.user.firstName} ${req.user.lastName}`,
          timestamp: new Date(),
        },
      }
    );

    const updatedUser = await User.findById(userId);

    const trackValue = {};

    //this will keep the track of the change values
    for (const key in user) {
      if (user[key] !== updatedUser[key]) {
        if (
          typeof updatedUser[key] === "string" ||
          typeof updatedUser[key] === "boolean"
        ) {
          trackValue[key] = {
            oldValue: user[key],
            updatedValue: updatedUser[key],
          };
        }
      }
    }

    res
      .status(200)
      .send({ message: "Account updated successfully", updatedUser });

    const audit = new Audit({
      userId: req.user._id,
      actionBy: `${req.user.firstName} ${req.user.lastName}`,
      email: req.user.email,
      action: "update",
      status: "success",
      impactedUser: {
        _id: user._id,
        email: user.email,
      },
      message: `Successfully updated the acccount`,
      details: trackValue,
      timestamp: new Date(),
    });

    await audit.save();
  } catch (err) {
    const audit = new Audit({
      userId: req.user._id,
      actionBy: `${req.user.firstName} ${req.user.lastName}`,
      email: req.user.email,
      action: "update",
      status: "failure",
      impactedUser: {
        _id: user._id,
        email: user.email,
      },
      message: err.message,
      timestamp: new Date(),
    });

    await audit.save();
    return res.status(500).send({ error: err.message });
  }
});

module.exports = router;
