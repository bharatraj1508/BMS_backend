const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const createdByUserSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  createdOn: Date,
});

const updatedByUserSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  updatedOn: Date,
});

// Defining the user schema
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  accountType: {
    type: String,
    enum: ["user", "admin", "superadmin"],
  },
  building: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isSuperAdmin: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  isSupervisor: {
    type: Boolean,
    default: false,
  },
  isManager: {
    type: Boolean,
    default: false,
  },
  isSecurity: {
    type: Boolean,
    default: false,
  },
  isResident: {
    type: Boolean,
    default: false,
  },
  userCreatedby: createdByUserSchema,
  lastUpdatedBy: updatedByUserSchema,
});

// Middleware function executed before saving the user
userSchema.pre("save", function (next) {
  const user = this;

  // Checking if the password is modified
  if (!user.isModified("password")) {
    return next();
  }

  // Generating a salt and hashing the password
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      return next(err);
    }

    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) {
        return next(err);
      }

      // Setting the hashed password
      user.password = hash;
      next();
    });
  });
});

// Method to compare passwords
userSchema.methods.comparePassword = function (userPassword) {
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
      .catch((err) => console.log(err.message));
  });
};

// Creating the User model
mongoose.model("User", userSchema);
