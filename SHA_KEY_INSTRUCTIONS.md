# How to Get SHA-1 and SHA-256 Keys for Firebase

Your Firebase Phone Authentication requires SHA-1 and SHA-256 certificate fingerprints to be added in Firebase Console. Here's how to get them:

## Prerequisites

You need Java JDK installed on your system. If you don't have it:
1. Download from: https://adoptium.net/
2. Install it and add to PATH

## Step 1: Get SHA Keys for Debug Keystore (Development)

The debug keystore is used when you're developing/testing your app.

### On Windows (PowerShell or Command Prompt):

1. Open PowerShell or Command Prompt
2. Navigate to your project's Android app directory:
   ```powershell
   cd C:\kisanone-frontend-main\android\app
   ```

3. Run this command to get SHA-1 and SHA-256 for debug keystore:
   ```powershell
   keytool -list -v -keystore debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```

4. Look for these lines in the output:
   - **SHA1**: A string like `AA:BB:CC:DD:EE:FF...`
   - **SHA256**: A string like `AA:BB:CC:DD:EE:FF...`

## Step 2: Get SHA Keys for Release Keystore (Production)

If you have a release keystore file, you need to get its SHA keys too. You have these files:
- `android/app/kisanone-release.jks`
- `android/app/kisanone-release.keystore`

**Important**: You'll need the keystore password and key alias. If you don't know them, you'll need to ask your team or check your project documentation.

### On Windows (PowerShell or Command Prompt):

1. Navigate to your project's Android app directory:
   ```powershell
   cd C:\kisanone-frontend-main\android\app
   ```

2. For `.jks` file, run:
   ```powershell
   keytool -list -v -keystore kisanone-release.jks
   ```
   (You'll be prompted for the password)

3. For `.keystore` file, run:
   ```powershell
   keytool -list -v -keystore kisanone-release.keystore
   ```
   (You'll be prompted for the password)

4. Note down both SHA-1 and SHA-256 values.

## Step 3: Alternative - Using Gradle (Easier Method)

You can also use Gradle to get the SHA keys automatically:

1. Open PowerShell in your project root:
   ```powershell
   cd C:\kisanone-frontend-main
   ```

2. For Debug SHA keys:
   ```powershell
   cd android
   .\gradlew signingReport
   ```

3. Look for the output under "Variant: debug" and find:
   - SHA1: ...
   - SHA256: ...

## Step 4: Add SHA Keys to Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **kisanone-official**
3. Click on the **⚙️ (Settings)** icon → **Project settings**
4. Scroll down to **Your apps** section
5. Find your Android app: **com.kisanone.KisanOne**
6. Click **"Add fingerprint"** button
7. Add **both SHA-1 and SHA-256** keys:
   - Paste your SHA-1 key (for debug keystore)
   - Click **"Add fingerprint"** again
   - Paste your SHA-256 key (for debug keystore)
   - If you have release keystore keys, add those too
8. Click **"Save"**

## Step 5: Download Updated google-services.json

After adding SHA keys:

1. In Firebase Console, still in **Project settings** → **Your apps**
2. Under your Android app, click **"Download google-services.json"**
3. Replace the existing `google-services.json` file in your project:
   - Root directory: `C:\kisanone-frontend-main\google-services.json`
   - Android app directory: `C:\kisanone-frontend-main\android\app\google-services.json`
4. Make sure both files are updated

## Step 6: Rebuild Your App

After updating SHA keys:

```powershell
# Clean and rebuild
cd C:\kisanone-frontend-main
npx expo run:android
```

Or if you're using EAS:
```powershell
eas build --platform android
```

## Troubleshooting

- **"keytool is not recognized"**: Make sure Java JDK is installed and added to PATH
- **"Keystore was tampered with"**: Wrong password - check your keystore password
- **Still not working after adding SHA keys**: 
  - Wait a few minutes for Firebase to propagate changes
  - Make sure you downloaded the updated `google-services.json`
  - Rebuild the app completely (clean build)
  - Check that Phone Authentication is enabled in Firebase Console under Authentication → Sign-in method

## Quick Reference Commands

### Debug Keystore:
```powershell
cd C:\kisanone-frontend-main\android\app
keytool -list -v -keystore debug.keystore -alias androiddebugkey -storepass android -keypass android
```

### Using Gradle (Recommended):
```powershell
cd C:\kisanone-frontend-main\android
.\gradlew signingReport
```

---
**Note**: You need to add SHA keys for BOTH debug (development) and release (production) keystores if you plan to release the app.

