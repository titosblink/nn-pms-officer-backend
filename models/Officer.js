const mongoose = require("mongoose");

const officerSchema = new mongoose.Schema(
  {
    surname: { type: String, required: true },
    firstname: { type: String, required: true },
    othername: { type: String },
    gender: { type: String, required: true },
    religion: { type: String },
    serviceNumber: { type: String, required: true },
    state: { type: String, required: true },
    lga: { type: String, required: true },
    passportUrl: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Officer", officerSchema);
