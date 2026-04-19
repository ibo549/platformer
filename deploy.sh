#!/bin/bash
set -e

# === Configuration ===
ROOT_DIR="$HOME/Desktop/platformer"
PROJECT_DIR="$ROOT_DIR/PlatformerApp"
RESOURCES_DIR="$PROJECT_DIR/PlatformerApp/Resources"
SCHEME="PlatformerApp"
BUNDLE_ID="com.halil.platformer"
TEAM_ID="D266P2RYN7"
CERT="DC9A4EF3B16970A572F3F504B6D9F0270273C367"
BUILD_DIR="/tmp/PlatBuild"
ASSETS_DIR="$PROJECT_DIR/PlatformerApp/Assets"

# === Build game.html from source ===
echo "🔨 Building game.html from game.src.html..."
"$ROOT_DIR/build.sh"

# === Sync game.html ===
# The canonical game.html lives at the project root (platformer/game.html).
# It must be copied into Resources/ before building so the Xcode project picks it up.
echo "📄 Syncing game.html..."
cp "$ROOT_DIR/game.html" "$RESOURCES_DIR/game.html"
echo "✅ game.html synced"

# === Detect Device ===
echo "🔍 Detecting connected device..."
UDID=$(idevice_id -l 2>/dev/null | head -1)
if [ -z "$UDID" ]; then
    echo "❌ No device connected via USB!"
    exit 1
fi
DEVICE_NAME=$(ideviceinfo -u "$UDID" -k DeviceName 2>/dev/null || echo "Unknown")
echo "✅ Found: $DEVICE_NAME ($UDID)"

# === Build ===
echo ""
echo "🔨 Building..."
rm -rf "$BUILD_DIR"
xcodebuild -project "$PROJECT_DIR/PlatformerApp.xcodeproj" \
    -scheme "$SCHEME" \
    -sdk iphoneos \
    -configuration Debug \
    -allowProvisioningUpdates \
    DEVELOPMENT_TEAM="$TEAM_ID" \
    -derivedDataPath "$BUILD_DIR" \
    build 2>&1 | tail -5

APP="$BUILD_DIR/Build/Products/Debug-iphoneos/PlatformerApp.app"

if [ ! -d "$APP" ]; then
    echo "❌ Build failed!"
    exit 1
fi
echo "✅ Build succeeded"

# === Add Icons ===
echo ""
echo "🎨 Adding icons..."
cp "$ASSETS_DIR/AppIcon120.png" "$APP/AppIcon120x120.png"
cp "$ASSETS_DIR/AppIcon180.png" "$APP/AppIcon180x180.png"
cp "$ASSETS_DIR/AppIcon152.png" "$APP/AppIcon152x152.png"
cp "$ASSETS_DIR/AppIcon167.png" "$APP/AppIcon167x167.png"
cp "$ASSETS_DIR/AppIcon76.png"  "$APP/AppIcon76x76.png"

/usr/libexec/PlistBuddy -c "Delete :CFBundleIcons" "$APP/Info.plist" 2>/dev/null || true
/usr/libexec/PlistBuddy -c "Delete :CFBundleIcons~ipad" "$APP/Info.plist" 2>/dev/null || true

/usr/libexec/PlistBuddy -c "Add :CFBundleIcons dict" "$APP/Info.plist"
/usr/libexec/PlistBuddy -c "Add :CFBundleIcons:CFBundlePrimaryIcon dict" "$APP/Info.plist"
/usr/libexec/PlistBuddy -c "Add :CFBundleIcons:CFBundlePrimaryIcon:CFBundleIconFiles array" "$APP/Info.plist"
/usr/libexec/PlistBuddy -c "Add :CFBundleIcons:CFBundlePrimaryIcon:CFBundleIconFiles: string AppIcon120x120" "$APP/Info.plist"
/usr/libexec/PlistBuddy -c "Add :CFBundleIcons:CFBundlePrimaryIcon:CFBundleIconFiles: string AppIcon180x180" "$APP/Info.plist"

/usr/libexec/PlistBuddy -c "Add :CFBundleIcons~ipad dict" "$APP/Info.plist"
/usr/libexec/PlistBuddy -c "Add :CFBundleIcons~ipad:CFBundlePrimaryIcon dict" "$APP/Info.plist"
/usr/libexec/PlistBuddy -c "Add :CFBundleIcons~ipad:CFBundlePrimaryIcon:CFBundleIconFiles array" "$APP/Info.plist"
/usr/libexec/PlistBuddy -c "Add :CFBundleIcons~ipad:CFBundlePrimaryIcon:CFBundleIconFiles: string AppIcon76x76" "$APP/Info.plist"
/usr/libexec/PlistBuddy -c "Add :CFBundleIcons~ipad:CFBundlePrimaryIcon:CFBundleIconFiles: string AppIcon152x152" "$APP/Info.plist"
/usr/libexec/PlistBuddy -c "Add :CFBundleIcons~ipad:CFBundlePrimaryIcon:CFBundleIconFiles: string AppIcon167x167" "$APP/Info.plist"
echo "✅ Icons added"

# === Re-sign ===
echo ""
echo "🔏 Re-signing..."
xattr -c "$APP/embedded.mobileprovision"
# Extract as plain plist XML (modern codesign rejects the legacy magic-wrapped blob).
/usr/bin/codesign -d --xml --entitlements - "$APP" > /tmp/entitlements.plist 2>/dev/null
/usr/bin/codesign --force --deep --sign "$CERT" \
    --entitlements /tmp/entitlements.plist \
    --timestamp=none --generate-entitlement-der "$APP"
echo "✅ Re-signed"

# === Install ===
echo ""
echo "📲 Installing on $DEVICE_NAME..."
ideviceinstaller -u "$UDID" install "$APP"

echo ""
echo "🎉 Done! Platformer is installed on $DEVICE_NAME."
