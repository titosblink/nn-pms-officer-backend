const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();


// ----------------------
// SIGNUP
// ----------------------
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, status } = req.body;

    // 1. Validate fields
    if (!name || !email || !password || !status) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2. Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already taken" });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create new user
    const newUser = await User.create({ name, email, password: hashedPassword, status });

    // 5. Automatically create session
    req.session.user = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      status: newUser.status,
    };

    // 6. Send response
    res.status(201).json({
      message: "User created and logged in successfully",
      user: req.session.user,
    });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});





// ----------------------
// LOGIN
// ----------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Save user session
    req.session.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      status: user.status,
    };

    res.status(200).json({
      message: "Login successful",
      user: req.session.user,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------------
// LOGOUT
// ----------------------
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    res.clearCookie("nn_pms_session"); // Make sure cookie name matches session
    res.json({ message: "Logged out successfully" });
  });
});

// ----------------------
// CHECK SESSION
// ----------------------
router.get("/me", (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
  res.json(req.session.user);
});

module.exports = router;
