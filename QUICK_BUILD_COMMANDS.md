# Quick Build Commands for Testing Location

## ✅ Updated Build Configuration

I've updated your `build.gradle` to use the **release keystore** instead of debug keystore.

## 🚀 Build Commands for Windows PowerShell

### Correct Command Syntax:
```powershell
cd android
.\gradlew assembleRelease
```

### Notes:
- ✅ Use `.\gradlew` (dot-slash) - Windows PowerShell syntax
- ✅ Use `assembleRelease` (lowercase 'a') - correct Gradle task name
- ❌ Don't use `/gradlew` (Linux/Mac syntax won't work)
- ❌ Don't use `AssembleRelease` (uppercase won't work)

## 📱 Full Build Process for Testing Location

### Step 1: Prepare Native Modules (First Time Only)
```powershell
cd C:\kisanone-frontend-main
npx expo prebuild --clean
```

### Step 2: Build Release APK
```powershell
cd android
.\gradlew assembleRelease
```

### Step 3: Install on Device
```powershell
adb install app\build\outputs\apk\release\app-release.apk
```

Or manually:
- Transfer `app-release.apk` to your phone
- Install it manually

## 📦 APK Location

After successful build, find your APK at:
```
android\app\build\outputs\apk\release\app-release.apk
```

## ✅ What Changed

1. ✅ **Release signing configured**: Now uses `kisanone-release.keystore` instead of debug keystore
2. ✅ **Keystore path fixed**: Properly references keystore file
3. ✅ **Password format fixed**: Removed angle brackets from passwords

## ⚠️ If Build Fails

If you get errors about keystore:

1. **Check keystore exists**: `android/app/kisanone-release.keystore` should be there
2. **Check password**: Make sure password in `gradle.properties` matches your keystore
3. **Try with debug keystore first** (for quick testing):
   - Comment out release signing config temporarily
   - Or just use debug build: `.\gradlew assembleDebug`

## 🧪 Testing Location Function

After installing the release APK:

1. Open the app
2. Navigate to AI Tools screen
3. Tap location icon
4. Grant location permission
5. Location should work now!

## 📋 Summary

**Your Command** (after update):
```powershell
cd android
.\gradlew assembleRelease
```

This will now:
- ✅ Use release keystore (production-ready)
- ✅ Build optimized release APK
- ✅ Include all native modules (Firebase, Location, Voice, etc.)
- ✅ Be ready for testing location function

