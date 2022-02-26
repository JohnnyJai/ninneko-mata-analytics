// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBMn26hyahWWRzYrmfSfHAjcICfBcU5VGk",
  authDomain: "p2e-analytics.firebaseapp.com",
  projectId: "p2e-analytics",
  storageBucket: "p2e-analytics.appspot.com",
  messagingSenderId: "336980112418",
  appId: "1:336980112418:web:a55550b829d696a9c5c67b"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);