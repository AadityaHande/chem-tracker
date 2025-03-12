// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCBXje6fKRL73zosDAyoaOjgWqZMTDtAKk",
  authDomain: "labchem-tracker.firebaseapp.com",
  projectId: "labchem-tracker",
  storageBucket: "labchem-tracker.firebasestorage.app",
  messagingSenderId: "313862849960",
  appId: "1:313862849960:web:94f024f262154389a9899d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
