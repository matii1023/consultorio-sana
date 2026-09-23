import { useState, useEffect } from 'react';

export const useBrowserNotifications = () => {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') return 'unsupported';

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  };

  const notify = (title, options = {}) => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;

    const notification = new Notification(title, {
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      ...options,
    });

    setTimeout(() => notification.close(), 8000);
    return notification;
  };

  useEffect(() => {
    if (
      typeof Notification !== 'undefined' &&
      Notification.permission === 'default'
    ) {
      const timer = setTimeout(() => {
        requestPermission();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  return { permission, requestPermission, notify };
};