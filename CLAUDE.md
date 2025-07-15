# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Starting the App
- `bunx rork start -p z54qzr5766157j0974fjw --tunnel` - Start the development server with tunnel
- `bunx rork start -p z54qzr5766157j0974fjw --web --tunnel` - Start web version with tunnel
- `DEBUG=expo* bunx rork start -p z54qzr5766157j0974fjw --web --tunnel` - Start web version with debug logging

### Additional Useful Commands
- `bun install` - Install dependencies
- `bun run typecheck` - Run TypeScript type checking
- `bunx rork --help` - View all available Rork commands
- `bunx rork start --clear` - Start with cleared cache
- `bunx rork build` - Build the project for production

## Code Style Guidelines

### IMPORTANT Coding Standards
- **TypeScript**: Use strict TypeScript with proper type definitions
- **Imports**: Use ES modules (import/export) syntax, not CommonJS (require)
- **Destructuring**: Destructure imports when possible (e.g., `import { useState } from 'react'`)
- **Path Aliases**: Always use `@/*` imports pointing to project root (configured in tsconfig.json)
- **State Management**: Use Zustand patterns with immutable updates
- **Components**: Follow React Native + Expo Router conventions

### File Structure Patterns
- Use Expo Router file-based routing conventions
- Components in `components/` directory with PascalCase names
- Store files use kebab-case (e.g., `session-store.ts`)
- Type definitions in `types/` directory
- Constants grouped by purpose in `constants/` directory

## Architecture Overview

### Tech Stack
- **Framework**: React Native 0.79.1 with Expo SDK 53
- **Routing**: Expo Router 5.0 (file-based routing like Next.js)
- **Development Server**: Rork (enhanced Expo development server)
- **State Management**: Zustand 5.0 with AsyncStorage persistence
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **TypeScript**: Strict mode enabled with path aliases (`@/*` maps to root)
- **Package Manager**: Bun (bun.lock present)

### Project Structure
```
app/                    # Expo Router file-based routing
├── (tabs)/            # Tab navigation screens
│   ├── index.tsx      # Home screen
│   ├── log-session.tsx # Multi-step session logging
│   └── profile.tsx    # User profile
├── _layout.tsx        # Root layout with Stack navigation
├── activity.tsx       # Activity history screen
└── modal.tsx         # Modal presentation screen

store/                 # Zustand state management
└── session-store.ts   # Core session logging state with persistence

types/                 # TypeScript definitions
└── session.ts        # Session-related types and interfaces

components/            # Reusable UI components
├── Button.tsx
├── Card.tsx
├── SessionLogItem.tsx
├── StarRating.tsx
└── CustomSlider.tsx

constants/             # App constants
├── colors.ts         # Design system colors
├── quotes.ts         # Motivational quotes
└── mindset-cues.ts   # Predefined mindset options
```

### Key Application Features
- **Session Logging**: Athletes log training sessions with comprehensive pre/post metrics
- **Four-Step Flow**: setup → intention → active → reflection → auto-save & navigate home
- **State Persistence**: Session data persists using AsyncStorage via Zustand middleware
- **Analytics**: Streak calculation, weekly logs, and session ratings
- **Cross-Platform**: Supports iOS, Android, and Web with Rork's enhanced platform handling

### State Management Pattern
The app uses a single Zustand store (`useSessionStore`) that handles:
- Session CRUD operations with `completeCurrentSession()` moving from currentSession to logs array
- Current session state (for active logging workflow)
- Derived data (streaks, weekly counts, analytics)
- Automatic persistence to AsyncStorage via Zustand middleware
- **IMPORTANT**: Follow immutable update patterns with Zustand

### Navigation Structure
- Tab-based main navigation with Stack navigation overlay
- Modal presentations for certain flows
- File-based routing with Expo Router typed routes enabled
- Session completion automatically navigates back to home page

## Development Workflow

### Getting Started
1. Install dependencies: `bun install`
2. Start development server: `bunx rork start -p z54qzr5766157j0974fjw --tunnel`
3. Access via:
   - **Mobile**: Scan QR code or use tunnel URL
   - **Web**: Open localhost URL provided by Rork
   - **Simulator**: Press 'i' for iOS, 'a' for Android

### Testing & Quality Assurance
- **YOU MUST** run `bun run typecheck` after making code changes
- Test on both mobile and web platforms when making UI changes
- Verify session persistence works correctly across app restarts
- Test the complete session flow: setup → intention → active → reflection → save

### About Rork vs Standard Expo CLI
Rork provides several advantages over standard Expo CLI:
- **Faster Cold Starts**: Significantly reduced startup times
- **Enhanced Hot Reloading**: Better error recovery and module resolution
- **Improved Debugging**: More detailed logging and cleaner error messages
- **Better Cross-Platform Support**: Enhanced handling of platform-specific code
- **Bundle Optimization**: Automatic optimization and better caching strategies

## Important Technical Notes

### Session Data Flow
1. **Session Creation**: New sessions start in `currentSession` state
2. **Multi-Step Process**: Four distinct phases with validation between steps
3. **Auto-Save**: `completeCurrentSession()` moves session from current to logs array
4. **Persistence**: Only session logs are persisted, not UI state
5. **Navigation**: Completion automatically navigates user back to home

### Cross-Platform Considerations
- **Web Compatibility**: Conditional rendering for mobile-only features (haptics, etc.)
- **Custom Components**: Built custom slider to avoid web compatibility issues
- **Responsive Design**: Works on mobile and web with appropriate fallbacks
- **Expo Modules**: Some modules (expo-haptics) are mobile-only

### Performance Optimization
- Rork automatically optimizes bundle sizes for different platforms
- Enhanced tree-shaking reduces unnecessary code in builds
- Better asset optimization for images and fonts
- Improved caching strategies for faster subsequent starts

## Sports Psychology Context

### App Philosophy
This is an **Athlete Mindset Tracking App** focused on mental resilience and self-awareness through structured pre/post training logging. The app emphasizes psychological aspects of athletic performance rather than just physical metrics.

### Core Mental Training Components
- **Pre-Training Intentions**: Focus areas, mindset cues, readiness levels
- **Session Tracking**: Real-time timer with different session types
- **Post-Training Reflection**: 3 positives, stretch goals, RPE ratings
- **Progress Analytics**: Streak tracking, motivational quotes, session history
- **Guided Visualizations**: Mental training exercises with AI-powered text-to-speech narration

### Session Types Supported
- Training, Competition, Recovery, Skill Work, Other
- Each with specific activity specifications (e.g., "Weightlifting - Lower Body")

## Text-to-Speech (TTS) Integration

### ElevenLabs TTS with Aggressive Caching
The app uses ElevenLabs for high-quality text-to-speech with a multi-layer caching system:

#### Cache Architecture
1. **Memory Cache** (`tts-memory-cache.ts`) - In-app LRU cache for instant access
2. **Local Device Cache** - FileSystem storage with 100MB limit per user
3. **Firebase Cloud Cache** (`tts-firebase-cache.ts`) - Shared across all users
4. **ElevenLabs API** - Only called if not cached

#### Cache Flow
1. Check memory cache → Return if found
2. Check local FileSystem cache → Return if found  
3. Check Firebase Storage → Download and cache locally if found
4. Generate via ElevenLabs API → Upload to Firebase + cache locally

#### Key Features
- **Deterministic Cache Keys**: SHA-256 hash of text+voice+speed+model
- **LRU Eviction**: Automatic cleanup of least recently used items
- **Cross-User Sharing**: Identical content shared via Firebase
- **Rate Limiting**: 1-second minimum interval between API calls
- **Analytics**: Track cache hit rates and usage patterns
- **Voices**: Multiple ElevenLabs voices (Rachel, Drew, Paul, Domi, Bella, Antoni, etc.)

### TTS Configuration
- **Environment Variables**: 
  - `ELEVENLABS_API_KEY` in `.env` file for TTS
  - `OPENAI_API_KEY` in `.env` file for personalization only
- **Babel Plugin**: `react-native-dotenv` configured in `babel.config.js`
- **App Config**: `app.config.js` loads environment variables

### TTS Troubleshooting
1. Run debug screen: Navigate to `/debug-tts` in the app
2. Check cache stats to verify caching is working
3. Verify `.env` file exists with valid API key
4. Ensure `bun install` to get react-native-dotenv
5. Clear Metro cache: `bunx rork start --clear`

### Security & Cost Optimization
- **Firebase Rules**: Configured for public read, authenticated write
- **Cost Reduction**: Cache sharing reduces API calls by 90%+
- **Storage Limits**: 10GB Firebase, 100MB per device
- **Production**: Consider Firebase Functions for additional security

## Repository Etiquette

### Git Workflow
- Use descriptive commit messages
- Create feature branches for new functionality
- Test thoroughly before committing
- Include CLAUDE.md updates in commits when adding new patterns or commands

### Code Review Guidelines
- Ensure TypeScript compilation passes
- Verify cross-platform compatibility
- Test session persistence functionality
- Check that navigation flows work correctly

---

*This CLAUDE.md file is version-controlled and shared with the team. Use the `#` command in Claude Code to automatically add new insights to this file.*
