import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';
import { AppState, PermissionsAndroid, Platform } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';

const NotificationsContext = createContext({
  notifications: [],
  unreadCount: 0,
  loading: false,
  permissionStatus: 'unknown',
  requestPermission: async () => false,
  refreshNotifications: async () => [],
  markAsRead: async () => {},
  markAllAsRead: async () => {},
});

const NOTIFICATIONS_LIMIT = 50;

const DEMO_NOTIFICATIONS = [
  {
    id: 'demo-1',
    title: '🌱 Welcome to KisanOne',
    body: 'Stay tuned for product updates and agronomy tips tailored to your needs.',
    createdAt: new Date(Date.now() - 45 * 60 * 1000),
    read: false,
    type: 'general',
    data: {},
    demo: true,
  },
  {
    id: 'demo-2',
    title: '🚜 Order Packed',
    body: 'Your recent order #KO-1027 is being prepared for dispatch.',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    read: false,
    type: 'order',
    data: {},
    demo: true,
  },
  {
    id: 'demo-3',
    title: '☀️ Weather Alert',
    body: 'Light showers expected in your region this evening. Consider covering sensitive crops.',
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000),
    read: true,
    type: 'alert',
    data: {},
    demo: true,
  },
];

const mapNotificationDoc = (doc) => {
  if (!doc || !doc.exists) return null;
  const data = doc.data() || {};
  const createdAtRaw = data.createdAt;
  let createdAt = createdAtRaw;
  if (createdAtRaw?.toDate) {
    createdAt = createdAtRaw.toDate();
  } else if (typeof createdAtRaw === 'number') {
    createdAt = new Date(createdAtRaw);
  } else if (!createdAtRaw) {
    createdAt = new Date(0);
  }

  return {
    id: doc.id,
    title: data.title || 'New notification',
    body: data.body || '',
    createdAt,
    read: Boolean(data.read),
    type: data.type || 'general',
    cta: data.cta || null,
    data: data.data || {},
    ...data.extra,
  };
};

const requestAndroidNotificationsPermission = async () => {
  if (Platform.OS !== 'android') return true;
  if ((Platform.Version || 0) < 33) return true;

  try {
    const alreadyGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (alreadyGranted) return true;

    const status = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    return status === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    console.warn('Android notifications permission request failed:', error);
    return false;
  }
};

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('unknown'); // 'unknown' | 'granted' | 'denied'
  const [unreadCount, setUnreadCount] = useState(
    DEMO_NOTIFICATIONS.filter((item) => !item.read).length,
  );

  const unsubscribeSnapshotRef = useRef(null);
  const unsubscribeTokenRefreshRef = useRef(null);
  const unsubscribeOnMessageRef = useRef(null);
  const currentUserIdRef = useRef(null);

  const updateUnreadCount = useCallback((items) => {
    const totalUnread = (items || []).reduce(
      (total, item) => total + (item?.read ? 0 : 1),
      0,
    );
    setUnreadCount(totalUnread);
  }, []);

  const setNotificationState = useCallback(
    (items) => {
      const mapped = (items || []).map(mapNotificationDoc).filter(Boolean);
      setNotifications((prev) => {
        const localOnlyItems = prev.filter(
          (entry) =>
            entry?.localOnly &&
            !mapped.some((mappedEntry) => mappedEntry.id === entry.id),
        );
        const combined = [...localOnlyItems, ...mapped];
        const resolved = combined.length > 0 ? combined : DEMO_NOTIFICATIONS;
        updateUnreadCount(resolved);
        return resolved;
      });
    },
    [updateUnreadCount],
  );

  const refreshNotifications = useCallback(async () => {
    const uid = currentUserIdRef.current;
    if (!uid) {
      setNotifications(DEMO_NOTIFICATIONS);
      updateUnreadCount(DEMO_NOTIFICATIONS);
      return DEMO_NOTIFICATIONS;
    }

    try {
      setLoading(true);
      const snapshot = await firestore()
        .collection('users')
        .doc(uid)
        .collection('notifications')
        .orderBy('createdAt', 'desc')
        .limit(NOTIFICATIONS_LIMIT)
        .get();

      setNotificationState(snapshot.docs);
      return snapshot.docs.map(mapNotificationDoc).filter(Boolean);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
      setNotifications(DEMO_NOTIFICATIONS);
      updateUnreadCount(DEMO_NOTIFICATIONS);
      return DEMO_NOTIFICATIONS;
    } finally {
      setLoading(false);
    }
  }, [setNotificationState, updateUnreadCount]);

  const detachSnapshot = useCallback(() => {
    if (unsubscribeSnapshotRef.current) {
      unsubscribeSnapshotRef.current();
      unsubscribeSnapshotRef.current = null;
    }
  }, []);

  const detachOnMessage = useCallback(() => {
    if (unsubscribeOnMessageRef.current) {
      unsubscribeOnMessageRef.current();
      unsubscribeOnMessageRef.current = null;
    }
  }, []);

  const detachTokenRefresh = useCallback(() => {
    if (unsubscribeTokenRefreshRef.current) {
      unsubscribeTokenRefreshRef.current();
      unsubscribeTokenRefreshRef.current = null;
    }
  }, []);

  const cleanupAllListeners = useCallback(() => {
    detachSnapshot();
    detachOnMessage();
    detachTokenRefresh();
  }, [detachOnMessage, detachSnapshot, detachTokenRefresh]);

  const markAsRead = useCallback(async (notificationId) => {
    const uid = currentUserIdRef.current;
    if (!notificationId) return;
    if (!uid) {
      setNotifications((prev) => {
        const updated = prev.map((item) =>
          item.id === notificationId ? { ...item, read: true } : item,
        );
        updateUnreadCount(updated);
        return updated.length > 0 ? updated : DEMO_NOTIFICATIONS;
      });
      return;
    }

    try {
      await firestore()
        .collection('users')
        .doc(uid)
        .collection('notifications')
        .doc(notificationId)
        .set(
          {
            read: true,
            readAt: firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
    } catch (error) {
      console.error(`Failed to mark notification ${notificationId} as read:`, error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const uid = currentUserIdRef.current;
    if (!uid) {
      setNotifications((prev) => {
        const updated = prev.map((notificationItem) => ({
          ...notificationItem,
          read: true,
        }));
        updateUnreadCount(updated);
        return updated.length > 0 ? updated : DEMO_NOTIFICATIONS;
      });
      return;
    }
    const unreadNotifications = notifications.filter((item) => !item.read);
    if (unreadNotifications.length === 0) return;

    try {
      const batch = firestore().batch();
      unreadNotifications.forEach((notificationItem) => {
        const ref = firestore()
          .collection('users')
          .doc(uid)
          .collection('notifications')
          .doc(notificationItem.id);
        batch.set(
          ref,
          { read: true, readAt: firestore.FieldValue.serverTimestamp() },
          { merge: true },
        );
      });
      await batch.commit();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [notifications]);

  const saveFcmToken = useCallback(async (uid, token) => {
    if (!uid || !token) return;

    try {
      await firestore().collection('users').doc(uid).set(
        {
          fcmTokens: firestore.FieldValue.arrayUnion(token),
          lastFcmToken: token,
          fcmTokenUpdatedAt: firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    } catch (error) {
      console.error('Failed to save FCM token:', error);
    }
  }, []);

  const registerMessagingToken = useCallback(
    async (uid) => {
      if (!uid) return;

      try {
        await messaging().registerDeviceForRemoteMessages();
        const token = await messaging().getToken();
        if (token) {
          await saveFcmToken(uid, token);
        }

        detachTokenRefresh();
        unsubscribeTokenRefreshRef.current = messaging().onTokenRefresh(async (newToken) => {
          await saveFcmToken(uid, newToken);
        });
      } catch (error) {
        console.error('Failed to register FCM token:', error);
      }
    },
    [detachTokenRefresh, saveFcmToken],
  );

  const requestPermission = useCallback(async () => {
    try {
      const androidGranted = await requestAndroidNotificationsPermission();
      if (!androidGranted) {
        setPermissionStatus('denied');
        return false;
      }

      if (Platform.OS === 'ios') {
        const authorizationStatus = await messaging().requestPermission();
        const enabled =
          authorizationStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authorizationStatus === messaging.AuthorizationStatus.PROVISIONAL;

        setPermissionStatus(enabled ? 'granted' : 'denied');
        return enabled;
      }

      setPermissionStatus('granted');
      return true;
    } catch (error) {
      console.error('Notifications permission request failed:', error);
      setPermissionStatus('denied');
      return false;
    }
  }, []);

  const initialiseMessagingListener = useCallback(() => {
    detachOnMessage();
    unsubscribeOnMessageRef.current = messaging().onMessage(async (remoteMessage) => {
      const uid = currentUserIdRef.current;
      const title =
        remoteMessage?.notification?.title ||
        remoteMessage?.data?.title ||
        'New notification';
      const body =
        remoteMessage?.notification?.body || remoteMessage?.data?.body || '';

      const localNotification = {
        id: remoteMessage?.messageId || `local-${Date.now()}`,
        title,
        body,
        createdAt: new Date(),
        read: false,
        type: remoteMessage?.data?.type || 'general',
        data: remoteMessage?.data || {},
        source: 'foreground',
        localOnly: true,
      };

      setNotifications((prev) => {
        const existing = prev.find((item) => item.id === localNotification.id);
        if (existing) {
          return prev;
        }
        const next = [localNotification, ...prev];
        updateUnreadCount(next);
        return next;
      });

      // If the message is also persisted in Firestore, the snapshot listener
      // will reconcile state shortly. We can trigger a refresh to reduce delay.
      if (uid) {
        refreshNotifications();
      }
    });
  }, [detachOnMessage, refreshNotifications, updateUnreadCount]);

  const subscribeToNotifications = useCallback(
    (uid) => {
      detachSnapshot();
      if (!uid) return;

      try {
        unsubscribeSnapshotRef.current = firestore()
          .collection('users')
          .doc(uid)
          .collection('notifications')
          .orderBy('createdAt', 'desc')
          .limit(NOTIFICATIONS_LIMIT)
          .onSnapshot(
            (snapshot) => {
              setNotificationState(snapshot.docs);
            },
            (error) => {
              console.error('Notifications snapshot error:', error);
            },
          );
      } catch (error) {
        console.error('Failed to subscribe to notifications:', error);
      }
    },
    [detachSnapshot, setNotificationState],
  );

  const handleUserChanged = useCallback(
    async (user) => {
      cleanupAllListeners();
      currentUserIdRef.current = user?.uid || null;

      if (!user) {
        setNotifications(DEMO_NOTIFICATIONS);
        setUnreadCount(DEMO_NOTIFICATIONS.filter((item) => !item.read).length);
        setPermissionStatus('unknown');
        return;
      }

      setNotifications([]);
      setUnreadCount(0);

      const granted = await requestPermission();
      if (granted) {
        await registerMessagingToken(user.uid);
        initialiseMessagingListener();
      }

      subscribeToNotifications(user.uid);
    },
    [
      cleanupAllListeners,
      initialiseMessagingListener,
      registerMessagingToken,
      requestPermission,
      subscribeToNotifications,
    ],
  );

  useEffect(() => {
    const unsubscribeAuth = auth().onAuthStateChanged((user) => {
      handleUserChanged(user);
    });
    return unsubscribeAuth;
  }, [handleUserChanged]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refreshNotifications();
      }
    });
    return () => subscription.remove();
  }, [refreshNotifications]);

  useEffect(() => () => cleanupAllListeners(), [cleanupAllListeners]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      permissionStatus,
      requestPermission,
      refreshNotifications,
      markAsRead,
      markAllAsRead,
    }),
    [
      notifications,
      unreadCount,
      loading,
      permissionStatus,
      requestPermission,
      refreshNotifications,
      markAsRead,
      markAllAsRead,
    ],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);

export default NotificationsContext;

