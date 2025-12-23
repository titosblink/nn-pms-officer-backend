const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// -----------------------
// App initialization (FIRST)
// -----------------------
const app = express();

// -----------------------
// Middleware
// -----------------------
app.use(express.json());
app.use(cors({ origin: "*", credentials: true }));

// -----------------------
// Routes
// -----------------------
const authRoutes = require("./routes/auth");
// const userRoutes = require("./routes/users"); // uncomment if exists

app.use("/auth", authRoutes);
// app.use("/users", userRoutes);

// -----------------------
// MongoDB
// -----------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// -----------------------
// Cloudinary
// -----------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// -----------------------
// Multer Storage
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
const officerSchema = new mongoose.Schema({
  surname: String,
  firstname: String,
  othername: String,
  gender: String,
  religion: String,
  serviceNumber: String,
  state: String,
  lga: String,
  passportUrl: String,
}, { timestamps: true });

const Officer = mongoose.model("Officer", officerSchema);

// -----------------------
// Officer Registration
// -----------------------
app.post("/api/register", upload.single("passport"), async (req, res) => {
  try {
    const officer = new Officer({
      ...req.body,
      passportUrl: req.file.path,
    });

    await officer.save();
    res.status(201).json({ message: "Officer saved successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// -----------------------
// Serve React frontend
// -----------------------
app.use(express.static(path.join(__dirname, "build")));

// 🔑 React SPA fallback (THIS FIXES REFRESH 404)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// -----------------------
// Start server (LAST)
// -----------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
