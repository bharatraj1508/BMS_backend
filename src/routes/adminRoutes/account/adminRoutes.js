const express = require("express");
const mongoose = require("mongoose");
const User = mongoose.model("User");
const Hash = mongoose.model("Hash");
const requireToken = require("../../../middleware/requireToken");
const isSuperAdminOrAdmin = require("../../../middleware/isSuperAdminOrAdmin");

const {
  checkAdminUserRoles,
  checkAdminChange,
  correctAccountType,
} = require("../../../utils/helpers/accountFunctions");

const {
  randomString,
  setHashRecord,
} = require("../../../utils/helpers/hashFunctions");

const { createAudit } = require("../../../utils/helpers/auditfunctions");

const { sendAccountSetupEmail } = require("../../../utils/helpers/mailer");
const { accountSetupToken } = require("../../../security/tokens");

const router = express.Router();

router.use(requireToken);
router.use(isSuperAdminOrAdmin);

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
      if (checkAdminUserRoles(req)) {
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

    details = {
      action: "insert",
      status: "success",
      message: `Account created successfully for ${savedUser.email}`,
    };

    const audit = createAudit(req, details);

    await audit.save();

    const hashValue = randomString(128);

    const token = accountSetupToken(hashValue);

    if (setHashRecord(hashValue, user._id)) {
      await sendAccountSetupEmail(savedUser.email, savedUser.firstName, token);
      res.send({
        message: "Account Created Successfully and email has been sent.",
        user,
      });
    }
  } catch (err) {
    details = {
      action: "insert",
      status: "failure",
      message: err.message,
    };

    const audit = createAudit(req, details);

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
      if (checkAdminUserRoles(req)) {
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

    details = {
      action: "update",
      status: "success",
      message: "Account updated successfully",
      impactedUser: {
        _id: user._id,
        email: user.email,
      },
      trackValue: trackValue,
    };

    const audit = createAudit(req, details);

    await audit.save();
  } catch (err) {
    details = {
      action: "update",
      status: "failure",
      impactedUser: {
        _id: user._id,
        email: user.email,
      },
      message: err.message,
    };

    const audit = createAudit(req, details);

    await audit.save();
    return res.status(500).send({ error: err.message });
  }
});

module.exports = router;
