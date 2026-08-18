const express = require("express");
const router = express.Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");

const makeToken = (user) => jwt.sign({ id: user._id.toString(), name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "Name, email and password are required" });
    if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ message: "Email already registered" });
    const user = await User.create({ name: name.trim(), email: normalizedEmail, password: await bcrypt.hash(password, 10) });
    res.status(201).json({ message: "Account created", token: makeToken(user), user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) { res.status(500).json({ message: "Registration failed", error: err.message }); }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(password || "", user.password))) return res.status(401).json({ message: "Invalid email or password" });
    res.json({ token: makeToken(user), user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) { res.status(500).json({ message: "Login failed", error: err.message }); }
});

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("name email createdAt");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

module.exports = router;
