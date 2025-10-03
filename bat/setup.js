const { execSync } = require("child_process");
const os = require("os");

console.log("Detecting OS...");
const platform = os.platform(); // 'win32' = Windows, 'darwin' = Mac, 'linux' = Linux

try {
  console.log("Initializing project...");
  execSync("npm init -y", { stdio: "inherit" });

  console.log("Installing dependencies...");
  execSync("npm install promptpay-qr qrcode express ejs express-session cookie-parser sqlite3 nodemon", { stdio: "inherit" });

  console.log("✅ Setup completed successfully!");
} catch (err) {
  console.error("❌ Error running setup:", err);
}


// node setup.js

// chmod +x setup.js
// ./setup.js