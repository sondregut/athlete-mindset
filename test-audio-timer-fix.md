# Audio Timer Fix Test Plan

## Changes Made

### 1. Added Timer Management Refs
- `isSchedulingAudio`: Prevents multiple timers from being scheduled simultaneously
- `audioGenerationId`: Tracks audio generation requests to cancel outdated ones

### 2. Enhanced Timer Lifecycle Management
- Clear existing timer BEFORE scheduling new one
- Track timer IDs for better debugging
- Reset scheduling flag in cleanup

### 3. Request Cancellation
- Each audio load request has a generation ID
- Outdated requests are cancelled when generation ID changes
- Generation ID increments on:
  - Step navigation (next/previous)
  - Voice changes
  - Component unmount
  - Audio cleanup

### 4. Improved Logging
- Timer scheduling logs include timer ID
- Generation ID tracked in logs
- Clear indication when timers are cleared or skipped

## Expected Behavior

### Before Fix
- Multiple "Audio load timer fired" messages
- Overlapping audio instances
- Race conditions during rapid navigation

### After Fix
- Only one timer active at a time
- Previous timers cancelled before new ones
- Clean audio transitions
- No overlapping audio instances

## Testing Steps

1. **Test Rapid Navigation**
   - Navigate quickly between steps
   - Verify only one timer fires per step
   - Check logs for proper timer cleanup

2. **Test Voice Changes**
   - Change voice during playback
   - Verify audio stops immediately
   - Check new audio loads with correct voice

3. **Test Component Lifecycle**
   - Navigate away from visualization
   - Verify all timers are cleaned up
   - Check audio stops properly

4. **Monitor Logs**
   Look for these patterns:
   - `audio-timer-clear: Clearing existing timer: [ID]`
   - `audio-timer-scheduled: Scheduled timer: [ID]`
   - `audio-timer-execute: 🎵 Audio load timer [ID] fired`
   - `audio-generation-increment: New generation ID: [number]`
   - `audio-cancelled: Audio load cancelled - generation [ID] is outdated`

## Key Improvements

1. **Prevents Multiple Timers**: The `isSchedulingAudio` flag ensures only one timer is scheduled at a time
2. **Cancels Outdated Requests**: Generation ID system prevents old audio loads from completing
3. **Better Cleanup**: All refs properly reset on cleanup
4. **Enhanced Debugging**: Timer IDs and generation IDs in logs make it easier to track issues