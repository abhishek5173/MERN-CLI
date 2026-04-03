#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const projectname = process.argv[2];

if (!projectname) {
  console.log("Please provide a project name.");
  process.exit(1);
}

const root = path.join(process.cwd(), projectname);

if (fs.existsSync(root)) {
  console.log(`Project ${projectname} already exists.`);
  process.exit(1);
}

console.log(`🚀 Creating project ${projectname}...`);

fs.mkdirSync(root);
fs.mkdirSync(path.join(root, "backend"));

console.log("📦Setting up NextJs frontend...");
execSync(`npx create-next-app@latest frontend`, {
  cwd: root,
  stdio: "inherit",
});

const backendpath = path.join(root, "backend");

console.log("⚙️ Setting up Express backend...");
execSync(`npm init -y`, {
  cwd: backendpath,
  stdio: "inherit",
});

execSync(`npm install express mongoose cors dotenv bcryptjs jsonwebtoken`, {
  cwd: backendpath,
  stdio: "inherit",
});

fs.mkdirSync(path.join(backendpath, "config"));
fs.mkdirSync(path.join(backendpath, "routes"));
fs.mkdirSync(path.join(backendpath, "models"));
fs.mkdirSync(path.join(backendpath, "controllers"));
fs.mkdirSync(path.join(backendpath, "middleware"));
fs.mkdirSync(path.join(backendpath, "utils"));

fs.writeFileSync(
  path.join(backendpath, "models", "user.model.js"),
  `
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
`,
);

fs.writeFileSync(
  path.join(backendpath, "controllers", "auth.controller.js"),
  `
const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");

// Register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, password: hashed });

    res.json({
      _id: user._id,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid creds" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid creds" });

    res.json({
      _id: user._id,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
`,
);

fs.writeFileSync(
  path.join(backendpath, "middleware", "auth.middleware.js"),
  `
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};
`,
);

fs.writeFileSync(
  path.join(backendpath, "utils", "generateToken.js"),
  `
const jwt = require("jsonwebtoken");

module.exports = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};
`,
);

fs.writeFileSync(
  path.join(backendpath, "config", "db.js"),
  `const mongoose = require("mongoose");
const connectDB = async () => {
    try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
    } catch (error) {
    console.error("MongoDB connection error:", error); 
    process.exit(1);
    }};
    module.exports = connectDB;`,
);

fs.writeFileSync(
  path.join(backendpath, ".env"),
  `
PORT=5000
MONGO_URI=mongodb://localhost:27017/mydb
JWT_SECRET=supersecret
`,
);

fs.writeFileSync(
  path.join(backendpath, "routes", "api.js"),
  `
    const express = require("express");
    const router = express.Router();

    router.use("/auth", require("./auth.routes"));

    router.get("/hello", (req, res) => {
        res.json({ message: "Hello from the API!" });
    });

    module.exports = router;
    
    `,
);

fs.writeFileSync(
  path.join(backendpath, "routes", "auth.routes.js"),
  `
const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/auth.controller");
const protect = require("../middleware/auth.middleware");

router.post("/register", register);
router.post("/login", login);

router.get("/me", protect, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
`,
);

fs.writeFileSync(
  path.join(backendpath, "server.js"),
  `
require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000;
const connectDB = require("./config/db");
const apiRoutes = require("./routes/api");
const cors = require("cors");

connectDB();

app.use(cors());
app.use(express.json());
app.use("/api", apiRoutes);

app.listen(PORT, () => {
    console.log(\`🚀Server is running on port \${PORT}\`);
});
`,
);

console.log("✅ Project setup complete!");

console.log(`
👉 Next steps:

cd ${projectname}

# frontend
cd frontend && npm run dev

# backend
cd ../backend && node server.js
`);
