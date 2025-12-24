require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcryptjs");

// Models
const Officer = require("./models/Officer");

// Initialize app
const app = express();

// Middleware
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

app.use(
  session({
    name: "nn_pms_session",
    secret: process.env.SESSION_SECRET || "supersecretkey",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);


// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// -----------------------
// Officer registration
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
      passportUrl,
    } = req.body;

    if (!surname || !firstname || !gender || !serviceNumber || !state || !lga || !email || !password || !passportUrl) {
      return res.status(400).json({ message: "All fields are required including passport URL." });
    }

    const existingOfficer = await Officer.findOne({ email });
    if (existingOfficer) return res.status(409).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);

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

// -----------------------
// Login route
// -----------------------
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const officer = await Officer.findOne({ email });
    if (!officer) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, officer.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    req.session.officer = { id: officer._id, email: officer.email, name: officer.firstname };

    res.json({ token: "session-based-auth", user: req.session.officer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// -----------------------
// Auth routes
// -----------------------
app.get("/auth/me", (req, res) => {
  if (!req.session.officer) return res.status(401).json({ message: "Not authenticated" });
  res.json(req.session.officer);
});

app.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("nn_pms_session");
    res.json({ message: "Logged out successfully" });
  });
});

// -----------------------
// Test route
// -----------------------
app.get("/", (req, res) => res.send("Root API is running!"));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
