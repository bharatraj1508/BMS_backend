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
} = require("../../utils/mailer");
const { randomString } = require("../../utils/accountFunctions");

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
        const hashDoc = await Hash.findOne({ hash });

        if (hashDoc) {
          const user = await User.findById(hashDoc.userId);

          if (user) {
            await User.updateOne({ _id: hashDoc.userId }, { isVerified: true });
            await Hash.deleteMany({ userId: user._id });
            res.send({ message: "Account verified successfully" });
          } else {
            throw new Error("This user does not exist");
          }
        } else {
          res.status(404).send({
            error:
              "Either the link is expired or the account is already verified",
          });
        }
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
@route    -   /user/email/verification
@desc     -   Endpoint to verify the user email if it has not been done during signup process.
              This endpoint may take id also if verification email has to send to any other user.
@access   -   private (only accessible to the logged in users)
*/
router.get("/user/email/verify", requireToken, async (req, res) => {
  try {
    const id = req.query.id;
    const hashValue = randomString(128);
    const token = emailToken(hashValue);

    if (!id) {
      if (req.user.isVerified) {
        throw new Error("Account is alreadty verified");
      }
      const hash = new Hash({
        userId: req.user._id,
        hash: hashValue,
      });
      await hash.save();

      const mailResponse = sendEmailVerification(res, req.user.email, token);
      if (!mailResponse) {
        throw new Error("Unable to send the verification email");
      }
    } else {
      const hash = new Hash({
        userId: id,
        hash: hashValue,
      });
      await hash.save();
      await User.findById(id).then((user) => {
        if (user) {
          if (user.isVerified) {
            throw new Error("Account is alreadty verified");
          }

          const mailResponse = sendEmailVerification(res, user.email, token);
          if (!mailResponse) {
            throw new Error("Unable to send the verification email");
          }
        } else {
          throw new Error("Something went wrong. Please contact admin");
        }
      });
    }

    res.send({
      message: "Email has been sent for verification",
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
