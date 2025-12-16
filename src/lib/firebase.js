const isBrowser = typeof window !== 'undefined';
let db;
let auth;
let googleProvider;
let signInWithPopup; 
let createUserWithEmailAndPassword;
let signInWithEmailAndPassword;

export async function getFirebase() {
  if (db && auth) {
    return { db, auth, googleProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword };
  }

  const { initializeApp } = await import('firebase/app');
  const { 
    getFirestore, 
    initializeFirestore, 
    persistentLocalCache, 
    persistentMultipleTabManager 
  } = await import('firebase/firestore');
  
  const AuthSDK = await import('firebase/auth');

  const firebaseConfig = {
    apiKey: import.meta.env.VITE_API_KEY,
    authDomain: import.meta.env.VITE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_APP_ID
  };

  const app = initializeApp(firebaseConfig);

  if (isBrowser) {
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    } catch (err) {
      console.warn("Persistence init failed, falling back to standard:", err);
      db = getFirestore(app);
    }
  } else {
    db = getFirestore(app);
  }

  auth = AuthSDK.getAuth(app);
  googleProvider = new AuthSDK.GoogleAuthProvider();
  signInWithPopup = AuthSDK.signInWithPopup;
  createUserWithEmailAndPassword = AuthSDK.createUserWithEmailAndPassword;
  signInWithEmailAndPassword = AuthSDK.signInWithEmailAndPassword;
  
  return { db, auth, googleProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword };
}
