# Audio Files for Visualizations

This directory contains audio narrations for the mental training visualizations.

## Directory Structure

```
audio/
├── visualizations/
│   ├── unstoppable-confidence/
│   │   ├── step-0.mp3   # Preparation
│   │   ├── step-1.mp3   # See confident version
│   │   ├── step-2.mp3   # Place in environments
│   │   ├── step-3.mp3   # Mentally rehearse details
│   │   ├── step-4.mp3   # Embrace emotion
│   │   ├── step-5.mp3   # Power pose
│   │   ├── step-6.mp3   # Success memories
│   │   ├── step-7.mp3   # Affirmations
│   │   ├── step-8.mp3   # Future projection
│   │   ├── step-9.mp3   # Integration
│   │   └── step-10.mp3  # Completion
│   ├── laser-focus/
│   │   ├── step-0.mp3
│   │   ├── step-1.mp3
│   │   └── ...
│   └── pre-competition/
│       ├── step-0.mp3
│       ├── step-1.mp3
│       └── ...
└── background/
    ├── ambient-1.mp3
    ├── ambient-2.mp3
    └── ...
```

## File Naming Convention

- Individual step audio: `step-{number}.mp3`
- Background music: `ambient-{number}.mp3` or descriptive name

## Adding Audio Files

1. Record audio for each step in the visualization
2. Export as MP3 format (recommended for smaller file size)
3. Name according to the convention above
4. Place in the appropriate visualization folder

## Usage in Code

To enable audio for a visualization step, update the visualization data:

```typescript
// In constants/visualizations.ts
steps: [
  {
    id: 0,
    content: 'Find a comfortable position...',
    duration: 30,
    audioFile: 'step-0.mp3', // Add this line
  },
  // ...
]
```

The player will automatically load and play the audio when available.