const isSuperAdmin = async (req, res, next) => {
  const { isSuperAdmin } = req.user;

  if (!isSuperAdmin) {
    return res.status(401).json({ error: "Superadmin access necessary." });
  }

  next();
};

module.exports = isSuperAdmin;
