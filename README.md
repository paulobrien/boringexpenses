# Boring Expenses

A React TypeScript expense management application with both web and native mobile support using Expo.

## Features

- **Web Application**: Built with React, TypeScript, Vite, and Tailwind CSS
- **Native Mobile App**: Built with React Native and Expo
- **Shared Codebase**: Common business logic and components between platforms
- **Supabase Backend**: Authentication, database, and file storage
- **AI-Powered**: OCR receipt processing and smart categorization

## Development

### Prerequisites

- Node.js v20.19.4 or later
- npm 10.8.2 or later
- Expo CLI (installed automatically with dependencies)

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Configure your Supabase credentials in `.env`:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Running the Applications

#### Web Development
```bash
npm run dev          # Start web development server (Vite)
npm run build        # Build web application
npm run preview      # Preview built web application
```

#### Mobile Development
```bash
npm run mobile       # Start Expo development server
npm run start        # Alias for mobile development
npm run android      # Start for Android device/emulator
npm run ios          # Start for iOS device/simulator (macOS only)
```

#### Additional Commands
```bash
npm run lint         # Run ESLint
```

### Platform-Specific Files

- **Web**: Uses standard React components in `src/components/`
- **Mobile**: Uses React Native components in `src/components/mobile/`
- **Shared**: Authentication (`src/hooks/useAuth.ts`) and Supabase client (`src/lib/supabase.ts`)

### Project Structure

```
src/
├── App.tsx              # Web application entry point
├── App.native.tsx       # Mobile application entry point
├── components/
│   ├── app/            # Web app components
│   ├── mobile/         # Mobile app components
│   └── ...             # Shared/marketing components
├── hooks/
│   └── useAuth.ts      # Shared authentication logic
├── lib/
│   └── supabase.ts     # Shared Supabase client
└── ...
```

### Development Workflow

1. **Web Development**: Use `npm run dev` for fast development with Vite
2. **Mobile Development**: Use `npm run mobile` to start Expo dev server
3. **Testing**: Use Expo Go app on your phone or simulators for mobile testing
4. **Building**: Web builds with `npm run build`, mobile builds through Expo Build Service

### Mobile App Features

- ✅ Authentication (Sign in/Sign up)
- ✅ View expenses list with pull-to-refresh
- ✅ Add new expenses with form validation
- ✅ Category selection
- ✅ Settings and account management
- ✅ Simple tab navigation
- 🚧 Camera/photo upload (coming soon)
- 🚧 Expense editing (coming soon)
- 🚧 Claims management (coming soon)

### Technology Stack

#### Web
- React 18.3.1 + TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation

#### Mobile
- React Native with Expo SDK 52
- React Native components
- Custom tab navigation
- Platform-specific UI components

#### Shared
- Supabase for backend services
- TypeScript for type safety
- Shared authentication logic
- Common data models and API calls

## Deployment

### Web Deployment
Build the web application and deploy the `dist/` folder to any static hosting service.

### Mobile Deployment
Use Expo Build Service (EAS Build) to create production builds for app stores:
```bash
npx expo build:android
npx expo build:ios
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both web and mobile platforms
5. Submit a pull request

## License

This project is private and proprietary.
