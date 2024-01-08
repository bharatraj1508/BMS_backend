const sgMail = require("@sendgrid/mail");
var mailResponse;
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmailVerification = async (email, token) => {
  const mail_option = {
    to: email,
    from: "no.reply2This@outlook.com",
    subject: "Email Verification",
    text: `Hi,
    In order to proceed further, please click on the link below to verify your email address.
    This link will expire in 15 minutes.
    ${process.env.DEV_BASE_URL}/verification?token=${token}`,
    html: `<p> Hi, <p> </br></br>
    <p>In order to proceed further, please click on the link below to verify your email address.<p></br>
    <p>This link will expite in 15 minutes.</p></br></br>
    ${process.env.DEV_BASE_URL}/verification?token=${token}`,
  };

  try {
    await sgMail
      .send(mail_option)
      .then((response) => (mailResponse = response))
      .catch((err) => console.log(err));

    return mailResponse;
  } catch (err) {
    throw new Error(err.message);
  }
};

const sentPasswordResetEmail = async (email, token) => {
  const mail_option = {
    to: email,
    from: "no.reply2This@outlook.com",
    subject: "Reset Your Password",
    text: `Hi,
    We hace recieved a request to reset your password. If it is not done by you please ignore.
    Click on the link below to reset your password. The link will no longer be available after 15 minutes. 
    ${process.env.DEV_BASE_URL}/password/reset/callback?token=${token}`,
    html: `<p> Hi, <p> </br></br>
    <p>We hace recieved a request to reset your password. If it is not done by you please ignore.<p></br>
    <p>Click on the link below to reset your password. The link will no longer be available after 15 minutes.</p></br></br>
    ${process.env.DEV_BASE_URL}/password/reset/callback?token=${token}`,
  };

  try {
    await sgMail
      .send(mail_option)
      .then((response) => (mailResponse = response))
      .catch((err) => console.log(err));

    return mailResponse;
  } catch (err) {
    throw new Error(err.message);
  }
};

const sendPasswordChangeConfirmation = async (email) => {
  const mail_option = {
    to: email,
    from: "no.reply2This@outlook.com",
    subject: "Password Reset Successfully",
    text: `Hi,
    This is to confirm that the password for your account has been successfully changed. Your account is now secured with the new password that you have set.
    If you did not change your password, please contact us immediately to report any unauthorized access to your account.`,
    html: `<p> Hi, <p> </br></br>
    <p>This is to confirm that the password for your account has been successfully changed. Your account is now secured with the new password that you have set.<p></br>
    <p> If you did not change your password, please contact us immediately to report any unauthorized access to your account.</p>`,
  };

  try {
    await sgMail
      .send(mail_option)
      .then((response) => (mailResponse = response))
      .catch((err) => console.log(err));

    return mailResponse;
  } catch (err) {
    throw new Error(err.message);
  }
};

module.exports = {
  sendEmailVerification,
  sentPasswordResetEmail,
  sendPasswordChangeConfirmation,
};
