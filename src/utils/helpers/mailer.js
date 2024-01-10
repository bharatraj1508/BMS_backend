const sgMail = require("@sendgrid/mail");
var mailResponse;
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendAccountSetupEmail = async (email, name, token) => {
  const mail_option = {
    to: email,
    from: "no.reply2This@outlook.com",
    subject: "Setup Your Account",
    text: `Hi ${name}},
    Your account has seccessfully created on Building Management System. In order to complete the signup process, please click on the link below to create your password.
    This link will expire in one day.
    ${process.env.DEV_BASE_URL}/register/callback?ut=${token}`,
    html: `<p> Hi, ${name}<p> </br></br>
    <p>Your account has seccessfully created on Building Management System. In order to complete the signup process, please click on the link below to create your password.<p></br>
    <p>This link will expire in one day.</p></br></br>
    ${process.env.DEV_BASE_URL}/register/callback?ut=${token}`,
  };

  try {
    await sgMail.send(mail_option);
    return true;
  } catch (err) {
    throw new Error(err);
  }
};

const sendAccountSetupConfirmation = async (email, name) => {
  const mail_option = {
    to: email,
    from: "no.reply2This@outlook.com",
    subject: "Acount Setup Successfull",
    text: `Hi ${name}},
    Your account has seccessfully setup on Building Management System. Please login to your account with new credentials.`,
    html: `<p> Hi, ${name}<p> </br></br>
    <p>Your account has seccessfully setup on Building Management System. Please login to your account with new credentials.<p></br>`,
  };

  try {
    await sgMail.send(mail_option);
    return true;
  } catch (err) {
    throw new Error(err);
  }
};

const sendPasswordResetEmail = async (email, token) => {
  const mail_option = {
    to: email,
    from: "no.reply2This@outlook.com",
    subject: "Reset Your Password",
    text: `Hi,
    We hace recieved a request to reset your password. If it is not done by you please ignore.
    Click on the link below to reset your password. The link will no longer be available after 15 minutes. 
    ${process.env.DEV_BASE_URL}/password/reset/callback?ut=${token}`,
    html: `<p> Hi, <p> </br></br>
    <p>We hace recieved a request to reset your password. If it is not done by you please ignore.<p></br>
    <p>Click on the link below to reset your password. The link will no longer be available after 15 minutes.</p></br></br>
    ${process.env.DEV_BASE_URL}/password/reset/callback?ut=${token}`,
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

const sendPasswordChangeConfirmation = async (email, name) => {
  const mail_option = {
    to: email,
    from: "no.reply2This@outlook.com",
    subject: "Password Reset Successfully",
    text: `Hi ${name},
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
  sendPasswordResetEmail,
  sendPasswordChangeConfirmation,
  sendAccountSetupEmail,
  sendAccountSetupConfirmation,
};
