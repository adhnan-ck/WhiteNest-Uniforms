import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCoMV5B9b-gpD0CekVXjNE-B0HmmAovEdM",
  authDomain: "shanid-db.firebaseapp.com",
  projectId: "shanid-db",
  storageBucket: "shanid-db.firebasestorage.app",
  messagingSenderId: "439761177241",
  appId: "1:439761177241:web:4f31a135caf967d8df4608",
  measurementId: "G-XL12S03RXX"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
