const mongoose = require("mongoose");

const officerSchema = new mongoose.Schema({
  surname: { type: String, required: true, trim: true },
  firstname: { type: String, required: true, trim: true },
  othername: { type: String, trim: true },
  gender: { type: String, required: true },
  religion: { type: String, trim: true },
  serviceNumber: { type: String, required: true },
  state: { type: String, required: true },
  lga: { type: String, required: true },
  passportUrl: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
  },
  password: { type: String, required: true, minlength: 6 },
}, { timestamps: true });

module.exports = mongoose.models.Officer || mongoose.model("Officer", officerSchema);
