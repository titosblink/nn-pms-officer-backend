require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const authRouter = require("./routes/auth");
const officerRouter = require("./routes/officer");

const app = express();


// 2. MUST BE BEFORE ROUTES: Body Parser
app.use(express.json());

// 3. SESSION CONFIG (Required for /auth/me or session-based login)
app.use(
  session({
    name: "nn_pms_session",
    secret: process.env.SESSION_SECRET || "fallback_secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production", // Auto-set to true on Heroku
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// 1. MUST BE FIRST: CORS configuration
// Note: When credentials is true, origin cannot be "*"
app.use(cors({
  origin: "https://nn-pms-officer-frontend-h5il.vercel.app", // Change this to your actual frontend URL
  credentials: true
}));


// 4. ROUTES (Moved below middleware)
app.use("/auth", authRouter);
app.use("/api", authRouter);
app.use("/api/officer", officerRouter);

// Root route
app.get("/", (req, res) => res.send("API is running!"));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));