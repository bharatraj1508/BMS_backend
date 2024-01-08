const jwt = require("jsonwebtoken");

const setToken = (id) => {
  console.log(process.env.MY_SECRET_KEYS);
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

const emailToken = (hashValue) => {
  const mailToken = jwt.sign({ hash: hashValue }, process.env.MY_SECRET_KEY, {
    expiresIn: "15m",
  });

  return mailToken;
};

const ResetPasswordToken = (id) => {
  const resetToken = jwt.sign({ userId: id }, process.env.MY_SECRET_KEY, {
    expiresIn: "15m",
  });

  return resetToken;
};

module.exports = {
  setToken,
  setNewAccessToken,
  emailToken,
  ResetPasswordToken,
};
