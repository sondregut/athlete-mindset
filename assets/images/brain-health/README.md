# Brain Health Images

This folder should contain 5 brain character images representing different health levels:

## Image Requirements

1. **brain-1.png** - Very Unhealthy Brain
   - Sad/weak expression
   - No muscles, droopy appearance
   - Grey-ish or pale color
   - No equipment

2. **brain-2.png** - Unhealthy Brain
   - Slightly better but still weak
   - Minimal muscle definition
   - Light orange color
   - Maybe holding very light weights

3. **brain-3.png** - Normal Brain
   - Neutral expression
   - Some muscle tone
   - Normal orange color
   - Small dumbbells

4. **brain-4.png** - Healthy Brain
   - Happy expression
   - Well-defined muscles
   - Vibrant orange color
   - Medium weights
   - Maybe wearing a headband

5. **brain-5.png** - Very Healthy Brain
   - Like the image shown - super muscular
   - Big smile
   - Lifting heavy dumbbell
   - Teal/green headband
   - Sparkles or energy effects around it
   - Strong orange color

## Image Specifications
- Size: 200x200px (or similar square aspect ratio)
- Format: PNG with transparent background
- Style: Consistent with the muscular brain character shown

## How to Enable
Once you add these images, uncomment line 121 in `/components/BrainHealthIndicator.tsx`:
```tsx
return require(`@/assets/images/brain-health/brain-${brainHealth}.png`);
```