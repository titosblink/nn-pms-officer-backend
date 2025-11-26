const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ⭐ ADD THIS ⭐
const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);
// ⭐ END ADD ⭐

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer-Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "passports",
    allowed_formats: ["jpg", "png", "jpeg"]
  }
});

const upload = multer({ storage });

// Define Officer schema
const officerSchema = new mongoose.Schema({
  surname: { type: String, required: true },
  firstname: { type: String, required: true },
  othername: { type: String },
  gender: { type: String, required: true },
  religion: { type: String },
  serviceNumber: { type: String, required: true },
  state: { type: String, required: true },
  lga: { type: String, required: true },
  passportUrl: { type: String, required: true }
}, { timestamps: true });

const Officer = mongoose.model("Officer", officerSchema);

// Register officer
app.post("/api/register", upload.single("passport"), async (req, res) => {
  try {
    const { surname, firstname, othername, gender, religion, serviceNumber, state, lga } = req.body;

    if (!surname || !firstname || !gender || !serviceNumber || !state || !lga || !req.file) {
      return res.status(400).json({ message: "Please fill all required fields." });
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
      passportUrl: req.file.path
    });

    const savedOfficer = await newOfficer.save();
    res.status(201).json({ message: "Officer saved successfully", data: savedOfficer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
