require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// -----------------------
// Models
// -----------------------
const Officer = require("./models/Officer");

// -----------------------
// Routes
// -----------------------
const authRouter = require("./routes/auth");

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
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

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

// User routes
app.use("/auth", authRouter);

// Test routes
app.get("/", (req, res) => res.send("Root API is running!"));
app.get("/ping", (req, res) => res.send("pong"));

// Officer registration
app.post("/api/register", upload.single("passport"), async (req, res) => {
  try {
    const { surname, firstname, othername, gender, religion, serviceNumber, state, lga, email, password } = req.body;

    if (!surname || !firstname || !gender || !serviceNumber || !state || !lga || !req.file || !email || !password) {
      return res.status(400).json({ message: "Please fill all required fields." });
    }

    const existingOfficer = await Officer.findOne({ email });
    if (existingOfficer) return res.status(409).json({ message: "Email already registered" });

    const bcrypt = require("bcryptjs");
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

// Serve React frontend
const clientBuildPath = path.join(__dirname, "build");
app.use(express.static(clientBuildPath));
app.get(/.*/, (req, res) => res.sendFile(path.join(clientBuildPath, "index.html")));

// -----------------------
// Start server
// -----------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const officerRoutes = require("./routes/officers");


// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // serve uploaded files

// Routes
app.use("/api", officerRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));



