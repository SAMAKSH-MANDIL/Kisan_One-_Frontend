# Fix: Voice Module "Cannot read property 'startSpeech' of null" Error

## Problem

The error `[TypeError: Cannot read property 'startSpeech' of null]` occurs when the Voice native module isn't properly initialized or linked.

## What Was Fixed

### 1. Improved Voice Initialization
- Added proper cleanup before starting Voice recognition
- Re-setup event listeners before each start to ensure they're registered
- Added delay after cleanup to ensure module is ready

### 2. Better Error Handling
- Added specific error messages for null module errors
- Improved cleanup logic in `stopVoiceRecognition()`
- Added proper async/await error handling

### 3. Module Lifecycle Management
- Properly destroy Voice instance before starting new one
- Clean up listeners on component unmount
- Handle cleanup errors gracefully

## If Error Persists: Rebuild Required

If you still get the error, the native module might not be properly linked. You need to **rebuild the app**:

### Step 1: Clean and Rebuild

```powershell
cd C:\kisanone-frontend-main

# Clean Expo prebuild
npx expo prebuild --clean

# Rebuild Android app
cd android
.\gradlew clean
cd ..

# Rebuild with Expo
npx expo run:android
```

### Step 2: Verify Voice Module is Linked

After rebuilding, the Voice module should be properly linked. Check that:
1. ✅ App builds without errors
2. ✅ Voice module initializes correctly
3. ✅ Microphone permission is requested properly

## Why This Happens

The `@react-native-voice/voice` library requires:
- Native module linking (done automatically by Expo prebuild)
- Proper Android permissions in `AndroidManifest.xml`
- App rebuild after installing the package

## Code Changes Made

1. ✅ Added proper Voice cleanup before starting
2. ✅ Re-setup event listeners before each recognition
3. ✅ Improved error messages for null module errors
4. ✅ Better async/await error handling
5. ✅ Added delay after cleanup to ensure module is ready

## Testing

After the fix (or rebuild):

1. **Test Voice Recognition:**
   - Open AI Tools screen
   - Tap microphone icon
   - Grant microphone permission
   - Speak and verify text appears in search bar

2. **Test Error Handling:**
   - If permission denied, should show alert with "Open Settings" option
   - If module not available, should show helpful error message

## Summary

- ✅ Fixed Voice initialization to prevent null module errors
- ✅ Added proper cleanup and re-initialization logic
- ✅ Improved error messages
- ⚠️ If error persists, **rebuild the app** (see Step 1 above)

