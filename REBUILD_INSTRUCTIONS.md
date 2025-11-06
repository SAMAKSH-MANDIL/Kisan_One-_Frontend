# Fix: expo-image-picker Native Module Error

## Problem
The error "Cannot find native module 'ExponentImagePicker'" occurs because:
- You're using **Expo Go** which doesn't support custom native modules
- The app needs to be rebuilt with native modules compiled

## Solution: Build Development Client

### Step 1: Clean Everything
```bash
# Clear cache
npx expo start --clear
# Press Ctrl+C to stop it

# Clean Android build
cd android
./gradlew clean
cd ..
```

### Step 2: Rebuild Android App
```bash
# This will take 5-10 minutes
npx expo run:android
```

### Step 3: Install on Device
- The command above will automatically build and install on your connected device/emulator
- Wait for "BUILD SUCCESSFUL" message
- The app will launch automatically

## Alternative: Using EAS Build (Cloud Build)
If local build doesn't work, use cloud build:

```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Login
eas login

# Build for Android
eas build --profile development --platform android

# Then install the .apk file on your device
```

## Important Notes
1. **Don't use Expo Go** - It doesn't support native modules
2. After rebuilding, always use: `npx expo start --dev-client` (not `expo start`)
3. The first build takes longer (5-10 minutes)
4. Subsequent builds are faster (1-2 minutes)

## Verify Setup
After rebuild, the app should work without errors. Test by:
1. Opening Crop Doctor screen
2. Clicking Camera or Gallery button
3. Image picker should open without errors

