# Local APK Build Script for Windows
# This script will automatically download Flutter, set up paths, and compile the APK directly on your computer.

$ErrorActionPreference = "Stop"

# 1. Paths Configuration
$appDir = "c:\Users\naras\OneDrive\Desktop\app"
$flutterZip = "$appDir\flutter.zip"
$flutterSdkDir = "$appDir\flutter_sdk"
$androidSdkDir = "$env:LOCALAPPDATA\Android\Sdk"

Write-Host "=== Step 1: Checking Environments ===" -ForegroundColor Cyan
Write-Host "Using Android SDK at: $androidSdkDir" -ForegroundColor Gray
$env:ANDROID_HOME = $androidSdkDir
$env:ANDROID_SDK_ROOT = $androidSdkDir

# 2. Download Flutter if not exists
if (-not (Test-Path "$flutterSdkDir\flutter\bin\flutter.bat")) {
    Write-Host "=== Step 2: Downloading Flutter SDK (approx. 800MB) ===" -ForegroundColor Cyan
    Write-Host "This will take a few minutes depending on your internet speed..." -ForegroundColor Gray
    
    if (Test-Path $flutterZip) { Remove-Item $flutterZip -Force }
    
    # Download using curl.exe for speed
    curl.exe -L -o $flutterZip "https://storage.googleapis.com/flutter_infra_release/releases/stable/windows/flutter_windows_3.22.2-stable.zip"
    
    Write-Host "=== Step 3: Extracting Flutter SDK ===" -ForegroundColor Cyan
    if (Test-Path $flutterSdkDir) { Remove-Item -Recurse -Force $flutterSdkDir }
    New-Item -ItemType Directory -Path $flutterSdkDir | Out-Null
    
    # Expand zip
    Expand-Archive -Path $flutterZip -DestinationPath $flutterSdkDir -Force
    
    # Clean up zip
    Remove-Item $flutterZip -Force
    Write-Host "Extraction complete." -ForegroundColor Green
} else {
    Write-Host "=== Step 2: Flutter SDK already downloaded and extracted. ===" -ForegroundColor Green
}

# 3. Add Flutter to Path for this session
$env:Path = "$flutterSdkDir\flutter\bin;$env:Path"

# 4. Accept Android Licenses
Write-Host "=== Step 4: Accepting Android Licenses ===" -ForegroundColor Cyan
yes | flutter doctor --android-licenses

# 5. Build the APK
Write-Host "=== Step 5: Building release APK ===" -ForegroundColor Cyan
cd "$appDir\mobile"

Write-Host "Getting package dependencies..." -ForegroundColor Gray
flutter pub get

Write-Host "Compiling Android package..." -ForegroundColor Gray
flutter build apk --release

Write-Host "=== SUCCESS: APK COMPILED SUCCESSFULLY ===" -ForegroundColor Green
$apkPath = "$appDir\mobile\build\app\outputs\flutter-apk\app-release.apk"
Write-Host "Your APK is ready at: $apkPath" -ForegroundColor Yellow
explorer.exe /select,$apkPath
