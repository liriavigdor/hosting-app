import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
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
export const db = getFirestore(app);
export const auth = getAuth(app);
