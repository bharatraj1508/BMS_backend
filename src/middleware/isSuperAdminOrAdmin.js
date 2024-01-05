const isSuperAdmin = async (req, res, next) => {
  const { isAdmin, isSuperAdmin } = req.user;

  if (!isAdmin && !isSuperAdmin) {
    return res
      .status(401)
      .json({ error: "Superadmin/admin access necessary." });
  }

  next();
};

module.exports = isSuperAdmin;
