const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const authRoutes = require("./routes/auth"); // Import auth routes

const app = express();

// -----------------------
// Middleware
// -----------------------
app.use(express.json());

// -----------------------
// CORS configuration for frontend
// -----------------------
app.use(
  cors({
    origin: "*", // Replace "*" with your frontend URL in production
    credentials: true,
  })
);

// -----------------------
// Root route for testing
// -----------------------
app.get("/", (req, res) => {
  res.send("Root API is running!");
});

// -----------------------
// MongoDB connection
// -----------------------
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
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

const Officer = mongoose.model("Officer", officerSchema);

// -----------------------
// Officer Registration Route
// -----------------------
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
      passportUrl: req.file.path,
    });

    const savedOfficer = await newOfficer.save();

    res.status(201).json({ message: "Officer saved successfully", data: savedOfficer });
  } catch (err) {
    console.error("Register Officer Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// -----------------------
// Auth routes
// -----------------------
// app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);
// -----------------------
// Start Server
// -----------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
