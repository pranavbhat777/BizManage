# BizManage Android APK Deployment Guide

This guide will help you convert your BizManage React web app into an Android APK using Capacitor.

## 🏗️ Prerequisites

1. **Android Studio** installed (latest version recommended)
2. **Java Development Kit (JDK)** 11 or higher
3. **Android SDK** with API level 33+
4. **Node.js** and npm installed
5. **Git** for version control

---

## 📋 Step-by-Step Commands

### **1. Install Capacitor Dependencies**
```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/splash-screen @capacitor/status-bar @capacitor/app
```

### **2. Initialize Capacitor**
```bash
npx cap init "BizManage" "com.bizmanage.app"
```

### **3. Configure Capacitor**
Your `capacitor.config.ts` is already configured with:
- `webDir: "build"`
- `bundledWebRuntime: false`
- HTTPS-only configuration
- Mobile-specific settings

### **4. Update Environment Variables**
Update your `.env.production` file:
```bash
REACT_APP_API_URL=https://your-production-api.onrender.com
```

### **5. Build the Project**
```bash
npm run build
```

### **6. Add Android Platform**
```bash
npx cap add android
```

### **7. Sync Project**
```bash
npx cap sync
```

### **8. Open Android Studio**
```bash
npx cap open android
```

---

## 🔧 Configuration Details

### **CORS Configuration**
Your backend is already configured to accept requests from:
- `capacitor://localhost` (mobile app)
- `ionic://localhost` (mobile app)
- Your production domains

### **Network Security**
- HTTPS-only API calls enabled
- Cleartext traffic disabled
- Network security config in place

### **Deep Linking**
- Custom scheme: `bizmanage://app/path`
- HTTPS app links supported
- React Router integration

---

## 📱 Building the APK

### **Debug APK (for testing)**
1. Open Android Studio
2. Select your connected device or emulator
3. Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
4. Choose **Debug**
5. APK will be generated in `android/app/build/outputs/apk/debug/`

### **Release APK (for distribution)**
1. **Generate Keystore** (one-time setup):
```bash
keytool -genkey -v -keystore bizmanage-release-key.keystore -alias bizmanage -keyalg RSA -keysize 2048 -validity 10000
```

2. **Configure signing** in `android/app/build.gradle`:
```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('bizmanage-release-key.keystore')
            storePassword 'your-store-password'
            keyAlias 'bizmanage'
            keyPassword 'your-key-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

3. **Build Release APK**:
```bash
cd android
./gradlew assembleRelease
```

4. **APK Location**: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🚀 Deployment Steps

### **1. Environment Setup**
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.production .env.local

# Build the web app
npm run build
```

### **2. Android Platform Setup**
```bash
# Add Android platform
npx cap add android

# Sync the project
npx cap sync
```

### **3. Build APK**
```bash
# Open in Android Studio
npx cap open android

# In Android Studio:
# 1. Build → Build Bundle(s) / APK(s) → Build APK(s)
# 2. Choose Debug or Release
# 3. Wait for build completion
```

---

## 🔐 Security Configuration

### **HTTPS-Only API Calls**
- All API calls use HTTPS
- Cleartext traffic disabled
- Network security config enforces HTTPS

### **Android Manifest Features**
- Network security configuration
- Deep linking support
- Proper permissions
- App links verification

### **Keystore Management**
```bash
# Generate keystore (one-time)
keytool -genkey -v -keystore bizmanage-release-key.keystore -alias bizmanage -keyalg RSA -keysize 2048 -validity 10000

# Store keystore securely
# Never commit keystore to version control
# Use different passwords for production
```

---

## 📱 Testing the APK

### **Emulator Testing**
1. Open Android Studio
2. Create virtual device (API 33+)
3. Run the app
4. Test all features

### **Physical Device Testing**
1. Enable Developer Options
2. Enable USB Debugging
3. Connect device via USB
4. Install APK: `adb install app-debug.apk`
5. Test all features

### **Key Testing Areas**
- ✅ Login/Registration
- ✅ API connectivity
- ✅ Navigation and routing
- ✅ Deep linking
- ✅ Mobile responsiveness
- ✅ Offline behavior
- ✅ Performance

---

## 🌐 Deep Linking

### **Custom Scheme Links**
- `bizmanage://app/dashboard`
- `bizmanage://app/employees`
- `bizmanage://app/payroll`

### **HTTPS App Links**
- `https://your-domain.com/dashboard`
- `https://your-domain.com/employees`

### **Testing Deep Links**
```bash
# Test custom scheme
adb shell am start -W -a android.intent.action.VIEW -d "bizmanage://app/dashboard" com.bizmanage.app

# Test HTTPS links
adb shell am start -W -a android.intent.action.VIEW -d "https://your-domain.com/dashboard" com.bizmanage.app
```

---

## 🔄 Continuous Updates

### **Update Process**
1. Make changes to React app
2. Build: `npm run build`
3. Sync: `npx cap sync`
4. Build new APK
5. Distribute updated APK

### **Automated Build Script**
```bash
#!/bin/bash
# build-apk.sh
echo "Building BizManage APK..."
npm run build
npx cap sync
cd android
./gradlew assembleRelease
echo "APK built successfully!"
echo "Location: android/app/build/outputs/apk/release/app-release.apk"
```

---

## 📊 APK Optimization

### **Build Optimization**
- Enable code shrinking: `minifyEnabled true`
- Use ProGuard for obfuscation
- Optimize images and assets
- Remove unused dependencies

### **Size Reduction**
```bash
# Analyze APK size
npx cap run android

# Check bundle size
npm run build -- --analyze
```

---

## 🐛 Troubleshooting

### **Common Issues**

#### **1. Build Failures**
```bash
# Clean and rebuild
npx cap sync android
cd android
./gradlew clean
./gradlew assembleRelease
```

#### **2. CORS Issues**
- Check backend CORS configuration
- Verify API URL in environment variables
- Ensure HTTPS is properly configured

#### **3. Network Issues**
- Check network security config
- Verify API endpoints are HTTPS
- Test API connectivity

#### **4. Deep Link Issues**
- Verify AndroidManifest configuration
- Test with ADB commands
- Check MainActivity implementation

### **Debug Commands**
```bash
# Check device logs
adb logcat

# Install and debug
adb install app-debug.apk
adb logcat | grep "BizManage"

# Test deep links
adb shell am start -W -a android.intent.action.VIEW -d "bizmanage://app/test" com.bizmanage.app
```

---

## 📋 Final Checklist

### **Before Release**
- [ ] API endpoints use HTTPS
- [ ] Environment variables configured
- [ ] Deep linking tested
- [ ] All features tested on device
- [ ] APK signed with release keystore
- [ ] Performance optimized
- [ ] Security reviewed

### **Release Distribution**
- [ ] Generate signed APK
- [ ] Test release APK thoroughly
- [ ] Create app store listing
- [ ] Prepare screenshots and descriptions
- [ ] Submit to app stores

---

## 🎉 Success!

Your BizManage Android APK is now ready for distribution! The app includes:

- ✅ Full React web app functionality
- ✅ Mobile-optimized UI
- ✅ HTTPS-only API calls
- ✅ Deep linking support
- ✅ Production-ready security
- ✅ Optimized performance

**Next Steps:**
1. Test thoroughly on multiple devices
2. Set up app store accounts
3. Prepare marketing materials
4. Launch to users!
