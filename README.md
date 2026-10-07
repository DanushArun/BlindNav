# BlindNav

An Expo / React Native prototype that captures camera images and generates spoken scene
information through Google Gemini. Speech and haptic services support the camera interface.
The current app routes to `CameraScreenLive`, despite also retaining an older camera screen.

## Implemented pieces

- A large start control and a camera screen.
- Camera-frame analysis, generated descriptions and native speech output.
- Haptic patterns and speech-service controls.
- Zustand state for screen and user preferences.
- Committed iOS native project and a speech-service unit test file.

## Local setup

```bash
git clone https://github.com/DanushArun/BlindNav.git
cd BlindNav
npm ci
cp .env.example .env
npm start
```

Set `EXPO_PUBLIC_GEMINI_API_KEY` to your own development key.
The active service names `gemini-2.0-flash-exp`; current provider availability was not verified.
Camera evaluation requires a device or suitable emulator and camera/microphone permissions.

Native development commands declared in the manifest:

```bash
npm run ios
npm run android
```

These compile native applications and require the corresponding Xcode or Android toolchain.
Expo public environment variables are embedded in the client bundle; they are not a secure
server-side secret store. See [Expo environment
guidance](https://docs.expo.dev/guides/environment-variables/).

## Source map

- [App.tsx](App.tsx): home/camera routing and speech initialization.
- [CameraScreenLive.tsx](src/screens/CameraScreenLive.tsx): active camera experience.
- [geminiLive.ts](src/services/ai/geminiLive.ts): current generation session.
- [speechService.ts](src/services/speech/speechService.ts): speech handling.
- [hapticsService.ts](src/services/haptics/hapticsService.ts): haptic patterns.

## Verification and boundaries

The README was checked against source, scripts and Expo SDK 54 documentation.
No device trial, accessibility audit or live provider evaluation was performed.
There is a unit-test source file, but `package.json` has no `test` script.

Network-based scene understanding is not an independently validated offline navigation system.
The repository does not demonstrate reliable obstacle detection, route guidance or safe navigation
with blind users. Generated descriptions may be wrong or delayed; evaluate the prototype with
supervision and established mobility aids before any real-world reliance.
