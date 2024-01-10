const express = require("express");
const mongoose = require("mongoose");
const User = mongoose.model("User");
const Hash = mongoose.model("Hash");
const cookieParser = require("cookie-parser");
const router = express.Router();
const requireToken = require("../../middleware/requireToken");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: true });

router.use(cookieParser());

const {
  setToken,
  setNewAccessToken,
  accountSetupToken,
  ResetPasswordToken,
} = require("../../security/tokens");
const {
  sendEmailVerification,
  sendPasswordResetEmail,
  sendPasswordChangeConfirmation,
  sendAccountSetupEmail,
  sendAccountSetupConfirmation,
} = require("../../utils/helpers/mailer");

const {
  randomString,
  compareHashAndReturnId,
  setHashRecord,
} = require("../../utils/helpers/hashFunctions");

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
    if (err) {
      return res.send({ error: "Invalid email or password" });
    }
    res.status(500).send({ error: err });
  }
});

/*
@type     -   GET
@route    -   /refreshToken
@desc     -   Endpoint to create a new access token using the refresh token.
@access   -   public
*/
router.get("/refreshToken", async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const accessToken = setNewAccessToken(res, refreshToken);

    res.send({ token: accessToken });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

/*
@type     -   GET
@route    -   /register/callback
@desc     -   Endpoint which will redirect to Password reset handlebar.
              This api will accept the token and based on the hash inside tht token it will render the form with the Id saved for that hash.
@access   -   public
*/
router.get("/register/callback", async (req, res) => {
  try {
    const token = req.query.ut;

    jwt.verify(token, "BHARAT_VERMA_DEV", async (err, payload) => {
      if (err) {
        return res.status(401).send({ error: err });
      }

      // Extract the userId from the payload
      const { hash } = payload;

      try {
        const id = await compareHashAndReturnId(hash);
        if (id === null) {
          throw new Error("Unrecorded hash or the link has been expired");
        }

        res.render("resetPassword", {
          id: id,
          title: "Create Password",
          action: "/register/submit",
          layout: false,
        });
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

/*
@type     -   PATCH
@route    -   /register/callback
@desc     -   Endpoint which will update the new password for the give id in the query parameter.
@access   -   public
*/
router.post("/register/submit", urlencodedParser, async (req, res) => {
  const newPassword = req.body.password;
  const id = req.query.id;

  try {
    await User.updateOne(
      { _id: id },
      { password: newPassword, isVerified: true }
    );
    await Hash.deleteMany({ userId: id });
    const user = await User.findById(id);
    await sendAccountSetupConfirmation(user.email, user.firstName);
    res.status(200).send({ message: "Account has been setup successfully" });
  } catch (err) {
    res.send({ error: err.message });
  }
});

/*
@type     -   GET
@route    -   /account/setup
@desc     -   Endpoint to setup the user account by providing their ID.
@access   -   private (only accessible to the logged in users)
*/
router.get("/account/setup", requireToken, async (req, res) => {
  try {
    const id = req.query.id;
    const hashValue = randomString(128);

    const token = accountSetupToken(hashValue);

    const user = await User.findById(id);

    if (setHashRecord(hashValue, id)) {
      await sendAccountSetupEmail(user.email, user.firstName, token);
      res.send({ message: "Account setup email has been sent." });
    }
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

/*
@type     -   GET
@route    -   /account/reset/password
@desc     -   Endpoint to reset the password for the accounts.
@access   -   public
*/
router.get("/password/reset", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    const hashValue = randomString(128);

    const token = ResetPasswordToken(hashValue);

    if (setHashRecord(hashValue, user._id)) {
      await sendPasswordResetEmail(email, token);
      res.send({ message: "Email sent successfully." });
    }
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

/*
@type     -   GET
@route    -   /account/reset/password
@desc     -   Endpoint which will redirect to Password reset handlebar.
              This api will accept the token and based on the hash inside tht token it will render the form with the Id saved for that hash.
@access   -   public
*/
router.get("/password/reset/callback", async (req, res) => {
  try {
    const token = req.query.ut;

    jwt.verify(token, "BHARAT_VERMA_DEV", async (err, payload) => {
      if (err) {
        return res.status(401).send({ error: err });
      }

      // Extract the userId from the payload
      const { hash } = payload;

      try {
        const id = await compareHashAndReturnId(hash);
        if (id === null) {
          throw new Error("Unrecorded hash or the link has been expired");
        }

        res.render("resetPassword", {
          id: id,
          title: "Reset Password",
          action: "/password/reset/submit",
          layout: false,
        });
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

/*
@type     -   PATCH
@route    -   /register/callback
@desc     -   Endpoint which will update the new password for the give id in the query parameter.
@access   -   public
*/
router.post("/password/reset/submit", urlencodedParser, async (req, res) => {
  const newPassword = req.body.password;
  const id = req.query.id;

  try {
    await User.updateOne({ _id: id }, { password: newPassword });
    await Hash.deleteMany({ userId: id });
    const user = await User.findById(id);
    await sendPasswordChangeConfirmation(user.email, user.firstName);
    res.status(200).send({ message: "Account has been setup successfully" });
  } catch (err) {
    res.send({ error: err.message });
  }
});

module.exports = router;
