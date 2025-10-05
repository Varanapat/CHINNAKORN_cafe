#!/usr/bin/env node
const { execSync } = require("child_process");
const os = require("os");
const path = require("path");

console.log("Detecting OS...");

const platform = os.platform(); // 'win32', 'darwin', 'linux'
switch(platform) {
  case "win32":
    console.log("Running on Windows");
    break;
  case "darwin":
    console.log("Running on macOS");
    break;
  case "linux":
    console.log("Running on Linux");
    break;
  default:
    console.log("Unknown OS:", platform);
}

try {
  // เปลี่ยน directory ไปที่ path ของ setup.js
  process.chdir(path.resolve(__dirname));
  console.log("Current directory:", process.cwd());

  console.log("\nInitializing npm project...");
  execSync("npm init -y", { stdio: "inherit" });

  console.log("\nInstalling dependencies...");
  const deps = [
    "promptpay-qr",
    "qrcode",
    "express",
    "ejs",
    "express-session",
    "cookie-parser",
    "sqlite3",
    "nodemon"
  ];
  execSync(`npm install ${deps.join(" ")}`, { stdio: "inherit" });

  console.log("\n✅ Setup completed successfully!");
} catch (err) {
  console.error("\n❌ Error during setup:", err.message);
  process.exit(1);
}


