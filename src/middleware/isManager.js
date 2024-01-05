const isManager = async (req, res, next) => {
  const { isManager } = req.user;

  if (!isManager) {
    return res.status(401).json({ error: "Access Denied." });
  }

  next();
};

module.exports = isManager;
