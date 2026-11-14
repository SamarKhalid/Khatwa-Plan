/**
 * Firebase web app configuration.
 *
 * These values are public identifiers, not secrets: they ship in every web bundle.
 * Access is protected by Firebase Authentication, Firestore/Storage security rules and the
 * "Authorized domains" list in the Firebase console (add the GitHub Pages domain there).
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyCfJA0B1v84wIUU79l4JUhZ2Jv1Qnxx9pE',
  authDomain: 'khatwa-plan.firebaseapp.com',
  projectId: 'khatwa-plan',
  storageBucket: 'khatwa-plan.firebasestorage.app',
  messagingSenderId: '1073933167708',
  appId: '1:1073933167708:web:92f59e80e3ce0aec128a99',
  measurementId: 'G-SHLC5ER27E',
} as const;

