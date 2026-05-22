import { initializeApp, getApps, getApp }
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getFirestore, collection, addDoc, getDocs,
  onSnapshot, doc, setDoc, getDoc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
  getStorage, ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCojXNcEUa56aPHl1EbY1mWaKQPZFKxxnM",
  authDomain: "mayblog-9fe91.firebaseapp.com",
  projectId: "mayblog-9fe91",
  storageBucket: "mayblog-9fe91.appspot.com",
  messagingSenderId: "582766247165",
  appId: "1:582766247165:web:52ada5674baffafd5fd294"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage, collection, addDoc, getDocs, onSnapshot, doc, setDoc, getDoc, updateDoc, deleteDoc, ref, uploadBytes, getDownloadURL };
