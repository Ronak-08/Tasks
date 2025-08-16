let db;
let auth;
let googleProvider;

export async function getFirebase() {
  if (db && auth) {
    return { db, auth, googleProvider };
  }

  const { initializeApp } = await import('firebase/app');
  const { getFirestore } = await import('firebase/firestore');
  const { getAuth, GoogleAuthProvider } = await import('firebase/auth');
  
  // -------------------------

  const firebaseConfig = {
    apiKey: import.meta.env.VITE_API_KEY,
    authDomain: import.meta.env.VITE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_APP_ID
  };

  const app = initializeApp(firebaseConfig);
  
  db = getFirestore(app);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();

  return { db, auth, googleProvider };
}
