# How to Build Release APK with Gradle

## ✅ Yes, It Will Work, But...

The command you mentioned needs a few corrections for Windows and proper setup.

## 🔧 Corrected Commands for Windows

### Option 1: From Project Root (Recommended)

```powershell
cd C:\kisanone-frontend-main

# Step 1: Ensure native modules are configured
npx expo prebuild --clean

# Step 2: Build release APK
cd android
.\gradlew assembleRelease
```

### Option 2: From Android Directory

```powershell
cd C:\kisanone-frontend-main\android
.\gradlew assembleRelease
```

## ⚠️ Important Notes

### 1. **Windows PowerShell Syntax**
   - ❌ Wrong: `/gradlew` (Linux/Mac syntax)
   - ✅ Correct: `.\gradlew` (Windows PowerShell)
   - Alternative: `gradlew.bat assembleRelease`

### 2. **Command Case Sensitivity**
   - ❌ Wrong: `AssembleRelease` (uppercase 'A')
   - ✅ Correct: `assembleRelease` (lowercase 'a')

### 3. **Run Expo Prebuild First**
   You MUST run `expo prebuild` before building to ensure:
   - Native modules are properly linked
   - `app.json` plugins are applied
   - Android configuration is up-to-date

## 📦 What This Builds

This will create a **release APK** at:
```
android\app\build\outputs\apk\release\app-release.apk
```

## ⚠️ Current Signing Configuration

**Important**: Your current `build.gradle` is using **debug keystore** for release builds (line 115):

```gradle
release {
    signingConfig signingConfigs.debug  // ⚠️ This uses debug keystore!
}
```

### For Production Release:

If you want to sign with your release keystore, you need to:

1. **Update `build.gradle`** to use release keystore (you have keystore files ready):
   - `kisanone-release.jks`
   - `kisanone-release.keystore`

2. **Your `gradle.properties` already has:**
   ```properties
   KISANONE_RELEASE_STORE_FILE=kisanone-release.keystore
   KISANONE_RELEASE_KEY_ALIAS=kisanone-key
   KISANONE_RELEASE_STORE_PASSWORD=<KisanOne@12/>
   KISANONE_RELEASE_KEY_PASSWORD=<KisanOne@12/>
   ```

3. **But it's not being used in `build.gradle`**

## 🚀 Complete Build Process

### Step 1: Prepare Native Configuration
```powershell
cd C:\kisanone-frontend-main
npx expo prebuild --clean
```

### Step 2: Build Release APK
```powershell
cd android
.\gradlew clean
.\gradlew assembleRelease
```

### Step 3: Find Your APK
```
android\app\build\outputs\apk\release\app-release.apk
```

## 📱 Installing the APK

After building:

```powershell
# Option 1: Install via ADB
adb install android\app\build\outputs\apk\release\app-release.apk

# Option 2: Transfer to device and install manually
# Copy app-release.apk to your phone and install
```

## ⚠️ Current Issue: Debug Keystore

Your release build is currently signed with **debug keystore**, which means:
- ✅ Works for testing
- ❌ NOT suitable for Google Play Store
- ❌ Will be rejected by Play Store if uploaded

### To Fix for Production:

You need to update `android/app/build.gradle` to use release keystore. Would you like me to fix this?

## ✅ Quick Test Build

To quickly test if it works:

```powershell
cd C:\kisanone-frontend-main\android
.\gradlew assembleRelease
```

If successful, you'll see:
```
BUILD SUCCESSFUL
```

And the APK will be at:
```
app\build\outputs\apk\release\app-release.apk
```

## 📋 Summary

| What You Said | What You Need |
|---------------|---------------|
| `cd android` | ✅ Correct |
| `/gradlew AssembleRelease` | ❌ Wrong syntax |
| | ✅ Use `.\gradlew assembleRelease` |

**Answer**: Yes, it will work, but:
1. Use `.\gradlew assembleRelease` (Windows syntax, lowercase)
2. Run `expo prebuild --clean` first
3. Currently uses debug keystore (needs fixing for production)

