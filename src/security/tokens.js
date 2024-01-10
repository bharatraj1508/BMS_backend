const jwt = require("jsonwebtoken");

const setToken = (id) => {
  const accessToken = jwt.sign({ userId: id }, process.env.MY_SECRET_KEY, {
    expiresIn: "1h",
  });
  const refreshToken = jwt.sign({ userId: id }, process.env.MY_SECRET_KEY, {
    expiresIn: "1d",
  });

  const token = {
    accessToken,
    refreshToken,
  };

  return token;
};

const setNewAccessToken = (res, refreshToken) => {
  var accessToken;
  try {
    jwt.verify(refreshToken, "BHARAT_VERMA_DEV", async (err, payload) => {
      if (err) {
        return res.status(401).send({ error: err });
      }
      // Extract the userId from the payload
      const { userId } = payload;
      accessToken = jwt.sign({ userId: userId }, process.env.MY_SECRET_KEY, {
        expiresIn: "1h",
      });
    });

    return accessToken;
  } catch (err) {
    return null;
  }
};

const accountSetupToken = (hashValue) => {
  const mailToken = jwt.sign({ hash: hashValue }, process.env.MY_SECRET_KEY, {
    expiresIn: "1d",
  });

  return mailToken;
};

const ResetPasswordToken = (hashValue) => {
  const resetToken = jwt.sign({ hash: hashValue }, process.env.MY_SECRET_KEY, {
    expiresIn: "15m",
  });

  return resetToken;
};

module.exports = {
  setToken,
  setNewAccessToken,
  accountSetupToken,
  ResetPasswordToken,
};
