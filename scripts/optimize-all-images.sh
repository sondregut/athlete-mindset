#!/bin/bash

echo "🎨 Starting image optimization..."

# Create backup directory
mkdir -p ./assets/images/backup

# Backup original images
echo "📦 Backing up original images..."
cp ./assets/images/*.png ./assets/images/backup/ 2>/dev/null || true
cp ./assets/icon.png ./assets/images/backup/root-icon.png 2>/dev/null || true

# Function to optimize image with proper sizing
optimize_image() {
    local input=$1
    local output=$2
    local width=$3
    local height=$4
    
    echo "Optimizing $input -> $output (${width}x${height})..."
    
    # Use sharp to resize and optimize
    if [ "$width" == "same" ]; then
        npx sharp -i "$input" -o "$output" --optimise --compressionLevel 9
    else
        npx sharp -i "$input" -o "$output" resize "$width" "$height" --fit "contain" --background "{r:74,g:111,b:255,alpha:1}" --optimise --compressionLevel 9
    fi
}

# Optimize main icon (1024x1024 for iOS App Store)
optimize_image "./assets/images/icon.png" "./assets/images/icon.png" 1024 1024

# Copy optimized icon to other locations since they're all the same
echo "📋 Using optimized icon for all icon variants..."
cp ./assets/images/icon.png ./assets/icon.png
cp ./assets/images/icon.png ./assets/images/adaptive-icon.png
cp ./assets/images/icon.png ./assets/images/favicon.png

# Optimize splash icon separately (larger for splash screens)
optimize_image "./assets/images/backup/splash-icon.png" "./assets/images/splash-icon.png" 1242 2688

# Optimize brain health images
echo "🧠 Optimizing brain health images..."
for img in ./assets/images/brain-health/brain-*.png; do
    if [ -f "$img" ]; then
        optimize_image "$img" "$img" "same" "same"
    fi
done

# Report file sizes
echo ""
echo "📊 Optimization Results:"
echo "========================"
echo ""
echo "Original sizes:"
ls -lh ./assets/images/backup/*.png 2>/dev/null | awk '{print $5, $9}'
echo ""
echo "Optimized sizes:"
ls -lh ./assets/images/*.png | grep -v backup | awk '{print $5, $9}'
ls -lh ./assets/images/brain-health/*.png | awk '{print $5, $9}'
ls -lh ./assets/icon.png | awk '{print $5, $9}'

# Calculate total savings
original_size=$(du -sh ./assets/images/backup 2>/dev/null | cut -f1)
new_size=$(du -sh ./assets/images | grep -v backup | cut -f1)

echo ""
echo "✅ Image optimization complete!"
echo "Original total: ~$original_size"
echo "New total: ~$new_size"
echo ""
echo "⚠️  Remember to test the app to ensure images display correctly!"
echo "💡 To restore originals: cp ./assets/images/backup/* ./assets/images/"