# Fix: Unable to Delete Build Directory (Locked Files)

## Problem
Gradle can't delete build directories because files are locked by another process (IDE, antivirus, file explorer, etc.)

## Quick Solutions

### Solution 1: Close Everything and Retry (Recommended)

1. **Close Android Studio / VS Code / Any IDE**
2. **Close File Explorer windows** showing the project folder
3. **Close any processes** that might have files open
4. **Wait 5-10 seconds** for locks to release
5. **Run clean command again:**

```powershell
cd C:\kisanone-frontend-main\android
.\gradlew clean
```

### Solution 2: Manual Clean (If Solution 1 Doesn't Work)

Delete the locked directories manually:

```powershell
# Navigate to the problematic directory
cd C:\kisanone-frontend-main\node_modules\react-native-screens\android

# Delete build directory (may require admin)
rmdir /s /q build

# Then run gradle clean
cd C:\kisanone-frontend-main\android
.\gradlew clean
```

### Solution 3: Use PowerShell to Force Close Locks

If files are still locked, find and kill the process:

```powershell
# Find process locking the file (run in Admin PowerShell)
Get-Process | Where-Object {$_.Path -like "*kisanone*"}

# Or use handle.exe (if you have SysInternals)
# Download from: https://docs.microsoft.com/en-us/sysinternals/downloads/handle
```

### Solution 4: Skip Clean (Quick Workaround)

If you just need to build, skip the clean step:

```powershell
cd C:\kisanone-frontend-main\android
.\gradlew assembleRelease --no-rebuild
```

Or just run build directly (won't clean first):

```powershell
cd C:\kisanone-frontend-main\android
.\gradlew assembleRelease
```

### Solution 5: Exclude from Antivirus

Add your project folder to Windows Defender exclusions:
1. Open Windows Security
2. Virus & threat protection → Manage settings
3. Add or remove exclusions
4. Add folder: `C:\kisanone-frontend-main`

### Solution 6: Delete node_modules and Reinstall

If nothing else works:

```powershell
cd C:\kisanone-frontend-main

# Stop all processes
# Close IDE, file explorer, etc.

# Delete node_modules
rmdir /s /q node_modules

# Reinstall
npm install

# Then build
cd android
.\gradlew clean
.\gradlew assembleRelease
```

## Prevention

To avoid this in the future:

1. **Close IDE before running Gradle commands**
2. **Don't have File Explorer open** in the project directory
3. **Add project to antivirus exclusions**
4. **Use `--no-rebuild`** flag if you don't need a full clean

## Most Common Cause

- **Android Studio** has the project open
- **VS Code** has files open
- **File Explorer** is in the project folder
- **Windows Defender** is scanning the files

**Fix:** Close everything and try again!

