const express = require("express");
const mongoose = require("mongoose");
const User = mongoose.model("User");
const Hash = mongoose.model("Hash");
const cookieParser = require("cookie-parser");
const router = express.Router();

router.use(cookieParser());

const { setToken, setNewAccessToken } = require("../../security/tokens");

/*
@type     -   POST
@route    -   /admin/signin
@desc     -   Endpoint to signin the accounts.
@access   -   public
*/
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      throw new Error("Must provide email and password");
    }

    const user = await User.findOne({ email });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (!user.isActive) {
      throw new Error("User is inactive. Contact admin");
    }

    await user.comparePassword(password);
    const token = setToken(user._id);
    const refreshToken = token.refreshToken;
    const accessToken = token.accessToken;
    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: "strict",
      })
      .send({ token: accessToken });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

/*
@type     -   GET
@route    -   /refreshToken
@desc     -   Endpoint to signin the accounts.
@access   -   public
*/
router.get("/refreshToken", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const accessToken = setNewAccessToken(refreshToken);

    res.send({ token: accessToken });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

/*
@type     -   GET
@route    -   /verify-your-email
@desc     -   Endpoint to signin the accounts.
@access   -   public
*/
router.get("/verify-your-email", async (req, res) => {
  try {
    const hash = req.query.hash;

    await Hash.findOne({ hash }).then(async (hash) => {
      if (hash) {
        const id = hash.userId;
        const user = await User.findById(id);
        if (user) {
          await User.updateOne({ _id: id }, { isVerified: true });
        } else {
          throw new Error("This user does not exit");
        }
      } else {
        throw new Error("Invalid verification link");
      }
    });

    Hash.deleteOne({ hash });

    res.send({ message: "Acccount verified Successfully" });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

module.exports = router;
