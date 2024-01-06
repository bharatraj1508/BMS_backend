const { hash } = require("bcryptjs");
const nodemailer = require("nodemailer");

const sendEmailVerification = (res, email, token) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "bharat.raj1508@gmail.com",
      pass: process.env.MAILER_PASS,
    },
  });

  const mail_option = {
    from: "bharat.raj1508@gmail.com", // sender address
    to: email, // list of receivers
    subject: "Very Email", // Subject line
    text: `Hi,
    In order to proceed further, please click on the link below to verify your email address.
    This link will expire in 15 minutes.
    ${process.env.DEV_BASE_URL}/verification?token=${token}`,
    html: `<p> Hi, <p> </br></br>
    <p>In order to proceed further, please click on the link below to verify your email address.<p></br>
    <p>This link will expite in 15 minutes.</p></br></br>
    ${process.env.DEV_BASE_URL}/verification?token=${token}`,
  };

  transporter.sendMail(mail_option, (err, info) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/verification");
    }
  });
};

module.exports = {
  sendEmailVerification,
};
