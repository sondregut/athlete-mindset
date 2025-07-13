#!/bin/bash

echo "Clearing all Expo and Metro caches..."

# Remove Expo cache
rm -rf .expo
echo "✓ Cleared .expo"

# Remove node_modules cache
rm -rf node_modules/.cache
echo "✓ Cleared node_modules/.cache"

# Remove Metro cache
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
echo "✓ Cleared Metro cache"

# Remove expo-env.d.ts to regenerate
rm -f expo-env.d.ts
echo "✓ Removed expo-env.d.ts"

# Remove temporary config files
rm -f app.config.js.temp
echo "✓ Removed temporary config files"

echo ""
echo "All caches cleared! Now run:"
echo "bun install"
echo "bunx rork start -p z54qzr5766157j0974fjw --tunnel --clear"