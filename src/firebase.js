import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCvishxOrmwvC2MhtiOhh1oLEEbLPamkrI",
  authDomain: "flourish-fitness.firebaseapp.com",
  projectId: "flourish-fitness",
  storageBucket: "flourish-fitness.firebasestorage.app",
  messagingSenderId: "941029788793",
  appId: "1:941029788793:web:b2474ccf5c356bcee898a8",
  measurementId: "G-YN9E3W7T70",
  databaseURL: "https://flourish-fitness-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app);

export { app, auth, db, storage };
