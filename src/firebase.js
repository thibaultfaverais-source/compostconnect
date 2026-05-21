// ─── CONFIGURATION FIREBASE ───────────────────────────────────────────────────
// 1. Allez sur https://console.firebase.google.com
// 2. Créez un projet (ex: "compostconnect-smieeom")
// 3. Ajoutez une app Web (icône </>)
// 4. Copiez les valeurs de firebaseConfig ci-dessous
// 5. Dans Firebase Console → Firestore Database → Créer une base de données
//    Choisissez "Mode production" puis votre région (eur3 pour Europe)
// 6. Dans Règles Firestore, collez ces règles et publiez :
//
//    rules_version = '2';
//    service cloud.firestore {
//      match /databases/{database}/documents {
//        match /{document=**} {
//          allow read, write: if true;
//        }
//      }
//    }

import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
