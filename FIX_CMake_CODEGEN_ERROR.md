# Fix: CMake Codegen Directory Error

## Problem

You're getting CMake errors because the `clean` task tries to remove codegen directories that don't exist yet:

```
CMake Error: add_subdirectory given source
"C:/kisanone-frontend-main/node_modules/lottie-react-native/android/build/generated/source/codegen/jni/"
which is not an existing directory.
```

This happens with:
- `lottie-react-native`
- `react-native-gesture-handler`
- `react-native-vector-icons`

## ✅ Solution: Build Without Clean First

The codegen directories need to be **generated** before they can be cleaned. 

### Option 1: Build Without Clean (Recommended)

**Skip the clean step and build directly:**

```powershell
cd C:\kisanone-frontend-main\android
.\gradlew assembleRelease
```

This will:
1. Generate codegen directories automatically
2. Build your app
3. Work correctly

### Option 2: Generate Codegen First

If you really need to clean, generate codegen first:

```powershell
cd C:\kisanone-frontend-main\android

# Generate codegen directories
.\gradlew generateCodegenArtifactsFromSchema

# Then clean
.\gradlew clean

# Then build
.\gradlew assembleRelease
```

### Option 3: Disable External Native Build Clean (Advanced)

If you want to clean everything else but skip CMake clean, you can modify `build.gradle`:

```gradle
tasks.whenTaskAdded { task ->
    if (task.name == 'externalNativeBuildCleanRelease') {
        task.enabled = false
    }
}
```

## 🚀 Quick Fix (Do This Now)

**Just build without cleaning:**

```powershell
cd C:\kisanone-frontend-main\android
.\gradlew assembleRelease
```

This should work! The codegen directories will be created automatically during the build process.

## Why This Happens

The React Native new architecture uses codegen to generate native code:
1. **First build**: Codegen directories are created during build
2. **Clean task**: Tries to clean ALL build directories, including codegen
3. **Problem**: Codegen directories don't exist if you haven't built yet
4. **Solution**: Build first, then clean if needed

## Summary

- ❌ **Don't run** `.\gradlew clean` before first build
- ✅ **Just run** `.\gradlew assembleRelease` directly
- ✅ Codegen will be generated automatically
- ✅ Everything will work!

