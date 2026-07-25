import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCpUO1kLXAZ1RVFRzWK3Mdg97oKwuv9mz4",
  authDomain: "club-lc-prado.firebaseapp.com",
  projectId: "club-lc-prado",
  storageBucket: "club-lc-prado.firebasestorage.app",
  messagingSenderId: "100855207236",
  appId: "1:100855207236:web:ebdf719c0c7524098bb311",
  measurementId: "G-33Z4582FFY",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const getMessagingInstance = async () => {
  const supported = await isSupported().catch(() => false);
  if (!supported) return null;
  return getMessaging(app);
};

const VAPID_KEY = "BDtPjJHsBndCNCbpYiELiRbKoAfK39SxqJspZGpXRH1xr4X13ksKWkrdwBZsurC5th-y19Y3hwFMRYKynuzR0ww";

export const enablePushForUser = async (uid) => {
  try {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const { getToken } = await import("firebase/messaging");
    const { doc, updateDoc } = await import("firebase/firestore");

    const messaging = await getMessagingInstance();
    if (!messaging) return;

    const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: reg,
    });

    if (token) {
      await updateDoc(doc(db, "members", uid), { fcmToken: token });
    }
  } catch (err) {
    console.error("push setup failed", err);
  }
};