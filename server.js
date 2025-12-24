// server.js (relevant part)
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");

// Models
const Officer = require("./models/Officer");

// Initialize app
const app = express();

// Middleware
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json()); // parse JSON bodies

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// -----------------------
// Officer registration route
// -----------------------
app.post("/api/register", async (req, res) => {
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
      email,
      password,
      passportUrl, // frontend sends this
    } = req.body;

    // Validate required fields
    if (!surname || !firstname || !gender || !serviceNumber || !state || !lga || !email || !password || !passportUrl) {
      return res.status(400).json({ message: "All fields are required including passport URL." });
    }

    // Check if email already exists
    const existingOfficer = await Officer.findOne({ email });
    if (existingOfficer) return res.status(409).json({ message: "Email already registered" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create officer
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
      email,
      password: hashedPassword,
    });

    const savedOfficer = await newOfficer.save();
    res.status(201).json({ message: "Officer registered successfully", data: savedOfficer });
  } catch (err) {
    console.error("Officer registration error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Test route
app.get("/", (req, res) => res.send("Root API is running!"));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
