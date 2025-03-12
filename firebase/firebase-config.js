import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Replace these with your actual Firebase project configuration details
const firebaseConfig = {
  apiKey: "AIzaSyA7YubYlcBTuXYcLm7zH0W5JD0S0QqP3bI",
  authDomain: "chem-trial.firebaseapp.com",
  projectId: "chem-trial",
  storageBucket: "chem-trial.firebasestorage.app",
  messagingSenderId: "774165499720",
  appId: "1:774165499720:web:397fccc1491b053830ed7d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
