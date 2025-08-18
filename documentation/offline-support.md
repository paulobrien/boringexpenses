# Offline Support Implementation

This document describes the offline functionality added to Boring Expenses to support mobile users who may not have consistent phone signal when filing expenses.

## Overview

The offline support system allows users to:
- Create, edit, and delete expenses without an internet connection
- View previously synced expenses and claims when offline  
- See visual indicators of connection status and pending sync operations
- Automatically sync changes when connectivity is restored

## Technical Implementation

### Storage Layer
- **IndexedDB**: Local browser database for storing expenses, claims, and categories
- **Automatic Sync**: Periodic background sync every 30 seconds when online
- **Conflict Resolution**: Simple last-write-wins strategy

### Key Components

#### 1. Offline Database (`src/lib/offline.ts`)
- IndexedDB wrapper with stores for expenses, claims, and categories
- Automatic sync functionality to Supabase when online
- Tracks pending changes with `_pending_upload` and `_synced` flags

#### 2. Offline Context (`src/hooks/useOffline.tsx`)
- React context providing offline database instance
- Online/offline status tracking
- Database initialization and lifecycle management

#### 3. Offline Expenses Hook (`src/hooks/useOfflineExpenses.ts`)
- Unified interface for expense operations (create, read, update, delete)
- Intelligent fallback: try online first, fallback to offline
- Pending operation counting for status display

#### 4. Offline Status Component (`src/components/OfflineStatus.tsx`)
- Visual indicator showing connection status
- Displays count of pending operations
- Updates automatically every 5 seconds

### User Experience

#### Online Mode
- Normal operation with immediate Supabase sync
- Green "Online" indicator in sidebar and mobile header
- Real-time data synchronization

#### Offline Mode  
- All expense operations continue to work
- Orange "Offline" indicator with pending count
- Success messages indicate "Saved offline - will sync when connection is restored"
- Local data persistence using IndexedDB

#### Sync Mode
- Blue "Syncing" indicator when online but has pending changes
- Automatic background sync every 30 seconds
- Manual sync trigger when going from offline to online

### Image Handling

#### Online
- Images uploaded immediately to Supabase storage
- Standard file upload flow maintained

#### Offline
- Images stored as base64 data URLs in local database
- Deferred upload when connectivity restored
- Fallback display for offline-stored images

### Limitations

1. **Image Upload**: Large images stored as base64 may impact performance
2. **Conflict Resolution**: Simple last-write-wins, no merge capabilities  
3. **Storage Limits**: IndexedDB has browser storage quotas
4. **Server Features**: OCR receipt processing requires online connection

### Files Modified

- `src/App.tsx` - Added OfflineProvider wrapper
- `src/components/app/AppLayout.tsx` - Added OfflineStatus indicator
- `src/components/app/AddExpense.tsx` - Offline-aware expense creation
- `src/components/app/ViewExpenses.tsx` - Offline-aware expense loading
- `src/components/app/EditExpenseModal.tsx` - Offline-aware expense editing
- `package.json` - Removed PowerSync dependencies (simplified approach)

### Future Enhancements

1. **PowerSync Integration**: For more robust real-time sync with conflict resolution
2. **Service Worker**: For true offline-first experience with background sync
3. **Image Compression**: Reduce storage footprint for offline images
4. **Batch Operations**: Optimize sync performance for multiple pending changes
5. **Progress Indicators**: Show sync progress for large datasets

## Testing Offline Functionality

1. **Simulate Offline**: Use browser DevTools Network tab → "Offline" 
2. **Create Expenses**: Add expenses while offline, verify local storage
3. **Go Online**: Re-enable network, verify automatic sync
4. **Status Indicators**: Confirm UI shows correct offline/online/syncing states
5. **Image Handling**: Test image upload both online and offline

## Monitoring

The implementation includes console logging for:
- Offline database initialization 
- Sync operations and failures
- Fallback to offline mode
- Pending operation counts

Check browser console for detailed sync status and any errors during operation.