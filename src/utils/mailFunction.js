// const promise = require("promise");
// const nodemailer = require("nodemailer");
const sgMail = require("@sendgrid/mail");

const sendEmailVerification = async (res, email, token) => {
  // const transporter = nodemailer.createTransport({
  //   service: "Gmail",
  //   auth: {
  //     user: "bharat.raj1508@gmail.com",
  //     pass: process.env.MAILER_PASS,
  //   },
  // });
  var mailResponse;

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const mail_option = {
    to: email,
    from: "no.reply2This@outlook.com",
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

  await sgMail
    .send(mail_option)
    .then((response) => (mailResponse = response))
    .catch((err) => console.log(err));

  // await new promise((resolve, reject) => {
  //   transporter.sendMail(mail_option, (err, info) => {
  //     if (err) {
  //       console.log(err);
  //       reject(err);
  //     } else {
  //       resolve(info);
  //       res.redirect("/verification");
  //     }
  //   });
  // });

  return mailResponse;
};

module.exports = {
  sendEmailVerification,
};
