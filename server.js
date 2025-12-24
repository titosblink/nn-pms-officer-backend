require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const bcrypt = require("bcryptjs");

// Models
const Officer = require("./models/Officer");

// Routes (if you have separate routes)
const authRouter = require("./routes/auth");
const officerRoutes = require("./routes/officers");

// Initialize app
const app = express();

// Middleware
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

// -----------------------
// MongoDB connection
// -----------------------
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
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
// Multer + Cloudinary storage
// -----------------------
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "passports",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});
const upload = multer({ storage });

// -----------------------
// Routes
// -----------------------

// Auth routes
app.use("/auth", authRouter);

// Officer routes
app.use("/api", officerRoutes);

// Officer registration route
app.post("/api/register", upload.single("passport"), async (req, res) => {
  try {
    const { surname, firstname, othername, gender, religion, serviceNumber, state, lga, email, password } = req.body;

    if (!surname || !firstname || !gender || !serviceNumber || !state || !lga || !email || !password || !req.file) {
      return res.status(400).json({ message: "All fields are required including passport image." });
    }

    const existingOfficer = await Officer.findOne({ email });
    if (existingOfficer) return res.status(409).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newOfficer = new Officer({
      surname,
      firstname,
      othername: othername || "",
      gender,
      religion: religion || "",
      serviceNumber,
      state,
      lga,
      passportUrl: req.file.path, // Cloudinary URL
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

// Serve React frontend
const clientBuildPath = path.join(__dirname, "build");
app.use(express.static(clientBuildPath));
app.get(/.*/, (req, res) => res.sendFile(path.join(clientBuildPath, "index.html")));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
