const mongoose = require("mongoose");
const Audit = mongoose.model("Audit");

const createAudit = (req, details) => {
  const audit = new Audit({
    userId: req.user._id,
    actionBy: `${req.user.firstName} ${req.user.lastName}`,
    email: req.user.email,
    action: details.action,
    status: details.status,
    impactedUser: details.action === "update" ? details.impactedUser : null,
    message: details.message,
    details: details.action === "update" ? details.trackValue : null,
    timestamp: new Date(),
  });

  return audit;
};

module.exports = {
  createAudit,
};
