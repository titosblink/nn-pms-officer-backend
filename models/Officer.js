const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  surname: { type: String, required: true, trim: true },
  firstname: { type: String, required: true, trim: true },
  othername: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
  },
  password: { type: String, required: true, minlength: 6 },
  status: { type: Number, enum: [1, 2, 3], required: true }
});

module.exports = mongoose.model("User", userSchema);
