const crypto = require("crypto");
const mongoose = require("mongoose");
const HashTable = mongoose.model("Hash");
const User = mongoose.model("User");

const randomString = (length) => {
  return crypto.randomBytes(Math.ceil(length / 2)).toString("hex");
};

const setHashRecord = async (hashValue, id) => {
  try {
    const hash = new HashTable({ userId: id, hash: hashValue });
    await hash.save();
    return true;
  } catch (err) {
    throw new Error(err.message);
  }
};

const compareHashAndReturnId = async (hash) => {
  try {
    const hashDoc = await HashTable.findOne({ hash });

    if (hashDoc) {
      const user = await User.findById(hashDoc.userId);

      if (user) {
        return user._id;
      }
    }
    return null;
  } catch (err) {
    throw new Error(err.message);
  }
};

module.exports = {
  randomString,
  compareHashAndReturnId,
  setHashRecord,
};
