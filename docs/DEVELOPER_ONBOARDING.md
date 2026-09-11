# Developer Onboarding

Welcome to the TafDeal development team! Follow these instructions to set up your local environment.

## Prerequisites
- **Node.js**: v18 or higher (LTS recommended)
- **npm**: v9 or higher
- **React Native / Expo CLI**: For mobile/web frontend
- **Firebase CLI**: `npm install -g firebase-tools`
- **Git**: For version control

## Local Development Setup

1. **Clone the Repository**
   ```bash
   git clone <repository_url>
   cd TafDeal
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # Or use the provided batch script if on Windows
   run_npm.bat install
   ```

3. **Environment Variables**
   - Ask your team lead for the `.env` file or copy from the template if available.
   - You will need keys for Firebase, Razorpay, and Shiprocket.
   - Example `.env` structure:
     ```env
     EXPO_PUBLIC_FIREBASE_API_KEY=...
     EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
     # ...
     ```

4. **Service Account Key**
   - Ensure `serviceAccountKey.json` is placed in the root for Firebase Admin SDK local testing (DO NOT commit this file).

## Running the App Locally

### Frontend (Expo)
```bash
npm start
# Or
npx expo start
```
Press `w` to open the web version, `a` for Android emulator, or `i` for iOS simulator.

### Backend (Firebase Functions)
Navigate to the functions directory and start the emulator:
```bash
cd functions
npm install
npm run build
firebase emulators:start
```

## Folder Structure Conventions
- `/src`: Frontend React/React Native source code.
  - `/src/components`: Reusable UI components.
  - `/src/services`: API calls and Firebase wrappers (e.g., `firebaseService.ts`, `bankService.ts`).
  - `/src/types`: TypeScript definitions.
- `/functions`: Backend Firebase Cloud Functions.
- `/docs`: Project documentation and architecture details.
- `/assets`: Static images, fonts, etc.

## Coding Guidelines
- Use TypeScript for all new files.
- Follow functional component patterns with React Hooks.
- Ensure all API calls are abstracted in the `services` directory.
- Use meaningful commit messages.

## Troubleshooting
- **Expo cache issues**: Run `npx expo start -c` to clear the cache.
- **Firebase Emulator port conflicts**: Ensure ports 4000, 5001, 8080, 9099 are free.
- **Node modules errors**: Delete `node_modules` and run `npm install` again.
