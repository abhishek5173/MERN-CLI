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

execSync(`npm install express mongoose cors dotenv`, {
  cwd: backendpath,
  stdio: "inherit",
})

fs.mkdirSync(path.join(backendpath, "config"));
fs.mkdirSync(path.join(backendpath, "routes"));
fs.mkdirSync(path.join(backendpath, "models"));
fs.mkdirSync(path.join(backendpath, "controllers"));

fs.writeFileSync(
  path.join(backendpath, "config", "db.js"),
  `
const mongoose = require("mongoose");
const connectDB = async () => {
    try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
    } catch (error) {
    console.error("MongoDB connection error:", error); 
    process.exit(1);
    }};
    module.exports = connectDB;
`,
);

fs.writeFileSync(
    path.join(backendpath, ".env"),
    `
MONGO_URI=your_mongodb_connection_string_here
PORT=5000
`,
)

fs.writeFileSync(
    path.join(backendpath, "routes", "api.js"),
    `
    const express = require("express");
    const router = express.Router();

    router.get("/hello", (req, res) => {
        res.json({ message: "Hello from the API!" });
    });

    module.exports = router;
    
    `
)

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
