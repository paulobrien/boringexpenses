# Mobile Development with Expo

This document explains how to develop the native mobile version of Boring Expenses using Expo.

## Getting Started

### Prerequisites
- Node.js v20 or later
- Expo CLI (automatically installed with dependencies)
- For testing:
  - Expo Go app on your phone, OR
  - Android Studio (for Android emulator), OR
  - Xcode (for iOS simulator, macOS only)

### Development Commands

```bash
# Start the mobile development server
npm run mobile

# Start for specific platforms
npm run android    # Android device/emulator
npm run ios        # iOS device/simulator (macOS only)

# Alternative command
npm run start      # Same as npm run mobile
```

## Architecture

### File Structure
```
src/
├── App.native.tsx           # Mobile app entry point
├── components/mobile/       # Mobile-specific components
│   ├── LoginScreen.tsx      # Authentication screen
│   ├── ExpensesScreen.tsx   # Expenses list view
│   ├── AddExpenseScreen.tsx # Add expense form
│   └── SettingsScreen.tsx   # Settings and account management
├── hooks/useAuth.ts         # Shared authentication logic
└── lib/supabase.ts         # Shared backend client
```

### Navigation
Currently using a simple custom tab navigation. Components:
- **SimpleTabs**: Custom tab navigation component
- **Tab Bar**: Bottom navigation with three main tabs

### Mobile-Specific Adaptations

#### Components
- Uses React Native components (`View`, `Text`, `TouchableOpacity`, etc.)
- Platform-specific styling with `StyleSheet`
- Native navigation patterns
- Mobile-optimized form inputs

#### Features Implemented
1. **Authentication**
   - Email/password sign in and sign up
   - Secure form validation
   - Error handling with native alerts

2. **Expenses Management**
   - List view with pull-to-refresh
   - Add new expenses with mobile-optimized forms
   - Category selection with horizontal scroll
   - Form validation and success feedback

3. **Settings**
   - Account information display
   - Sign out functionality
   - App information

#### Platform Considerations
- **iOS**: Native feel with appropriate padding and navigation
- **Android**: Material design patterns
- **Responsive**: Adapts to different screen sizes

## Development Workflow

### 1. Start Development Server
```bash
npm run mobile
```

### 2. Testing Options

#### Option A: Expo Go (Recommended for development)
1. Install Expo Go from App Store/Google Play
2. Scan QR code from terminal
3. App will load on your device

#### Option B: Simulators
```bash
# For Android (requires Android Studio)
npm run android

# For iOS (requires macOS and Xcode)
npm run ios
```

### 3. Live Reload
- Changes automatically reload on device
- Fast refresh maintains component state
- Error overlay shows issues immediately

## Code Sharing with Web

### Shared Code
- `useAuth.ts`: Authentication logic
- `supabase.ts`: Backend API client
- Type definitions and interfaces
- Business logic and data models

### Platform-Specific Code
- Web: `src/App.tsx` and `src/components/`
- Mobile: `src/App.native.tsx` and `src/components/mobile/`

### File Naming Convention
- `.tsx`: Web React components
- `.native.tsx`: React Native components
- Shared files: No platform suffix

## Current Limitations & Roadmap

### Implemented ✅
- Basic authentication flow
- Expense listing and creation
- Simple navigation
- Form validation
- Settings management

### Coming Soon 🚧
- Camera integration for receipt photos
- Expense editing functionality
- Claims management
- Push notifications
- Offline support
- Enhanced navigation (React Navigation)

### Future Features 🔮
- Biometric authentication
- Expense categories management
- Advanced filtering and search
- Data export
- Multi-language support

## Troubleshooting

### Common Issues

1. **Metro bundler not starting**
   ```bash
   npx expo start --clear
   ```

2. **Dependencies out of sync**
   ```bash
   npm install
   npx expo install --fix
   ```

3. **TypeScript errors**
   - Check `tsconfig.json` extends `expo/tsconfig.base`
   - Ensure all React Native types are imported correctly

4. **Platform-specific errors**
   - Verify you're using React Native components in mobile files
   - Check import paths are correct

### Performance Tips
- Use `StyleSheet.create()` for styles
- Optimize images for mobile screens
- Implement proper loading states
- Use React Native DevTools for debugging

## Building for Production

### Development Build
```bash
npx expo build:android
npx expo build:ios
```

### Expo Application Services (EAS)
For production builds, configure EAS Build:
```bash
npx expo install @expo/cli
npx eas build:configure
npx eas build --platform all
```

## Testing Strategy

### Manual Testing
1. Test authentication flow
2. Verify expense creation
3. Check navigation between tabs
4. Test form validation
5. Verify error handling

### Device Testing
- Test on both iOS and Android
- Various screen sizes
- Different OS versions
- Network connectivity scenarios

## Best Practices

### Code Organization
- Keep mobile components in `components/mobile/`
- Share business logic in hooks
- Use TypeScript for type safety
- Follow React Native style conventions

### Performance
- Optimize list rendering with proper keys
- Use appropriate loading states
- Minimize re-renders with React.memo
- Handle async operations properly

### User Experience
- Provide immediate feedback for actions
- Use native UI patterns
- Handle edge cases gracefully
- Maintain consistent styling