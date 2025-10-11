@echo off
echo Initializing project...
cd /d %~dp0
npm init -y

echo Installing dependencies...
npm install promptpay-qr qrcode express ejs express-session cookie-parser sqlite3 nodemon

echo Done!
pause