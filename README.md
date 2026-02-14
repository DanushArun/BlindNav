# BlindNav - AI Navigation for the Blind

Real-time AI-powered navigation assistant for blind users. Uses Google Gemini Vision to describe surroundings through voice feedback.

## Features (MVP)

- ✅ **Single Big Button** - Tap anywhere to start camera
- ✅ **Real-time AI Narration** - Continuous description of surroundings
- ✅ **Photo Capture** - Long press to capture and describe moments
- ✅ **Haptic Feedback** - Different vibration patterns for different alerts
- ✅ **Priority-based Speech** - Critical alerts interrupt, background info queued
- ✅ **Offline Capable** - Core features work without internet (using on-device fallback)

## Tech Stack

- **Framework**: React Native + Expo SDK 54
- **Language**: TypeScript
- **State**: Zustand
- **AI**: Google Gemini 2.0 Flash Vision (Free Tier)
- **TTS**: expo-speech (Native platform TTS)
- **Haptics**: expo-haptics

## Quick Start

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator or Android Emulator (or physical device)
- Gemini API Key (free at https://aistudio.google.com/apikey)

### Installation

```bash
# Navigate to project
cd blind-nav-app

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Start development server
npx expo start
```

### Running on Device

```bash
# iOS Simulator
npx expo run:ios

# Android Emulator
npx expo run:android

# Physical device (scan QR code)
npx expo start
```

## Project Structure

```
blind-nav-app/
├── src/
│   ├── screens/           # Screen components
│   │   ├── HomeScreen.tsx      # Big button home
│   │   └── CameraScreen.tsx    # AI camera view
│   ├── services/          # Core services
│   │   ├── ai/                 # Gemini integration
│   │   ├── speech/             # TTS service
│   │   └── haptics/            # Vibration patterns
│   ├── store/             # Zustand state
│   ├── types/             # TypeScript types
│   ├── constants/         # App configuration
│   └── utils/             # Helper functions
├── __tests__/             # Unit & integration tests
├── assets/                # Icons, splash screens
├── App.tsx                # Root component
├── app.json               # Expo configuration
└── .env                   # API keys (gitignored)
```

## Configuration

### Environment Variables

```env
EXPO_PUBLIC_GEMINI_API_KEY=your_key_here
EXPO_PUBLIC_APP_ENV=development
```

### Verbosity Modes

- **Critical**: Only obstacles and dangers
- **Balanced**: Obstacles + scene summary (default)
- **Detailed**: Everything visible + text recognition

### Rate Limits (Free Tier)

- Gemini API: 15 requests/minute, 1M tokens/day
- App processes 1 frame every 3 seconds (stays within limits)

## Accessibility Features

- Full VoiceOver/TalkBack support
- Large touch targets (70% screen)
- Haptic feedback for all interactions
- Voice feedback for every action
- No visual dependency required

## Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm test -- --coverage

# Type checking
npx tsc --noEmit
```

## Building for Production

```bash
# Build for iOS
npx expo build:ios

# Build for Android
npx expo build:android

# Using EAS Build (recommended)
npx eas build --platform all
```

## Free Tier Limitations

- **Gemini API**: 15 RPM, 1M tokens/day (sufficient for ~500 analyses/day)
- **No cost for TTS**: Uses native platform speech
- **No cost for haptics**: Uses native vibration API

## Roadmap (Post-MVP)

- [ ] Volume button photo capture (native module)
- [ ] Turn-by-turn navigation
- [ ] More Indian languages (Tamil, Telugu, etc.)
- [ ] Currency detection
- [ ] Face recognition (opt-in)
- [ ] Wearable support (smart glasses)

## Contributing

1. Fork the repo
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## License

MIT License - See LICENSE file

## Support

- **Issues**: GitHub Issues
- **Email**: [your-email]

---

Built with ❤️ for the blind community in India.
