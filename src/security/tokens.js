const jwt = require("jsonwebtoken");

const setToken = (id) => {
  console.log(process.env.MY_SECRET_KEYS);
  const accessToken = jwt.sign({ userId: id }, process.env.MY_SECRET_KEY, {
    expiresIn: "1h",
  });
  const refreshToken = jwt.sign({ userId: id }, process.env.MY_SECRET_KEY);

  const token = {
    accessToken,
    refreshToken,
  };

  return token;
};

const setNewAccessToken = (refreshToken) => {
  var accessToken;
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
};

module.exports = {
  setToken,
  setNewAccessToken,
};
