import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

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