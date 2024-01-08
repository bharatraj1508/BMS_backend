const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const byUserSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  timestamp: Date,
});

const buildingSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  name: {
    type: String,
    default: "",
  },
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
  building: [
    {
      type: buildingSchema,
      default: [],
    },
  ],
  isVerified: {
    type: Boolean,
    default: false,
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
  userCreatedby: byUserSchema,
  lastUpdatedBy: byUserSchema,
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

// Middleware function executed before updating the user
userSchema.pre("updateOne", function (next) {
  const update = this._update;

  // Check if the password is being modified in the update
  if (!update || !update.password) {
    return next();
  }

  // Generate a salt and hash the new password
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      return next(err);
    }

    bcrypt.hash(update.password, salt, (err, hash) => {
      if (err) {
        return next(err);
      }

      // Set the hashed password in the update
      update.password = hash;
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
