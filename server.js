// -----------------------
// server.js
// -----------------------

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// -----------------------
// Models
// -----------------------
const User = require("./models/User"); // For /auth/signup
const Officer = require("./models/Officer"); // For /api/register (if separate file)

// -----------------------
// Routes
// -----------------------
const authRouter = require("./routes/auth"); // Handles login/signup for User

// -----------------------
// App initialization
// -----------------------
const app = express();

// -----------------------
// Middleware
// -----------------------
app.use(express.json()); // Must be before routes
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
// Routes
// -----------------------

// Mount auth router first (User login/signup)
app.use("/auth", authRouter);

// Root test route
app.get("/", (req, res) => res.send("Root API is running!"));
app.get("/ping", (req, res) => res.send("pong"));

// -----------------------
// Officer Registration Route
// -----------------------
app.post("/api/register", upload.single("passport"), async (req, res) => {
  try {
    const { surname, firstname, gender, serviceNumber, state, lga, email, password } = req.body;

    // Check required fields
    if (!surname || !firstname || !gender || !serviceNumber || !state || !lga || !req.file || !email || !password) {
      return res.status(400).json({ message: "Please fill all required fields." });
    }

    // Check if officer email already exists
    const existingOfficer = await Officer.findOne({ email });
    if (existingOfficer) return res.status(409).json({ message: "Email already registered" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Officer
    const newOfficer = new Officer({
      surname,
      firstname,
      othername: req.body.othername || "",
      gender,
      religion: req.body.religion || "",
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
    console.error("Officer registration error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// -----------------------
// Serve React frontend
// -----------------------
const clientBuildPath = path.join(__dirname, "build"); // adjust if your React build is elsewhere
app.use(express.static(clientBuildPath));

// Catch-all route
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

// -----------------------
// Start server
// -----------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
