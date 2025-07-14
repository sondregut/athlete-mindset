# Development Build Troubleshooting Guide

## Common Issues and Solutions

### EAS Build Issues

#### "Project not configured"
```bash
eas init
eas build:configure
```

#### Build fails with "Missing credentials"
```bash
# Reset credentials
eas credentials --platform ios --profile development
```

#### "Bundle identifier already exists"
- Change in app.json: `ios.bundleIdentifier`
- Must be unique across App Store

### iOS Specific Issues

#### "Unable to verify app"
1. Settings → General → Device Management
2. Trust developer certificate
3. Retry opening app

#### "Provisioning profile doesn't include device"
```bash
# Register device
eas device:create
# Rebuild with updated profile
eas build --profile development --platform ios --clear-cache
```

#### Simulator builds
```bash
# Create simulator build
eas build --profile preview --platform ios --simulator
```

### Android Specific Issues

#### "App not installed" error
- Enable "Install from Unknown Sources"
- Check minimum SDK version in app.json
- Ensure enough storage space

#### Debug keystore issues
```bash
# Generate new keystore
keytool -genkey -v -keystore debug.keystore -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000
```

### Development Client Connection Issues

#### "Unable to connect to development server"
1. Check firewall settings
2. Ensure same network (device & computer)
3. Try manual URL entry instead of QR code
4. Use tunnel URL: `--tunnel` flag

#### Metro bundler crashes
```bash
# Clear all caches
rm -rf node_modules
bun install
bunx rork start --clear
```

#### "Network response timed out"
- Increase timeout in metro.config.js
- Check proxy/VPN settings
- Try cellular data instead of WiFi

### Performance Issues

#### Slow reload times
- Enable Fast Refresh in dev menu
- Reduce console.log statements
- Check for memory leaks

#### Build taking too long
- Use local builds for faster iteration
- Enable build cache in eas.json
- Upgrade to priority builds (paid)

## Useful Commands

```bash
# View device logs
eas device:view [id]

# Check build status
eas build:list --platform ios --profile development

# Download build artifacts
eas build:download --platform ios --latest

# View crash logs
eas diagnostics
```

## Debug Mode Features

In development builds, shake device or press:
- iOS: Cmd+D (simulator) 
- Android: Cmd+M (emulator) or shake

Menu options:
- Reload: Refresh JavaScript bundle
- Debug: Open Chrome DevTools
- Show Inspector: View component tree
- Show Perf Monitor: FPS and RAM usage
- Settings: Configure dev options