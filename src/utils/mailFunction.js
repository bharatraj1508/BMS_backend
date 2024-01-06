const { hash } = require("bcryptjs");
const nodemailer = require("nodemailer");

const sendEmailVerification = (res, email, hash) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.forwardemail.net",
    port: 465,
    secure: true,
    service: "Gmail",
    auth: {
      user: "bharat.raj1508@gmail.com",
      pass: "kymq cnnk yani yqkg",
    },
  });

  const mail_option = {
    from: "bharat.raj1508@gmail.com", // sender address
    to: email, // list of receivers
    subject: "Very Email", // Subject line
    text: `Hi,
    In order to proceed further, please click on the link below to verify your email address.
    ${process.env.DEV_BASE_URL}/verify-your-email?hash=${hash}`,
    html: `<p> Hi, <p> </br></br>
    In order to proceed further, please click on the link below to verify your email address.</br></br>
    ${process.env.DEV_BASE_URL}/verify-your-email?hash=${hash}`,
  };

  transporter.sendMail(mail_option, (err, info) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/verify-your-email");
    }
  });
};

module.exports = {
  sendEmailVerification,
};
