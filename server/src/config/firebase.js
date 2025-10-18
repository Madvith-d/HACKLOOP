// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDwAkj3VS3voMJb8lOtTmWSGvFSOiAXTt0",
  authDomain: "mind-mesh-adbad.firebaseapp.com",
  projectId: "mind-mesh-adbad",
  storageBucket: "mind-mesh-adbad.firebasestorage.app",
  messagingSenderId: "928344789987",
  appId: "1:928344789987:web:c63967b1402648084c46d6",
  measurementId: "G-LLDNGKBPJF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);