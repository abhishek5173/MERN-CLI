#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const projectname = process.argv[2];

if(!projectname) {
    console.log("Please provide a project name.");
    process.exit(1);
}

const root = path.join(process.cwd(), projectname);

console.log(`Creating project ${projectname}...`);

fs.mkdirSync(root);
fs.mkdirSync(path.join(root, "frontend"));
fs.mkdirSync(path.join(root, "backend"));

console.log("Setting up NextJs frontend...");
execSync(`npx create-next-app@latest frontend`, {
    cwd: root,
    stdio: "inherit"
});

console.log("Setting up Express backend...");
execSync(`npm init -y`, {
    cwd: path.join(root,"backend"),
    stdio: "inherit"
})

execSync(`npm install express mongoose cors dotenv`, {
    cwd: path.join(root,"backend"),
    stdio: "inherit"
})


fs.writeFileSync(path.join(root, "backend", "server.js"), 
`
const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000;

app.get("/api", (req, res) => {
    res.json({ message: "Hello from the backend! V1" });
});

app.listen(PORT, () => {
    console.log(\`Server is running on port \${PORT}\`);
});
`)

console.log("Project setup complete!"); 
