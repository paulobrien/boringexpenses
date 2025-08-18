import React, { createContext, useContext, useEffect, useState } from 'react';
import { createOfflineDatabase, OfflineDB } from '../lib/offline';

interface OfflineContextType {
  db: OfflineDB | null;
  isOnline: boolean;
  isLoading: boolean;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<OfflineDB | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        const database = await createOfflineDatabase();
        setDb(database);
      } catch (error) {
        console.error('Failed to initialize offline database:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeDatabase();
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <OfflineContext.Provider value={{ db, isOnline, isLoading }}>
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};