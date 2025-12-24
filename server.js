require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcryptjs");

// Models
const Officer = require("./models/Officer");
const User = require("./models/User"); // Make sure you have a User model

// Initialize app
const app = express();

// -----------------------
// Middleware
// -----------------------
app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

app.use(
  session({
    name: "nn_pms_session",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),
    cookie: {
      secure: false, // set true only if HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// -----------------------
// MongoDB connection
// -----------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// -----------------------
// Root route
// -----------------------
app.get("/", (req, res) => res.send("Root API is running!"));

// -----------------------
// Officer Registration
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

    await newOfficer.save();
    res.status(201).json({ message: "Officer registered successfully" });
  } catch (err) {
    console.error("Officer registration error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// -----------------------
// Simple User Signup (/api/signup)
// -----------------------
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) return res.status(400).json({ message: "All fields are required" });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ message: "Email already taken" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      status: 1, // default status = 1
    });

    res.status(201).json({ message: "User created successfully", user: { id: newUser._id, name, email, status: 1 } });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// -----------------------
// Login route
// -----------------------
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    // Check in Users table
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    // Save session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      status: user.status,
    };

    res.json({ message: "Login successful", user: req.session.user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// -----------------------
// Auth routes
// -----------------------
app.get("/auth/me", (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
  res.json(req.session.user);
});

app.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("nn_pms_session");
    res.json({ message: "Logged out successfully" });
  });
});

// -----------------------
// Start server
// -----------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
