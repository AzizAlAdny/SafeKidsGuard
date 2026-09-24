// Firebase Cloud Messaging Service Worker for Safe Kids Guard
// Fallback background push notifications for parents without WhatsApp

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyMockKeyForDev",
  authDomain: "safe-kids-guard.firebaseapp.com",
  projectId: "safe-kids-guard",
  storageBucket: "safe-kids-guard.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || '⚠️ تنبيه جديد - Safe Kids Guard';
  const notificationOptions = {
    body: payload.notification?.body || 'تم رصد نشاط غير آمن على جهاز طفلك.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    dir: 'rtl',
    lang: 'ar',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
