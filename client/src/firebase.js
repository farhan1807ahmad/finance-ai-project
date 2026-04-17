import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAEwjR3DISS0f3u7W5t9MwzEIB7xrSjMUs",
  authDomain: "auramesh-f21e2.firebaseapp.com",
  projectId: "auramesh-f21e2",
  storageBucket: "auramesh-f21e2.firebasestorage.app",
  messagingSenderId: "576024417185",
  appId: "1:576024417185:web:79785c749aaa24428871e0",
  measurementId: "G-X89K72S8BT",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Auth
export const auth = getAuth(app);
