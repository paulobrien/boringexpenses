# Boring Expenses - AI-Powered Expense Management App

**ALWAYS follow these instructions first and only fallback to additional search and context gathering if the information here is incomplete or found to be in error.**

Boring Expenses is a React TypeScript web application built with Vite that provides AI-powered expense management. The app features a marketing website and a protected expense management application backed by Supabase.

## Working Effectively

### Bootstrap and Environment Setup
- **Node.js Version**: Application tested with Node.js v20.19.4 and npm 10.8.2
- **Install Dependencies**: `npm install` - takes ~12 seconds to complete
- **Environment Variables**: 
  - Copy `.env.example` to `.env` and configure:
  - `VITE_SUPABASE_URL=your_supabase_project_url`
  - `VITE_SUPABASE_ANON_KEY=your_supabase_anon_key`
  - **CRITICAL**: The app will show "Missing Supabase environment variables" error without these

### Build and Development Commands
- **Development Server**: `npm run dev` - starts in ~189ms at http://localhost:5173/
- **Production Build**: `npm run build` - takes ~4.8 seconds. **NEVER CANCEL** - Set timeout to 120+ seconds minimum
- **Preview Built App**: `npm run preview` - serves production build at http://localhost:4173/
- **Linting**: `npm run lint` - takes ~1.7 seconds. **CRITICAL**: Currently has 6 errors and 3 warnings that do NOT prevent builds

### Expected Build Times and Timeouts
- **npm install**: ~12 seconds - Set timeout to 60+ seconds
- **npm run build**: ~4.8 seconds - Set timeout to 120+ seconds (lightweight app but allow buffer)
- **npm run lint**: ~1.7 seconds - Set timeout to 60+ seconds
- **npm run dev**: Starts immediately (~189ms) - Set timeout to 30+ seconds

## Validation and Testing

### Manual Validation Requirements
**ALWAYS manually validate changes by running through complete user scenarios:**

1. **Marketing Site Validation**:
   - Navigate to http://localhost:5173/
   - Verify homepage loads with "Make Expenses Boringly Simple" heading
   - Test navigation: Features, Pricing, About sections scroll properly
   - Click "Start Free Trial" buttons - should remain on page (form interactions)

2. **App Authentication Flow**:
   - Click "Sign In" in header navigation
   - Should redirect to /app and show login form
   - Verify "Welcome to Boring Expenses" heading appears
   - Email input field should be functional

3. **Build Validation**:
   - Run `npm run build` and ensure it completes successfully
   - Run `npm run preview` and verify both marketing site and app routes work
   - Check browser console for any errors

### Linting and Code Quality
- **Always run** `npm run lint` before committing changes
- **Known Issues**: Currently has linting warnings - build still succeeds
- Common linting errors to fix:
  - Unused imports (remove unused variables like 'Camera', 'ReactNode', 'PoundSterling')
  - Missing useEffect dependencies (add missing dependencies to dependency arrays)
  - Unused parameters (prefix with underscore or remove)

### No Testing Framework
- **IMPORTANT**: This repository has NO test files or testing framework
- Validation must be done manually through browser testing
- Focus on functional testing through the UI

## Codebase Structure and Navigation

### Key Directories and Files
```
├── src/
│   ├── App.tsx                 # Main router and auth logic
│   ├── components/
│   │   ├── MarketingSite.tsx   # Landing page component
│   │   ├── auth/LoginForm.tsx  # Authentication component
│   │   └── app/                # Protected app components
│   │       ├── AppLayout.tsx   # Main app layout
│   │       ├── AddExpense.tsx  # Expense submission form
│   │       ├── ViewExpenses.tsx# Expense list and management
│   │       └── Settings.tsx    # User settings
│   ├── hooks/
│   │   └── useAuth.ts          # Authentication hook
│   └── lib/
│       └── supabase.ts         # Supabase client and types
├── supabase/
│   ├── functions/              # Supabase Edge Functions
│   │   └── extract-receipt-data/
│   └── migrations/             # Database migrations
├── package.json                # Dependencies and scripts
├── vite.config.ts             # Vite configuration
├── tailwind.config.js         # Tailwind CSS config
└── .env.example               # Environment template
```

### Important File Relationships
- **Always check** `src/lib/supabase.ts` when modifying database types or API calls
- **After changing** authentication logic, test both marketing site and protected routes
- **When modifying** expense components, check both `AddExpense.tsx` and `ViewExpenses.tsx`
- **Environment changes** require restarting the dev server

## Technology Stack Details

### Core Technologies
- **Frontend**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.4.8 (very fast builds)
- **Routing**: React Router DOM 7.7.1
- **Styling**: Tailwind CSS 3.4.1 with PostCSS
- **Backend**: Supabase (authentication, database, edge functions)
- **Icons**: Lucide React 0.344.0

### Development Tools
- **Linting**: ESLint with TypeScript support
- **Type Checking**: TypeScript 5.5.3
- **Package Manager**: npm (use npm, not yarn or pnpm)

## Common Tasks and Workflows

### Adding New Features
1. Create components in appropriate `src/components/` subdirectory
2. Add routes in `src/App.tsx` if needed
3. Update Supabase types in `src/lib/supabase.ts` for database changes
4. Test manually through browser
5. Run `npm run lint` and fix any new errors
6. Test build with `npm run build`

### Database Schema Changes
1. Create new migration in `supabase/migrations/`
2. Update TypeScript types in `src/lib/supabase.ts`
3. Test components that use the affected tables
4. Verify both create and read operations work

### Working with Supabase Edge Functions
- Functions are in `supabase/functions/`
- Current function: `extract-receipt-data` for OCR processing
- Test locally using Supabase CLI if available
- Functions use Deno runtime, not Node.js

### Styling Guidelines
- Use Tailwind CSS classes exclusively
- Follow existing component patterns for consistency
- Responsive design: mobile-first approach
- Color scheme: Blue and amber gradients with professional styling

## Troubleshooting Common Issues

### Environment Variable Errors
- **Error**: "Missing Supabase environment variables"
- **Solution**: Ensure `.env` file exists with proper VITE_SUPABASE_* variables

### Build Warnings
- **Large chunk size warnings**: Normal for this app, builds successfully
- **Browserslist outdated**: Cosmetic warning, doesn't affect functionality

### Linting Errors
- **TypeScript version warning**: Currently using unsupported version, still works
- **Unused variables**: Remove imports or prefix with underscore
- **useEffect dependencies**: Add missing dependencies to dependency arrays

### Development Server Issues
- **Port conflicts**: Default is :5173, use `--port` flag to change
- **Hot reload not working**: Restart dev server, check for syntax errors

## Performance Expectations

### Build Performance
- **Clean install**: ~12 seconds for all dependencies
- **Incremental builds**: Near-instant with Vite HMR
- **Production build**: ~4.8 seconds for full optimization
- **Bundle size**: ~792KB JavaScript (acceptable for feature set)

### Runtime Performance
- **Initial page load**: Very fast due to static marketing site
- **App navigation**: Instant client-side routing
- **Supabase calls**: Dependent on network and Supabase performance

---

## Quick Reference Commands

```bash
# Setup
npm install
cp .env.example .env  # Configure environment

# Development
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Test production build
npm run lint         # Code quality check

# Validation
# 1. Visit http://localhost:5173/ - test marketing site
# 2. Click "Sign In" - test app authentication
# 3. Check browser console for errors
# 4. Run npm run build - ensure successful build
```

**Remember**: This is a lightweight React app with fast builds. Most operations complete in seconds, but always set appropriate timeouts and never cancel operations prematurely.