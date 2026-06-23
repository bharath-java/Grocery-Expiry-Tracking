# Grocery Expiry Tracker — Flutter Android Mobile App

This is the fully native Android mobile application recreated from the web codebase using Flutter and Material Design 3.

---

## Prerequisites

Before building or running the application, make sure your development environment has the following installed:

1. **Flutter SDK:** Version `3.0.0` or higher.
   - [Flutter Installation Guide](https://docs.flutter.dev/get-started/install/windows)
2. **Java Development Kit (JDK):** Version `17`.
3. **Android SDK:** Configured inside Android Studio with standard CLI tools (`sdkmanager`, `adb`).
4. **Physical Android Device** (with USB Debugging enabled) or an **Android Emulator** running Android 10+ (API 29+).

---

## Getting Started

### 1. Extract and Navigate
Open your terminal/command prompt and navigate to this folder:
```bash
cd mobile
```

### 2. Verify Your Environment
Run the Flutter diagnostics to verify your tools are connected and up to date:
```bash
flutter doctor
```

### 3. Fetch Packages
Download the dependencies defined in `pubspec.yaml`:
```bash
flutter pub get
```

### 4. Run the Development Server
Connect your phone or start an emulator, then execute:
```bash
flutter run
```

---

## Building Production Formats

Run the following commands to generate the official install packages:

### Compile APK (Android Package)
The APK file can be directly transferred and installed on any Android device:
```bash
flutter build apk --release
```
- **Output Path:** `build/app/outputs/flutter-apk/app-release.apk`

### Compile AAB (Android App Bundle)
The AAB file is the format required by Google Play Console for store publishing:
```bash
flutter build appbundle --release
```
- **Output Path:** `build/app/outputs/bundle/release/app-release.aab`

---

## Firebase and External Configurations

### 1. Push Notifications (FCM)
To receive native push notifications on a physical device:
1. Create a project in the [Firebase Console](https://console.firebase.google.com/).
2. Add an Android app with the package name: `com.groceryexpirytracker.app`.
3. Download the `google-services.json` file and place it at:
   `mobile/android/app/google-services.json`.

### 2. Google Sign-In
To enable Google Sign-In on mobile, retrieve your development SHA-1 fingerprint:
```bash
keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android
```
Add this SHA-1 fingerprint under your Android App settings in the Firebase Console.
