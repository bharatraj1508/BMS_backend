const crypto = require("crypto");

/* 
    Function to check if the a single account have admin as well as user roles.
    An account should not have admin and user account type
    This can lead to an account of user type have admin access
    This fucntion will return true if the account has both admin and user access types otherwise false
*/
const checkAdminUserRoles = (req) => {
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

/* 
    function to check if the admin does not create or update superadmin or admin accounts.
    Admin account should not have the privilege to maintain admin or superadmin accounts
    This fucntion will return true if the changes made to superadmin if the logged in account is admin
    Only superadmin accounts are allowed to make changes to admin or superadmin accounts
*/
const checkAdminChange = (req, adminRoles) => {
  if (
    (JSON.parse(adminRoles.isSuperAdmin) &&
      req.user.accountType !== "superadmin") ||
    (JSON.parse(adminRoles.isAdmin) && req.user.accountType !== "superadmin")
  ) {
    return true;
  }

  return false;
};

/* 
    Function to assign correct account type in case if its null or wrong account type.
    Account type will be assigned by itself based based on the selections
*/
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

const randomString = (length) => {
  return crypto.randomBytes(Math.ceil(length / 2)).toString("hex");
};

module.exports = {
  checkAdminUserRoles,
  checkAdminChange,
  correctAccountType,
  randomString,
};
