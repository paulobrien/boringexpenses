import React from 'react';
import { Wifi, WifiOff, Clock } from 'lucide-react';
import { useOffline } from '../hooks/useOffline';
import { useOfflineExpenses } from '../hooks/useOfflineExpenses';

const OfflineStatus: React.FC = () => {
  const { isOnline } = useOffline();
  const { getPendingCount } = useOfflineExpenses();
  const [pendingCount, setPendingCount] = React.useState(0);

  React.useEffect(() => {
    const updatePendingCount = async () => {
      const count = await getPendingCount();
      setPendingCount(count);
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [getPendingCount]);

  if (isOnline && pendingCount === 0) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm">
        <Wifi className="h-4 w-4" />
        <span>Online</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 text-orange-600 text-sm">
        <WifiOff className="h-4 w-4" />
        <span>Offline</span>
        {pendingCount > 0 && (
          <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
            {pendingCount} pending
          </span>
        )}
      </div>
    );
  }

  // Online but has pending items
  return (
    <div className="flex items-center gap-2 text-blue-600 text-sm">
      <Clock className="h-4 w-4" />
      <span>Syncing</span>
      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
        {pendingCount} pending
      </span>
    </div>
  );
};

export default OfflineStatus;