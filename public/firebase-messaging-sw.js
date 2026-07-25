importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCpUO1kLXAZ1RVFRzWK3Mdg97oKwuv9mz4",
  authDomain: "club-lc-prado.firebaseapp.com",
  projectId: "club-lc-prado",
  storageBucket: "club-lc-prado.firebasestorage.app",
  messagingSenderId: "100855207236",
  appId: "1:100855207236:web:ebdf719c0c7524098bb311"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Club LC Prado";
  const options = {
    body: payload.notification?.body || "",
    icon: "/logo192.png",
  };
  self.registration.showNotification(title, options);
});