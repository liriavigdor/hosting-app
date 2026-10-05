import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDEt" + "Bg4ghLe09UIigjTnf-mH9eiRgs5kJA",
  authDomain: "hosting-app-9fa90.firebaseapp.com",
  projectId: "hosting-app-9fa90",
  storageBucket: "hosting-app-9fa90.firebasestorage.app",
  messagingSenderId: "993772230266",
  appId: "1:993772230266:web:cf7092a04af3ada74b8dc3",
  measurementId: "G-G7XNFH2XSB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, { experimentalForceLongPolling: true });
export const auth = getAuth(app);
