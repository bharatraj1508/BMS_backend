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
  emailToken,
  ResetPasswordToken,
} = require("../../security/tokens");
const {
  sendEmailVerification,
  sentPasswordResetEmail,
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
@route    -   /verification
@desc     -   Endpoint to verify the user email.
@access   -   public
*/
router.get("/verification", async (req, res) => {
  try {
    const token = req.query.token;

    jwt.verify(token, "BHARAT_VERMA_DEV", async (err, payload) => {
      if (err) {
        return res.status(401).send({ error: err });
      }

      // Extract the userId from the payload
      const { hash } = payload;

      try {
        const id = await compareHashAndReturnId(hash);

        if (id === null) {
          throw new Error("Unrecorded hash");
        }
        await User.updateOne({ _id: id }, { isVerified: true });
        await Hash.deleteMany({ hash });
        res.send({ message: "Account verified successfully" });
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

/*
@type     -   GET
@route    -   /verification
@desc     -   Endpoint to verify the user email.
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
          title: "Setup Password",
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
@route    -   /user/setup
@desc     -   Endpoint to setup the user account with new password.
@access   -   private (only accessible to the logged in users)
*/
router.get("/account/setup", requireToken, async (req, res) => {
  try {
    const id = req.query.id;
    const hashValue = randomString(128);

    const token = emailToken(hashValue);

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
router.get("/account/password/reset", async (req, res) => {
  try {
    const { email } = req.body;
    await User.findOne({ email }).then((user) => {
      if (user) {
        const resetToken = ResetPasswordToken(user._id);
        const mailResponse = sentPasswordResetEmail(user.email, resetToken);
        if (!mailResponse) {
          return res.status(400).send({ message: "Unable to send the email" });
        }
        res.status(200).send({ message: "Email has been sent successfully" });
      } else {
        return res
          .status(404)
          .send({ message: "User for the given email not found." });
      }
    });
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
router.get("/password/reset/callback", async (req, res) => {
  try {
    const token = req.query.token;

    jwt.verify(token, "BHARAT_VERMA_DEV", async (err, payload) => {
      if (err) {
        return res.status(401).send({ error: err });
      }

      // Extract the userId from the payload
      const { userId } = payload;

      try {
        res.render("resetPassword", { id: userId, layout: false });
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

router.post("/password/reset/submit", urlencodedParser, async (req, res) => {
  const newPassword = req.body.password;
  const id = req.query.id;

  try {
    await User.updateOne({ _id: id }, { password: newPassword });
    await User.findById(id).then(async (user) => {
      const mailResponse = sendPasswordChangeConfirmation(user.email);
      if (!mailResponse) {
        return res.status(400).send({ message: "Unable to send the email" });
      }
      res.status(200).send({ message: "Password has been reset successfully" });
    });
  } catch (err) {
    res.send({ error: err.message });
  }
});

module.exports = router;
