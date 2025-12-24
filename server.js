require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");

// Routers
const authRouter = require("./routes/auth");
const officerRouter = require("./routes/officer");

const app = express();
app.use("/api/officer", officerRouter);

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
      secure: false, // true only if using HTTPS
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
// Routes
// -----------------------
app.use("/api", authRouter);      // /api/signup
app.use("/auth", authRouter);     // /auth/login, /auth/me, /auth/logout
app.use("/api", officerRouter);   // /api/register for officers

// Root route
app.get("/", (req, res) => res.send("API is running!"));

// -----------------------
// Start server
// -----------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));