const isSuperAdmin = async (req, res, next) => {
  const allowedUser = ["superadmin", "admin"];
  const { accountType } = req.user;

  if (!allowedUser.includes(accountType)) {
    return res
      .status(401)
      .json({ error: "Superadmin/admin access necessary." });
  }

  next();
};

module.exports = isSuperAdmin;
