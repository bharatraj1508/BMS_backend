const mongoose = require("mongoose");
const Admin = mongoose.model("Admin");

const isAdmin = async (req, res, next) => {

  console.log(req.user);
  const admin = await Admin.findById(req.user._id)

  if (!admin) {
    return res.status(401).json({ error: "Admin access neccessary." });
  }
  next();
  };
  
module.exports = isAdmin;