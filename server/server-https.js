const https = require('https');
const fs = require('fs');
const app = require('./server');

// SSL Certificate options
const options = {
  key: fs.existsSync('./key.pem') ? fs.readFileSync('./key.pem') : null,
  cert: fs.existsSync('./cert.pem') ? fs.readFileSync('./cert.pem') : null
};

if (options.key && options.cert) {
  // Start HTTPS server
  https.createServer(options, app).listen(5001, () => {
    console.log('🔒 Secure server running on https://localhost:5001');
    console.log('📱 Payment gateway ready for secure transactions');
  });
} else {
  console.log('⚠️  SSL certificates not found');
  console.log('📋 Run: node setup_https.js for setup instructions');
  console.log('🌐 Starting HTTP server on port 5000');
  app.listen(5000, () => {
    console.log('🚀 Server running on http://localhost:5000');
  });
}