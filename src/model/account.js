const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Defining the user schema
const accountSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
      },
      email: {
        type: String
      },
      password: {
        type: String
      }
});

// Method to compare passwords
accountSchema.methods.comparePassword = function (userPassword) {
    const user = this;
  
    return new Promise((resolve, reject) => {
      // Comparing the provided password with the stored hashed password
      bcrypt
        .compare(userPassword, user.password)
        .then((isCompared) => {
          if (isCompared) {
            return resolve(isCompared);
          } else {
            return reject(!isCompared);
          }
        })
        .catch((err) => res.send(err.message));
    });
  };

// Creating the User model
mongoose.model("Account", accountSchema);