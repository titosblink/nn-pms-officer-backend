const express = require("express");
const router = express.Router();
const Officer = require("../models/Officer");

// POST /api/register
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
      passportUrl
    } = req.body;

    // Validate required fields
    if (!surname || !firstname || !gender || !serviceNumber || !state || !lga || !passportUrl) {
      return res.status(400).json({ message: "All required fields must be filled." });
    }

    const newOfficer = new Officer({
      surname,
      firstname,
      othername,
      gender,
      religion,
      serviceNumber,
      state,
      lga,
      passportUrl
    });

    const savedOfficer = await newOfficer.save();
    res.status(201).json({ message: "Officer saved successfully", data: savedOfficer });
  } catch (err) {
    console.error("Error saving officer:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
