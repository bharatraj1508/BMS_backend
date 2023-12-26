const isSuperAdmin = async (req, res, next) => {
  const { accountType } = req.user;

  if (!accountType === "superadmin") {
    return res.status(401).json({ error: "Superadmin access necessary." });
  }

  next();
};

module.exports = isSuperAdmin;
