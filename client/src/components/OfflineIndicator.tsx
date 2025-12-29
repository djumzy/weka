import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Wifi } from 'lucide-react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  if (isOnline) {
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 hidden sm:flex">
        <Wifi className="w-3 h-3 mr-1" />
        Online
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
      <WifiOff className="w-3 h-3 mr-1" />
      <span className="hidden sm:inline">Offline</span>
      <span className="sm:hidden">Off</span>
    </Badge>
  );
}