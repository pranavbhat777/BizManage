# BizManage Remote Sharing Guide

This guide helps you share your BizManage application with others remotely using ngrok or localtunnel.

## 🌐 Quick Setup Options

### **Option 1: ngrok (Recommended)**
```bash
# Install ngrok globally
npm install -g ngrok

# Start your backend
cd server && npm start

# In another terminal, create tunnel
ngrok http 5000

# You'll get a URL like: https://abc123.ngrok.io
```

### **Option 2: localtunnel**
```bash
# Install localtunnel globally
npm install -g localtunnel

# Start your backend
cd server && npm start

# In another terminal, create tunnel
lt --port 5000

# You'll get a URL like: https://abc123.loca.lt
```

### **Option 3: Built-in Server (Now Available!)**
Your backend now serves the frontend automatically! Just start the server:

```bash
cd server && npm start
```

Then access at: `http://localhost:5000` or share your `localhost:5000`

---

## 🚀 Step-by-Step Sharing

### **1. Start Backend Server**
```bash
cd c:\Users\prana\OneDrive\Desktop\coding\BizManage\server
npm start
```

**Output:**
```
🚀 Server running on port 5000
📊 Environment: development
🔗 Health check: http://localhost:5000/api/health
🌍 Allowing origin: https://abc123.ngrok.io
```

### **2. Create Public URL (ngrok)**
```bash
# New terminal
ngrok http 5000
```

**You'll see:**
```
ngrok by @inconshreveable

Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.0.0
Region                        United States (us-cal-1)
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123-def456.ngrok.io -> http://localhost:5000
```

### **3. Share Your Application**
**Share this URL with others:**
`https://abc123-def456.ngrok.io`

**They can access:**
- Full BizManage application
- All features (employees, payroll, products, etc.)
- Real-time data synchronization

---

## 📱 Mobile App Testing

### **Update Mobile App API URL**
Update your mobile app to use the ngrok URL:

**Method 1: Environment Variable**
```bash
# In .env.mobile
REACT_APP_API_URL=https://abc123-def456.ngrok.io
```

**Method 2: Rebuild APK**
```bash
# Update environment
npm run build

# Rebuild mobile app
npx cap sync
npx cap open android
```

---

## 🔧 Advanced Configuration

### **Custom ngrok Configuration**
```bash
# Reserve custom subdomain (paid)
ngrok http 5000 --subdomain=bizmanage

# Get: https://bizmanage.ngrok.io
```

### **Authentication**
```bash
# Add authentication to ngrok
ngrok http 5000 --auth="username:password"

# Share: https://username:password@abc123.ngrok.io
```

### **Multiple Tunnels**
```bash
# Create config file
ngrok config add-authtoken YOUR_AUTH_TOKEN

# Start multiple tunnels
ngrok start --all
```

---

## 🌍 Dynamic CORS Configuration

Your server now allows **all origins** in development mode:

```javascript
// In server.js - Already configured!
if (process.env.NODE_ENV === 'development') {
  // Allow all origins for easy sharing
  console.log('🌍 Allowing origin:', origin);
  callback(null, true);
}
```

**Benefits:**
- ✅ No CORS errors
- ✅ Easy sharing with anyone
- ✅ Works with ngrok, localtunnel, etc.
- ✅ Mobile app can connect

---

## 📊 Server Information

### **Health Check Endpoint**
Access: `http://localhost:5000/api/health`

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development",
  "server_url": "http://localhost:5000",
  "frontend_url": "http://localhost:5000"
}
```

### **Available Routes**
- **Frontend**: `http://localhost:5000/`
- **API**: `http://localhost:5000/api/*`
- **Health**: `http://localhost:5000/api/health`

---

## 🔄 Automatic Sharing Script

Create `share.sh` for easy sharing:

```bash
#!/bin/bash
echo "🚀 Starting BizManage sharing..."

# Start backend in background
cd server && npm start &

# Wait for server to start
sleep 3

# Create ngrok tunnel
echo "🌐 Creating public URL..."
ngrok http 5000 --log=stdout &
sleep 2

# Get ngrok URL
NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | jq -r '.tunnels[0].public_url')

echo "✅ Your BizManage is live at:"
echo "🔗 Frontend: $NGROK_URL"
echo "🔗 API: $NGROK_URL/api"
echo "📱 Mobile API URL: $NGROK_URL/api"
echo ""
echo "Share this URL with others: $NGROK_URL"
echo ""
echo "Mobile app users should update REACT_APP_API_URL to: $NGROK_URL"
```

**Make it executable:**
```bash
chmod +x share.sh
./share.sh
```

---

## 🎯 Use Cases

### **1. Share with Team Members**
```
1. Run ./share.sh
2. Send the ngrok URL to your team
3. They can access full BizManage application
4. Real-time collaboration on same data
```

### **2. Client Demonstrations**
```
1. Start sharing server
2. Share URL with clients
3. They can test all features
4. No installation required
```

### **3. Remote Development**
```
1. Share with remote developers
2. Collaborate on same instance
3. Test mobile app with remote API
4. Real-time debugging
```

### **4. Mobile App Testing**
```
1. Start sharing server
2. Update mobile app API URL
3. Test mobile app with real server
4. Share APK with testers
```

---

## 🔐 Security Considerations

### **Development Mode**
- ✅ CORS allows all origins
- ⚠️ Use only for development
- 🔒 Production has restricted origins

### **ngrok Security**
- ✅ HTTPS encryption
- ✅ Random subdomain
- ⚠️ Publicly accessible
- 💡 Use auth for sensitive demos

### **Recommendations**
```bash
# For temporary sharing (development)
ngrok http 5000

# For production deployment
Deploy to Render/Vercel (see DEPLOYMENT_GUIDE.md)
```

---

## 📋 Quick Commands Reference

```bash
# Start server
cd server && npm start

# Start sharing (ngrok)
ngrok http 5000

# Start sharing (localtunnel)
lt --port 5000

# Check server status
curl http://localhost:5000/api/health

# Test API endpoint
curl http://localhost:5000/api/health

# Mobile app build
npm run build && npx cap sync
```

---

## 🎉 Success!

Your BizManage application is now:

- ✅ **Remotely Accessible**: Share URL with anyone
- ✅ **Mobile Ready**: API works with mobile app
- ✅ **CORS Safe**: No cross-origin issues
- ✅ **Full Featured**: All modules available
- ✅ **Real-time**: Live data synchronization

**Share this URL:**
`https://your-ngrok-url.ngrok.io`

**Others can now:**
- Use complete BizManage application
- Test all features without installation
- Connect mobile apps to your server
- Collaborate in real-time

**Next Steps:**
1. Deploy to production for permanent access
2. Set up custom domain
3. Configure SSL certificates
4. Add user authentication
