const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const router = express.Router();

// ----------------------
// USER SIGNUP (/api/signup)
// ----------------------
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ message: "Email already taken" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      status: 1, // always set status = 1
    });

    res.status(201).json({
      message: "User created successfully",
      user: { id: newUser._id, name, email, status: 1 },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------------
// LOGIN (/auth/login)
// ----------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Save session
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
// LOGOUT (/auth/logout)
// ----------------------
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    res.clearCookie("nn_pms_session"); // Make sure cookie name matches session
    res.json({ message: "Logged out successfully" });
  });
});

// ----------------------
// CHECK SESSION (/auth/me)
// ----------------------
router.get("/me", (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: "Not authenticated" });
  res.json(req.session.user);
});

module.exports = router;
