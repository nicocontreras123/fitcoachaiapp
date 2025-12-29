# Music App Integration Plan

## Overview
Add configurable music app preference with automatic detection of installed apps.

## Steps

### 1. Update User Data Type
- Add `preferredMusicApp?: 'spotify' | 'youtube-music' | 'apple-music' | null` to UserData interface
- Location: `/src/features/profile/types/index.ts`

### 2. Create Music App Detection Service
- Create `/src/services/musicAppService.ts`
- Functions:
  - `detectInstalledMusicApps()`: Returns array of installed apps
  - `openMusicApp(appName)`: Opens the specified music app
  - `getMusicAppIcon(appName)`: Returns icon name for the app

### 3. Update Profile Settings
- Add music app selector in profile settings
- Show only detected/installed apps
- Save preference to user data

### 4. Update Floating Music Button
- Modify SpotifyButton component to be generic MusicAppButton
- Use user's preferred app
- Hide button if no app is configured or installed
- Location: `/src/features/tracking/components/shared/SpotifyButton.tsx`

### 5. Update All Timers
- Boxing timer
- Running timer  
- Gym timer
- Use new MusicAppButton instead of SpotifyButton

## Implementation Notes
- Use `Linking.canOpenURL()` to detect installed apps
- App URL schemes:
  - Spotify: `spotify://`
  - YouTube Music: `youtubemusic://` or `youtube://`
  - Apple Music: `music://` or `applemusic://`
