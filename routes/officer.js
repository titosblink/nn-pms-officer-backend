const express = require("express");
const bcrypt = require("bcryptjs");
const Officer = require("../models/Officer");
const router = express.Router();

// -----------------------
// OFFICER REGISTRATION (/api/register)
// -----------------------
router.post("/register", async (req, res) => {
  try {
    const {
      surname,
      firstname,
      othername,
      gender,
      religion,
      serviceNumber,
      state,
      lga,
      passportUrl,
    } = req.body;

    if (!surname || !firstname || !gender || !serviceNumber || !state || !lga || !passportUrl) {
      return res.status(400).json({ message: "All fields are required including passport URL." });
    }

    const existingOfficer = await Officer.findOne({ serviceNumber });
    if (existingOfficer) return res.status(409).json({ message: "Email already registered" });

    const newOfficer = new Officer({
      surname,
      firstname,
      othername,
      gender,
      religion,
      serviceNumber,
      state,
      lga,
      passportUrl,
    });

    await newOfficer.save();
    res.status(201).json({ message: "Officer registered successfully" });
  } catch (err) {
    console.error("Officer registration error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
