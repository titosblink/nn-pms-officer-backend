// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// -----------------------
// App initialization
// -----------------------
const app = express();

// -----------------------
// Middleware
// -----------------------
app.use(express.json());
app.use(cors({ origin: "*", credentials: true }));

// -----------------------
// MongoDB connection
// -----------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// -----------------------
// Cloudinary configuration
// -----------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// -----------------------
// Multer + Cloudinary Storage
// -----------------------
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "passports",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});
const upload = multer({ storage });

// -----------------------
// Officer Model
// -----------------------
const officerSchema = new mongoose.Schema(
  {
    surname: { type: String, required: true },
    firstname: { type: String, required: true },
    othername: String,
    gender: { type: String, required: true },
    religion: String,
    serviceNumber: { type: String, required: true },
    state: { type: String, required: true },
    lga: { type: String, required: true },
    passportUrl: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true }, // hashed password
  },
  { timestamps: true }
);

const Officer = mongoose.model("Officer", officerSchema);

// -----------------------
// Routes
// -----------------------

// Test root
app.get("/", (req, res) => {
  res.send("Root API is running!");
});

// -----------------------
// Officer Registration
// -----------------------
app.post("/api/register", upload.single("passport"), async (req, res) => {
  try {
    const { surname, firstname, gender, serviceNumber, state, lga, email, password } = req.body;

    if (!surname || !firstname || !gender || !serviceNumber || !state || !lga || !req.file || !email || !password) {
      return res.status(400).json({ message: "Please fill all required fields." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newOfficer = new Officer({
      surname,
      firstname,
      othername: req.body.othername,
      gender,
      religion: req.body.religion,
      serviceNumber,
      state,
      lga,
      passportUrl: req.file.path,
      email,
      password: hashedPassword,
    });

    const savedOfficer = await newOfficer.save();

    res.status(201).json({ message: "Officer registered successfully", data: savedOfficer });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// -----------------------
// Officer Login
// -----------------------
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const officer = await Officer.findOne({ email });
    if (!officer) return res.status(404).json({ message: "Officer not found" });

    const isMatch = await bcrypt.compare(password, officer.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid password" });

    // Generate JWT
    const token = jwt.sign({ id: officer._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ message: "Login successful", token, user: officer });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// -----------------------
// Serve React frontend
// -----------------------
app.use(express.static(path.join(__dirname, "build")));

// React fallback (must be last)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// -----------------------
// Start server
// -----------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
